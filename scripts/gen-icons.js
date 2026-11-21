/* ============================================================
 * 生成 Android 启动图标（adaptive icon + legacy）
 * ------------------------------------------------------------
 * 用法：node scripts/gen-icons.js
 * 依赖：@resvg/resvg-js
 * ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require('@resvg/resvg-js');

const ROOT = path.resolve(__dirname, '..');
const RES = path.join(ROOT, 'android', 'app', 'src', 'main', 'res');

/* legacy 方形图标尺寸 */
const LAUNCHER = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
/* adaptive foreground：108dp 画布，图形收在中间安全区 */
const FOREGROUND = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

const LEGACY_SVG = fs.readFileSync(path.join(ROOT, 'icon.svg'), 'utf8');

/* adaptive foreground：透明画布 + 居中「词」字 + 装饰光点 */
const FOREGROUND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108">
  <circle cx="82" cy="26" r="14" fill="#22ab98" opacity="0.45"/>
  <circle cx="24" cy="84" r="9" fill="#45c6b2" opacity="0.30"/>
  <text x="54" y="72" text-anchor="middle"
        font-family="PingFang SC, Microsoft YaHei, Noto Sans SC, sans-serif"
        font-size="52" font-weight="600" fill="#ffffff">词</text>
</svg>`;

function render(svg, size) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } });
  return resvg.render().asPng();
}

function writePng(dir, name, buffer) {
  const out = path.join(RES, dir);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, name), buffer);
}

let count = 0;
for (const [density, size] of Object.entries(LAUNCHER)) {
  const png = render(LEGACY_SVG, size);
  writePng(`mipmap-${density}`, 'ic_launcher.png', png);
  writePng(`mipmap-${density}`, 'ic_launcher_round.png', png);
  count += 2;
}
for (const [density, size] of Object.entries(FOREGROUND)) {
  writePng(`mipmap-${density}`, 'ic_launcher_foreground.png', render(FOREGROUND_SVG, size));
  count += 1;
}
console.log(`[gen-icons] 已生成 ${count} 个图标文件`);
