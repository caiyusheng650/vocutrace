/* ============================================================
 * 词溯后端（零依赖 Node，JSON/JSONL 文件存储）
 * ------------------------------------------------------------
 * 运行：node server/index.js
 * 环境变量：
 *   CISHUO_PORT      监听端口，默认 8787
 *   CISHUO_DATA_DIR  数据目录，默认 server/data
 *   CISHUO_STRICT_SMS=1  强制校验短信验证码（上线必开）
 *   CISHUO_SECRET    token 签名密钥（不设则自动生成到 data/secret.key）
 *
 * 接口清单（与 js/api.js 里的 ★ 注释一一对应）：
 *   POST /api/auth/sms-code         开发验证码（mock 直接回传 code）
 *   POST /api/auth/login-by-phone   手机号登录，新号赠 5 个月会员
 *   POST /api/auth/wechat           微信登录（mock openid）
 *   GET  /api/user/vip              会员状态（服务端时间口径）
 *   POST /api/pay/vip/activate      开通/续费会员（mock 支付成功）
 *   POST /api/vip/reward-by-ad      广告奖励（服务端计数，每日 3 次）
 *   POST /api/user/sync-records     本机记录同步到账号
 *   GET  /api/user/stats            统计（由服务端记录计算）
 *   DELETE /api/user                注销账号（删除用户及其全部学习数据）
 * ============================================================ */
const http = require('node:http');
const crypto = require('node:crypto');
const Storage = require('./storage');
const Auth = require('./auth');

const PORT = Number(process.env.CISHUO_PORT || 8787);
const VIP_MONTHS = 5;            // 新注册赠送月数（与前端一致）
const VIP_AD_REWARD_DAYS = 3;    // 单次广告奖励天数
const VIP_AD_DAILY_LIMIT = 3;    // 每日广告奖励次数上限

const now = () => Date.now();

/* 按自然月顺延，月底溢出自动夹到当月最后一天 */
function addMonths(ts, months) {
  const d = new Date(ts);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d.getTime();
}

/* 会员有效性：服务端只认 vipExpireTime，不认前端传来的任何 vip 标记 */
function isVipActive(user) {
  return !!user && !!user.vipExpireTime && user.vipExpireTime > now();
}

function dayKey(ts) {
  const d = new Date(ts + 8 * 3600 * 1000); // 东八区自然日
  return d.toISOString().slice(0, 10);
}

function uidFromPhone(phone) {
  return `u_${crypto.createHash('sha256').update(`phone:${phone}`).digest('hex').slice(0, 12)}`;
}

function uidFromOpenId(openid) {
  return `u_${crypto.createHash('sha256').update(`wx:${openid}`).digest('hex').slice(0, 12)}`;
}

/* 返回给前端的用户结构（与 js/api.js 里 Store 的 user 字段对齐） */
function publicUser(u) {
  return {
    id: u.id,
    username: u.nickname || '同学',
    phone: u.phone || null,
    wechat: !!u.openid,
    wechatOpenId: u.openid || null,
    guest: false,
    loggedIn: true,
    authMode: u.openid ? 'wechat' : 'phone',
    vip: isVipActive(u),
    vipExpireTime: u.vipExpireTime || null,
    vipGrantedAt: u.vipGrantedAt || null,
    onboarded: !!u.onboarded,
    wordbook: u.wordbook || 'zk',
    level: u.level || 'general',
  };
}

/* ---------------- HTTP 小工具 ---------------- */
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // 开发者按需收窄为站点域名
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error('请求体过大'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error('请求体不是合法 JSON'));
      }
    });
    req.on('error', reject);
  });
}

function requireUser(req) {
  const header = String(req.headers.authorization || '');
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const payload = Auth.verifyToken(token);
  if (!payload) return null;
  return Storage.getUserById(payload.uid);
}

/* ---------------- 业务处理 ---------------- */

/* 发送验证码：mock 直接回传 code，真实环境调用短信服务商后删掉 code 字段 */
function handleSmsCode(body) {
  const phone = String(body.phone || '').trim();
  if (!/^1\d{10}$/.test(phone)) return { status: 400, body: { ok: false, error: '请输入 11 位手机号' } };
  const code = Auth.issueSmsCode(phone);
  const strict = process.env.CISHUO_STRICT_SMS === '1';
  // 严格模式下必须真实下发短信，绝不能把验证码回给前端
  return { status: 200, body: strict ? { ok: true } : { ok: true, mock: true, code } };
}

