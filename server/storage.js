/* ============================================================
 * 文件存储适配层（替代数据库）
 * ------------------------------------------------------------
 * 约定：
 *   1) 小对象整体读写：data/users.json、data/progress/<uid>.json
 *   2) 只追加的流水：data/records/<uid>.jsonl、ad-rewards.jsonl
 *   3) 所有写操作走同一文件队列 + 先写 .tmp 再 rename（原子写）
 *   4) 启动时给 data/ 做一份当日快照，出问题可回滚
 *
 * 以后换 SQLite/Postgres 只改这一层，index.js 的接口形状不用动。
 * ============================================================ */
const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = process.env.CISHUO_DATA_DIR || path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const RECORDS_DIR = path.join(DATA_DIR, 'records');
const PROGRESS_DIR = path.join(DATA_DIR, 'progress');
const AD_REWARDS_FILE = path.join(DATA_DIR, 'ad-rewards.jsonl');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

/* 同一文件的写操作串行排队，避免并发写交错丢数据 */
const queues = new Map();
function enqueue(file, task) {
  const prev = queues.get(file) || Promise.resolve();
  const next = prev.then(task, task);
  queues.set(file, next.then(() => {}, () => {}));
  return next;
}

/* 原子写：先写临时文件再 rename，避免进程中途退出留下半截 JSON */
function writeAtomic(file, content) {
  return enqueue(file, async () => {
    ensureDir(path.dirname(file));
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fs.promises.writeFile(tmp, content, 'utf8');
    await fs.promises.rename(tmp, file);
  });
}

function readJsonSync(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return fallback;
  }
}

async function appendJsonl(file, obj) {
  return enqueue(file, async () => {
    ensureDir(path.dirname(file));
    await fs.promises.appendFile(file, `${JSON.stringify(obj)}\n`, 'utf8');
  });
}

async function readJsonl(file) {
  let raw = '';
  try {
    raw = await fs.promises.readFile(file, 'utf8');
  } catch (err) {
    return [];
  }
  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try { return JSON.parse(line); } catch (err) { return null; }
    })
    .filter(Boolean);
}

/* ---------------- 用户（整体读写 + 内存缓存） ---------------- */
let usersCache = null;

function loadUsers() {
  if (!usersCache) {
    usersCache = readJsonSync(USERS_FILE, {});
    if (!usersCache || typeof usersCache !== 'object') usersCache = {};
  }
  return usersCache;
}

function getAllUsers() {
  return Object.values(loadUsers());
}

function getUserById(id) {
  return loadUsers()[id] || null;
}

function findUserByEmail(email) {
  const key = String(email || '').trim().toLowerCase();
  if (!key) return null;
  return getAllUsers().find((u) => String(u.email || '').toLowerCase() === key) || null;
}

/* 写入/更新一个用户：先更新内存再落盘（users.json 体量小） */
function upsertUser(user) {
  const users = loadUsers();
  users[user.id] = { ...(users[user.id] || {}), ...user };
  return writeAtomic(USERS_FILE, JSON.stringify(users, null, 2)).then(() => users[user.id]);
}

/* 注销账号：删除用户本体、做题记录、学习进度与相关流水 */
async function deleteUser(uid) {
  const users = loadUsers();
  if (users[uid]) {
    delete users[uid];
    await writeAtomic(USERS_FILE, JSON.stringify(users, null, 2));
  }

  for (const file of [recordsFile(uid), progressFile(uid)]) {
    try {
      await fs.promises.unlink(file);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }

  // 审计流水按 uid 过滤后重写，避免残留可关联到已注销账号的数据
  for (const file of [AD_REWARDS_FILE]) {
    const list = await readJsonl(file);
    const kept = list.filter((x) => x.uid !== uid);
    if (kept.length !== list.length) {
      const content = kept.length ? `${kept.map((x) => JSON.stringify(x)).join('\n')}\n` : '';
      await writeAtomic(file, content);
    }
  }
}

/* ---------------- 做题记录（JSONL 追加） ---------------- */
function recordsFile(uid) {
  return path.join(RECORDS_DIR, `${uid}.jsonl`);
}

function appendRecord(uid, record) {
  return appendJsonl(recordsFile(uid), record);
}

function getRecords(uid) {
  return readJsonl(recordsFile(uid));
}

/* ---------------- 学习进度（整体读写） ---------------- */
function progressFile(uid) {
  return path.join(PROGRESS_DIR, `${uid}.json`);
}

function getProgress(uid) {
  return readJsonSync(progressFile(uid), { mastery: {}, sm2: {}, kcMastery: {}, placement: {} });
}

function saveProgress(uid, progress) {
  return writeAtomic(progressFile(uid), JSON.stringify(progress, null, 2));
}

/* ---------------- 审计流水 ---------------- */
function appendAdReward(entry) {
  return appendJsonl(AD_REWARDS_FILE, entry);
}

async function countAdRewardsToday(uid, day) {
  const list = await readJsonl(AD_REWARDS_FILE);
  return list.filter((x) => x.uid === uid && x.day === day).length;
}

/* ---------------- 每日快照 ---------------- */
async function dailySnapshot() {
  const day = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10); // 按东八区日期
  const target = path.join(DATA_DIR, 'snapshots', day);
  if (fs.existsSync(target)) return target;
  ensureDir(target);
  const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'snapshots') continue;
    const src = path.join(DATA_DIR, entry.name);
    const dst = path.join(target, entry.name);
    if (entry.isDirectory()) await fs.promises.cp(src, dst, { recursive: true });
    else await fs.promises.copyFile(src, dst);
  }
  return target;
}

module.exports = {
  DATA_DIR,
  ensureDir,
  getAllUsers,
  getUserById,
  findUserByEmail,
  upsertUser,
  deleteUser,
  appendRecord,
  getRecords,
  getProgress,
  saveProgress,
  appendAdReward,
  countAdRewardsToday,
  dailySnapshot,
};
