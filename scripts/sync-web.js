/* ============================================================
 * 同步静态资源到 www/（Capacitor 的 webDir）
 * ------------------------------------------------------------
 * 根目录继续作为网页版/静态部署的源码目录，不改变现有结构；
 * 本脚本把需要的文件复制到 www/，并注入 APK 专用的运行时配置。
 *
 * 用法：
 *   node scripts/sync-web.js
 *   CISHUO_API_BASE=https://api.example.com node scripts/sync-web.js
 * ============================================================ */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'www');
const ITEMS = ['index.html', 'css', 'js', 'icon.svg', 'manifest.json'];

/* APK 内请求的公网后端地址；留空则退化为本地存储（MockAPI） */
const API_BASE = String(process.env.CISHUO_API_BASE || '').replace(/\/+$/, '');

function copyItem(name) {
  const src = path.join(ROOT, name);
  if (!fs.existsSync(src)) {
    console.warn(`[sync-web] 跳过不存在的 ${name}`);
    return;
  }
  fs.cpSync(src, path.join(OUT, name), { recursive: true });
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
ITEMS.forEach(copyItem);

/* 覆盖 APK 的环境配置（网页版源码里的 js/app-env.js 保持为空） */
const envPath = path.join(OUT, 'js', 'app-env.js');
fs.writeFileSync(
  envPath,
  `/* 由 scripts/sync-web.js 自动生成，请勿手工修改 */\nwindow.CISHUO_API_BASE = ${JSON.stringify(API_BASE)};\n`,
  'utf8',
);

console.log(`[sync-web] 已生成 ${path.relative(ROOT, OUT)}/`);
console.log(`[sync-web] CISHUO_API_BASE = ${API_BASE || '(空，使用本地存储)'}`);
if (API_BASE) {
  console.log(`[sync-web] 提示：请确认 ${API_BASE}/api/health 返回 200，否则登录与同步会失败`);
}
