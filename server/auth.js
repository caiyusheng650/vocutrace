/* ============================================================
 * 鉴权：邮箱验证码（SMTP 发信）+ 自签 token（HMAC-SHA256）
 * ------------------------------------------------------------
 * 说明：
 *   - token 用 node:crypto 自签，不引第三方 JWT 库；
 *     结构为 base64url(payload).base64url(signature)
 *   - 配置了 SMTP 时验证码真实发到邮箱，且必须匹配；
 *     未配置 SMTP（本地开发）时任意 6 位数字均可通过，
 *     同时接口会把验证码回传给前端方便调试。
 * ============================================================ */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { DATA_DIR } = require('./storage');
const Mailer = require('./mailer');

const SECRET_FILE = path.join(DATA_DIR, 'secret.key');

/* 首次启动自动生成签名密钥；真实部署建议用环境变量 CISHUO_SECRET 注入 */
function loadSecret() {
  if (process.env.CISHUO_SECRET) return process.env.CISHUO_SECRET;
  try {
    return fs.readFileSync(SECRET_FILE, 'utf8').trim();
  } catch (err) {
    const secret = crypto.randomBytes(32).toString('hex');
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SECRET_FILE, secret, 'utf8');
    return secret;
  }
}

const SECRET = loadSecret();
const TOKEN_TTL = 30 * 86400000; // 30 天

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function signToken(payload) {
  const body = { ...payload, exp: Date.now() + TOKEN_TTL };
  const data = b64url(JSON.stringify(body));
  const sig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token) {
  const [data, sig] = String(token || '').split('.');
  if (!data || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const body = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (!body.exp || body.exp <= Date.now()) return null;
    return body;
  } catch (err) {
    return null;
  }
}

/* ---------------- 邮箱验证码（内存 5 分钟有效） ---------------- */
const emailCodes = new Map();

/* 生成验证码并尝试发信；返回是否真实发出 */
async function issueEmailCode(email) {
  const key = String(email).trim().toLowerCase();
  const code = String(crypto.randomInt(100000, 1000000));
  emailCodes.set(key, { code, expireAt: Date.now() + 5 * 60 * 1000 });

  if (!Mailer.isConfigured()) return { code, sent: false };
  try {
    await Mailer.sendLoginCode(key, code);
    return { code, sent: true };
  } catch (err) {
    emailCodes.delete(key);
    throw err;
  }
}

function verifyEmailCode(email, code) {
  const key = String(email).trim().toLowerCase();
  // 未配置 SMTP：本地开发模式，任意 6 位数字通过
  if (!Mailer.isConfigured()) return /^\d{6}$/.test(String(code || ''));
  const entry = emailCodes.get(key);
  if (!entry || entry.expireAt <= Date.now() || entry.code !== String(code)) return false;
  emailCodes.delete(key);
  return true;
}

module.exports = { signToken, verifyToken, issueEmailCode, verifyEmailCode };