/* 手机号登录：首次注册赠送 VIP_MONTHS 个月；老账号按已有到期时间判定 */
async function handlePhoneLogin(body) {
  const phone = String(body.phone || '').trim();
  const code = String(body.code || '').trim();
  if (!/^1\d{10}$/.test(phone)) return { status: 400, body: { ok: false, error: '请输入 11 位手机号' } };
  if (!Auth.verifySmsCode(phone, code)) return { status: 400, body: { ok: false, error: '验证码错误或已过期' } };

  let user = Storage.findUserByPhone(phone);
  const isNew = !user;
  if (!user) {
    const ts = now();
    user = {
      id: uidFromPhone(phone),
      phone,
      openid: null,
      nickname: `用户${phone.slice(-4)}`,
      createdAt: ts,
      vipExpireTime: addMonths(ts, VIP_MONTHS),
      vipGrantedAt: ts,
      vipLastRewardAt: null,
    };
    await Storage.upsertUser(user);
  }

  const token = Auth.signToken({ uid: user.id });
  return {
    status: 200,
    body: {
      ok: true,
      token,
      isNew,
      user: publicUser(user),
      vip: isVipActive(user),
      vipExpireTime: user.vipExpireTime || null,
      vipGranted: isNew,
    },
  };
}

/* 微信登录：真实对接时用 code 换 openid；这里用 openid 或 code 派生固定账号 */
async function handleWechatLogin(body) {
  const openid = String(body.openid
    || `wx_mock_${crypto.createHash('sha256').update(String(body.code || 'dev')).digest('hex').slice(0, 10)}`);

  let user = Storage.findUserByOpenId(openid);
  const isNew = !user;
  if (!user) {
    const ts = now();
    user = {
      id: uidFromOpenId(openid),
      phone: null,
      openid,
      nickname: `微信用户${openid.slice(-4)}`,
      createdAt: ts,
      vipExpireTime: addMonths(ts, VIP_MONTHS),
      vipGrantedAt: ts,
      vipLastRewardAt: null,
    };
    await Storage.upsertUser(user);
  }

  const token = Auth.signToken({ uid: user.id });
  return {
    status: 200,
    body: {
      ok: true,
      token,
      isNew,
      user: publicUser(user),
      vip: isVipActive(user),
      vipExpireTime: user.vipExpireTime || null,
      vipGranted: isNew,
    },
  };
}

function handleVipInfo(user) {
  const vip = isVipActive(user);
  const expired = !!user.vipExpireTime && user.vipExpireTime <= now();
  return {
    status: 200,
    body: { ok: true, vip, expireAt: user.vipExpireTime || null, expired, user: publicUser(user) },
  };
}

/* 开通/续费：真实环境必须先校验支付回调凭证，再下发 vipExpireTime */
async function handleActivateVip(user) {
  const base = isVipActive(user) ? user.vipExpireTime : now();
  const vipExpireTime = addMonths(base, VIP_MONTHS);
  const updated = await Storage.upsertUser({ ...user, vipExpireTime, vipActivatedAt: now() });
  await Storage.appendVipOrder({
    uid: user.id, type: 'vip', source: 'mock-pay', expireAt: vipExpireTime, ts: now(),
  });
  return { status: 200, body: { ok: true, vip: true, vipExpireTime, user: publicUser(updated) } };
}

/* 广告奖励：每日上限由服务端计数，前端无法自行刷次数 */
async function handleAdReward(user, body) {
  const day = dayKey(now());
  const used = await Storage.countAdRewardsToday(user.id, day);
  const quota = {
    used,
    limit: VIP_AD_DAILY_LIMIT,
    remaining: Math.max(0, VIP_AD_DAILY_LIMIT - used),
    rewardDays: VIP_AD_REWARD_DAYS,
  };
  if (used >= VIP_AD_DAILY_LIMIT) {
    return { status: 200, body: { ok: false, reason: '今天的广告奖励已领完，明天再来吧', quota } };
  }

  // 真实环境：校验 body.adCallbackToken（广告平台回调凭证）后再发放
  const base = isVipActive(user) ? user.vipExpireTime : now();
  const vipExpireTime = base + VIP_AD_REWARD_DAYS * 86400000;
  const updated = await Storage.upsertUser({ ...user, vipExpireTime, vipLastRewardAt: now() });
  await Storage.appendAdReward({ uid: user.id, day, days: VIP_AD_REWARD_DAYS, ts: now() });

  return {
    status: 200,
    body: {
      ok: true,
      vip: true,
      vipExpireTime,
      days: VIP_AD_REWARD_DAYS,
      quota: { ...quota, used: used + 1, remaining: VIP_AD_DAILY_LIMIT - used - 1 },
      user: publicUser(updated),
    },
  };
}

