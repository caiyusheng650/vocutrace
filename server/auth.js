/* ============================================================
 * 鉴权：短信验证码（mock）+ 自签 token（HMAC-SHA256）
 * ------------------------------------------------------------
 * 说明：
 *   - token 用 node:crypto 自签，不引第三方 JWT 库；
 *     结构为 base64url(payload).base64url(signature)
 *   - 验证码目前是 mock：CISHUO_STRICT_SMS=1 时才强制校验已下发的验证码。
 *     上线前必须打开严格模式并接入真实短信服务商。
 * ============================================================ */
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { DATA_DIR } = require('./storage');

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

/* ---------------- 验证码（mock，内存 5 分钟有效） ---------------- */
const smsCodes = new Map();

function issueSmsCode(phone) {
  const code = String(crypto.randomInt(100000, 1000000));
  smsCodes.set(phone, { code, expireAt: Date.now() + 5 * 60 * 1000 });
  // 真实对接：这里调用短信服务商 API，把 code 发到手机上
  return code;
}

function verifySmsCode(phone, code) {
  const strict = process.env.CISHUO_STRICT_SMS === '1';
  if (!strict) return /^\d{6}$/.test(String(code || '')); // mock：任意 6 位数字
  const entry = smsCodes.get(phone);
  if (!entry || entry.expireAt <= Date.now() || entry.code !== String(code)) return false;
  smsCodes.delete(phone);
  return true;
}

module.exports = { signToken, verifyToken, issueSmsCode, verifySmsCode };
