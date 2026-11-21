/* ============================================================
 * 邮箱验证码发送（零依赖 SMTP）
 * ------------------------------------------------------------
 * 环境变量：
 *   CISHUO_SMTP_HOST      SMTP 服务器，如 smtp.example.com
 *   CISHUO_SMTP_PORT      端口，默认 587（465 自动走隐式 TLS）
 *   CISHUO_SMTP_USER      登录账号
 *   CISHUO_SMTP_PASS      登录密码 / 授权码
 *   CISHUO_SMTP_FROM      发件人，默认与 USER 相同
 *   CISHUO_SMTP_SECURE    1=隐式 TLS；默认端口 465 时为 1
 *
 * 未配置 SMTP 时不发信，由调用方回传验证码方便本地调试。
 * ============================================================ */
const net = require('node:net');
const tls = require('node:tls');

const HOST = process.env.CISHUO_SMTP_HOST || '';
const PORT = Number(process.env.CISHUO_SMTP_PORT || 587);
const USER = process.env.CISHUO_SMTP_USER || '';
const PASS = process.env.CISHUO_SMTP_PASS || '';
const FROM = process.env.CISHUO_SMTP_FROM || USER;
const SECURE = process.env.CISHUO_SMTP_SECURE
  ? process.env.CISHUO_SMTP_SECURE === '1'
  : PORT === 465;

function isConfigured() {
  return !!(HOST && USER && PASS && FROM);
}

/* 逐行读取 SMTP 响应，支持多行响应（如 EHLO 的能力列表） */
function createReader(socket) {
  let buffer = '';
  let lines = [];
  const pending = [];
  let waiter = null;

  function flush() {
    let idx;
    while ((idx = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      lines.push(line);
      if (/^\d{3} /.test(line)) {
        const reply = lines.join('\n');
        lines = [];
        if (waiter) {
          const current = waiter;
          waiter = null;
          current.resolve(reply);
        } else {
          pending.push(reply);
        }
      }
    }
  }

  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    flush();
  });
  socket.on('error', (err) => {
    if (waiter) {
      waiter.reject(err);
      waiter = null;
    }
  });

  return {
    read(timeoutMs = 15000) {
      if (pending.length) return Promise.resolve(pending.shift());
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          waiter = null;
          reject(new Error('SMTP 响应超时'));
        }, timeoutMs);
        waiter = {
          resolve: (value) => { clearTimeout(timer); resolve(value); },
          reject: (err) => { clearTimeout(timer); reject(err); },
        };
      });
    },
  };
}

function write(socket, line) {
  return new Promise((resolve, reject) => {
    socket.write(`${line}\r\n`, (err) => (err ? reject(err) : resolve()));
  });
}

function expect(reply, codes, label) {
  const code = Number(String(reply).slice(0, 3));
  if (!codes.includes(code)) {
    throw new Error(`SMTP ${label} 失败：${reply}`);
  }
  return reply;
}

/* 把 socket 升级为 TLS（STARTTLS 或 465 隐式加密） */
function upgradeTls(socket) {
  return new Promise((resolve, reject) => {
    const secured = tls.connect({ socket, servername: HOST }, () => resolve(secured));
    secured.once('error', reject);
    secured.setTimeout(15000, () => {
      secured.destroy();
      reject(new Error('SMTP TLS 握手超时'));
    });
  });
}

function buildMessage({ to, subject, text }) {
  const body = Buffer.from(text, 'utf8').toString('base64').replace(/.{1,76}/g, '$&\r\n');
  return [
    `From: ${FROM}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body,
  ].join('\r\n');
}

async function send({ to, subject, text }) {
  if (!isConfigured()) {
    return { sent: false, reason: 'SMTP 未配置' };
  }

  const raw = SECURE
    ? tls.connect({ host: HOST, port: PORT, servername: HOST })
    : net.connect({ host: HOST, port: PORT });

  const cleanup = () => {
    try { raw.destroy(); } catch (err) { /* ignore */ }
  };

  let socket = raw;
  let reader = createReader(raw);

  const overall = setTimeout(cleanup, 30000);
  try {
    await new Promise((resolve, reject) => {
      if (SECURE) socket.once('secureConnect', resolve);
      else socket.once('connect', resolve);
      socket.once('error', reject);
    });

    expect(await reader.read(), [220], '握手');

    let hostname = 'localhost';
    try { hostname = require('node:os').hostname() || hostname; } catch (err) { /* ignore */ }
    await write(socket, `EHLO ${hostname}`);
    expect(await reader.read(), [250], 'EHLO');

    if (!SECURE) {
      await write(socket, 'STARTTLS');
      expect(await reader.read(), [220], 'STARTTLS');
      socket = await upgradeTls(socket);
      reader = createReader(socket);
      await write(socket, `EHLO ${hostname}`);
      expect(await reader.read(), [250], 'EHLO(TLS)');
    }

    await write(socket, 'AUTH LOGIN');
    expect(await reader.read(), [334], 'AUTH LOGIN');
    await write(socket, Buffer.from(USER, 'utf8').toString('base64'));
    expect(await reader.read(), [334], 'AUTH USER');
    await write(socket, Buffer.from(PASS, 'utf8').toString('base64'));
    expect(await reader.read(), [235], 'AUTH PASS');

    await write(socket, `MAIL FROM:<${FROM}>`);
    expect(await reader.read(), [250], 'MAIL FROM');

    await write(socket, `RCPT TO:<${to}>`);
    expect(await reader.read(), [250, 251], 'RCPT TO');

    await write(socket, 'DATA');
    expect(await reader.read(), [354], 'DATA');

    await write(socket, `${buildMessage({ to, subject, text })}\r\n.`);
    expect(await reader.read(), [250], '消息投递');

    await write(socket, 'QUIT');
    clearTimeout(overall);
    cleanup();
    return { sent: true };
  } catch (err) {
    clearTimeout(overall);
    cleanup();
    throw err;
  }
}

function sendLoginCode(to, code) {
  return send({
    to,
    subject: '词溯登录验证码',
    text: `你的登录验证码是 ${code}，5 分钟内有效。\n如果不是你本人操作，请忽略这封邮件。`,
  });
}

module.exports = { isConfigured, send, sendLoginCode };