/* 同步本机记录：records 按 questionId+ts 去重追加，进度按 key 合并 */
async function handleSyncRecords(user, body) {
  const incoming = Array.isArray(body.records) ? body.records : [];
  const existing = await Storage.getRecords(user.id);
  const seen = new Set(existing.map((r) => `${r.questionId}|${r.ts}`));

  let syncedRecords = 0;
  for (const rec of incoming) {
    if (!rec || !rec.questionId || !rec.ts) continue;
    const key = `${rec.questionId}|${rec.ts}`;
    if (seen.has(key)) continue;
    seen.add(key);
    await Storage.appendRecord(user.id, { ...rec, syncedAt: now() });
    syncedRecords += 1;
  }

  const progress = Storage.getProgress(user.id);
  const mastery = { ...(progress.mastery || {}), ...(body.mastery || {}) };
  const sm2 = { ...(progress.sm2 || {}), ...(body.sm2 || {}) };
  const kcMastery = { ...(progress.kcMastery || {}), ...(body.kcMastery || {}) };
  const placement = { ...(progress.placement || {}), ...(body.placement || {}) };
  const syncedMastery = Object.keys(body.mastery || {}).length
    + Object.keys(body.sm2 || {}).length
    + Object.keys(body.kcMastery || {}).length;
  await Storage.saveProgress(user.id, { mastery, sm2, kcMastery, placement });

  const patch = {};
  if (placement.wordbook) patch.wordbook = placement.wordbook;
  if (placement.level) patch.level = placement.level;
  if (placement.onboarded) patch.onboarded = true;
  const updated = Object.keys(patch).length
    ? await Storage.upsertUser({ ...user, ...patch })
    : user;

  return {
    status: 200,
    body: { ok: true, syncedRecords, syncedMastery, user: publicUser(updated) },
  };
}

/* 统计：与前端 Store 口径一致（同词取最新判定，答错计入错题） */
async function handleStats(user) {
  const records = await Storage.getRecords(user.id);
  const progress = Storage.getProgress(user.id);

  const total = records.length;
  const correct = records.filter((r) => r.isCorrect).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;

  const latest = new Map();
  records.forEach((r) => {
    const parts = String(r.questionId || '').split('|');
    if (parts.length < 2) return;
    const key = `${parts[0]}|${parts[1]}`;
    const prev = latest.get(key);
    if (!prev || (r.ts || 0) >= (prev.ts || 0)) latest.set(key, r);
  });
  const wrong = [...latest.values()].filter((r) => !r.isCorrect).length;
  const mastered = Object.keys(progress.mastery || {}).length;

  return { status: 200, body: { ok: true, total, accuracy, wrong, mastered } };
}

/* 登录后拉取账号下的全部数据（新设备恢复进度用） */
async function handleBootstrap(user) {
  const records = await Storage.getRecords(user.id);
  const progress = Storage.getProgress(user.id);
  return {
    status: 200,
    body: {
      ok: true,
      user: publicUser(user),
      vip: isVipActive(user),
      expireAt: user.vipExpireTime || null,
      records,
      progress,
    },
  };
}

/* 单条作答记录即时上报，保证跨设备进度不落后 */
async function handleAppendRecord(user, body) {
  const rec = body && body.record;
  if (!rec || !rec.questionId) return { status: 400, body: { ok: false, error: '缺少 questionId' } };
  await Storage.appendRecord(user.id, { ...rec, syncedAt: now() });
  return { status: 200, body: { ok: true } };
}

/* 注销账号：删除用户本体、记录、进度与流水（不可恢复） */
async function handleDeleteAccount(user) {
  await Storage.deleteUser(user.id);
  return { status: 200, body: { ok: true } };
}

