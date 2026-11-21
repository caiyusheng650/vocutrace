/* ============================================================
 * 构建 Android APK（跨终端一致）
 * ------------------------------------------------------------
 * 用法：node scripts/build-apk.js [debug|release]
 *
 * 处理三件在 Windows 上容易踩的事：
 *   1. 项目路径含中文 → 强制 -Pandroid.overridePathCheck=true
 *   2. 系统 Gradle 缓存目录不可写 → 默认用项目内 .gradle-home
 *   3. npm/cmd 代码页导致路径乱码 → 由 Node 直接拉起 gradlew
 * ============================================================ */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ANDROID_DIR = path.join(ROOT, 'android');
const mode = process.argv[2] === 'release' ? 'release' : 'debug';
const task = mode === 'release' ? 'assembleRelease' : 'assembleDebug';
const isWin = process.platform === 'win32';

const env = { ...process.env };
if (!env.GRADLE_USER_HOME) env.GRADLE_USER_HOME = path.join(ROOT, '.gradle-home');

const args = [task, '--no-daemon'];
// 项目路径含非 ASCII 字符时 AGP 会直接终止构建，用项目属性强制放行
if (isWin) args.push('-Pandroid.overridePathCheck=true');

console.log(`[build-apk] ${task} → ${ANDROID_DIR}`);
console.log(`[build-apk] GRADLE_USER_HOME = ${env.GRADLE_USER_HOME}`);

const result = spawnSync(isWin ? 'gradlew.bat' : './gradlew', args, {
  cwd: ANDROID_DIR,
  stdio: 'inherit',
  env,
  shell: isWin,
});

process.exit(result.status == null ? 1 : result.status);