/* 定级结果 / 昵称等账号资料更新 */
async function handleProfile(user, body) {
  const patch = {};
  if (body.wordbook) patch.wordbook = String(body.wordbook);
  if (body.level) patch.level = String(body.level);
  if (body.nickname) patch.nickname = String(body.nickname);
  if (typeof body.onboarded === 'boolean') patch.onboarded = body.onboarded;
  const updated = await Storage.upsertUser({ ...user, ...patch });
  return { status: 200, body: { ok: true, user: publicUser(updated) } };
}

/* 广告奖励剩余配额（服务端计数，前端只读展示） */
async function handleAdQuota(user) {
  const day = dayKey(now());
  const used = await Storage.countAdRewardsToday(user.id, day);
  return {
    status: 200,
    body: {
      ok: true,
      quota: {
        used,
        limit: VIP_AD_DAILY_LIMIT,
        remaining: Math.max(0, VIP_AD_DAILY_LIMIT - used),
        rewardDays: VIP_AD_REWARD_DAYS,
      },
    },
  };
}

/* ---------------- 路由分发 ---------------- */
async function handle(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const route = `${req.method} ${url.pathname}`;
  const body = req.method === 'POST' ? await readBody(req) : {};

  if (route === 'GET /api/health') {
    sendJson(res, 200, { ok: true, ts: now() });
    return;
  }
  if (route === 'POST /api/auth/sms-code') {
    const result = handleSmsCode(body);
    sendJson(res, result.status, result.body);
    return;
  }
  if (route === 'POST /api/auth/login-by-phone') {
    const result = await handlePhoneLogin(body);
    sendJson(res, result.status, result.body);
    return;
  }
  if (route === 'POST /api/auth/wechat') {
    const result = await handleWechatLogin(body);
    sendJson(res, result.status, result.body);
    return;
  }

  // 以下接口必须带 Authorization: Bearer <token>
  const user = requireUser(req);
  if (!user) {
    sendJson(res, 401, { ok: false, error: '请先登录' });
    return;
  }

  if (route === 'DELETE /api/user') {
    const result = await handleDeleteAccount(user);
    sendJson(res, result.status, result.body);
    return;
  }
  if (route === 'GET /api/user/vip') {
    const result = handleVipInfo(user);
    sendJson(res, result.status, result.body);
    return;
  }
  if (route === 'POST /api/pay/vip/activate') {
    const result = await handleActivateVip(user);
    sendJson(res, result.status, result.body);
    return;
  }
  if (route === 'POST /api/vip/reward-by-ad') {
    const result = await handleAdReward(user, body);
    sendJson(res, result.status, result.body);
    return;
  }
  if (route === 'POST /api/user/sync-records') {
    const result = await handleSyncRecords(user, body);
    sendJson(res, result.status, result.body);
    return;
  }
  if (route === 'GET /api/user/stats') {
    const result = await handleStats(user);
    sendJson(res, result.status, result.body);
    return;
  }
  if (route === 'GET /api/user/bootstrap') {
    const result = await handleBootstrap(user);
    sendJson(res, result.status, result.body);
    return;
  }
  if (route === 'POST /api/user/records') {
    const result = await handleAppendRecord(user, body);
    sendJson(res, result.status, result.body);
    return;
  }
  if (route === 'POST /api/user/profile') {
    const result = await handleProfile(user, body);
    sendJson(res, result.status, result.body);
    return;
  }
  if (route === 'GET /api/vip/ad-quota') {
    const result = await handleAdQuota(user);
    sendJson(res, result.status, result.body);
    return;
  }

  sendJson(res, 404, { ok: false, error: '接口不存在' });
}

const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }
  handle(req, res).catch((err) => {
    sendJson(res, 500, { ok: false, error: err.message });
  });
});

Storage.ensureDir(Storage.DATA_DIR);
Storage.dailySnapshot()
  .then((snap) => console.log(`当日快照：${snap}`))
  .catch((err) => console.warn(`快照失败（不影响启动）：${err.message}`));

server.listen(PORT, () => {
  console.log(`词溯后端已启动：http://127.0.0.1:${PORT}`);
  console.log(`数据目录：${Storage.DATA_DIR}`);
});
