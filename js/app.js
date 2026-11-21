/* ============================================================
 * 页面交互逻辑（5 个页面共用一套 DOM）
 * 页面：引导登录 / 首页 / 答题 / 词书&单词本 / 数据&设置
 * ============================================================ */

const LEVELS = [
  { id: 'zero', name: '零基础', desc: '很多词都不太眼熟，从最常见的开始' },
  { id: 'general', name: '一般', desc: '能认出常用词，想把基础再打稳' },
  { id: 'advanced', name: '熟练', desc: '常见词没问题，想在细节上提高' },
];

const PLACEMENT_TOTAL = 6;

const state = {
  view: 'welcome',
  obStep: 1,
  draft: { username: '', wordbook: 'zk', level: 'general' },
  session: null,
  question: null,
  selectedKey: null,
  answered: false,
  revealedHint: false,
  startedAt: 0,
  timerId: null,
  qToken: 0,
  booksTab: 'words',
  authBusy: false,
  codeTimer: null,
  clozeAnswers: [], // ★ 完形填空：每个下拉框当前选择
  adTimer: null,    // ★ 广告奖励：mock 倒计时定时器
  adSecondsLeft: 0, // ★ 广告奖励：剩余秒数
  wordPage: 1,      // ★ 词书列表：当前页（大词库分页用）
  wordSearch: '',   // ★ 词书列表：搜索关键词
  wordPageSize: 80, // ★ 词书列表：每页渲染数量，避免上千词卡顿
  wordTotalPages: 1,// ★ 词书列表：总页数（翻页时夹取用）
  wordDetail: null, // ★ 单词详情弹层：当前查看的单词
};

const $ = (id) => document.getElementById(id);

const els = {
  welcome: $('view-welcome'),
  login: $('view-login'),
  onboarding: $('view-onboarding'),
  home: $('view-home'),
  quiz: $('view-quiz'),
  books: $('view-books'),
  me: $('view-me'),
  tabbar: $('tabbar'),

  // 账号
  guestHint: $('guest-hint'),
  logoutModal: $('logout-modal'),
  loginPhone: $('login-phone'),
  loginCode: $('login-code'),
  loginError: $('login-error'),
  btnSendCode: $('btn-send-code'),
  btnPhoneLogin: $('btn-phone-login'),
  meAccount: $('me-account'),

  // 引导
  obUsername: $('ob-username'),
  obUsernameError: $('ob-username-error'),
  obBooks: $('ob-books'),
  obLevels: $('ob-levels'),
  obSummary: $('ob-summary'),
  obBack: $('ob-back'),
  obDots: $('ob-dots'),
  obResultText: $('ob-result-text'),
  obResultBox: $('ob-result-box'),

  // 首页
  homeGreeting: $('home-greeting'),
  homeBookTag: $('home-book-tag'),
  homeNew: $('home-new'),
  homeNewTarget: $('home-new-target'),
  homeReview: $('home-review'),
  homeProgressText: $('home-progress-text'),
  homeProgressBar: $('home-progress-bar'),
  homeMastered: $('home-mastered'),
  homeTotal: $('home-total'),
  homeAccuracy: $('home-accuracy'),
  // ★ 每日打卡 / 学习周报
  checkinStreak: $('checkin-streak'),
  checkinToday: $('checkin-today'),
  checkinDays: $('checkin-days'),
  btnWeekly: $('btn-weekly'),
  weeklyModal: $('weekly-modal'),
  weeklySummary: $('weekly-summary'),
  weeklyList: $('weekly-list'),

  // 答题
  quizCounter: $('quiz-counter'),
  quizModeLabel: $('quiz-mode-label'),
  quizTimer: $('quiz-timer'),
  quizProgress: $('quiz-progress'),
  quizCard: $('quiz-card'),
  quizType: $('quiz-type'),
  quizPrompt: $('quiz-prompt'),
  quizPhonetic: $('quiz-phonetic'),
  quizHint: $('quiz-hint'),
  quizOptions: $('quiz-options'),
  quizImageWrap: $('quiz-image-wrap'),
  quizImage: $('quiz-image'),
  quizAnalysis: $('quiz-analysis'),
  analysisVerdict: $('analysis-verdict'),
  analysisChevron: $('analysis-chevron'),
  analysisBody: $('analysis-body'),
  analysisMeaning: $('analysis-meaning'),
  analysisHint: $('analysis-hint'),
  analysisConfusable: $('analysis-confusable'),
  btnHint: $('btn-hint'),
  btnSubmit: $('btn-submit'),
  btnNext: $('btn-next'),

  // 词书
  bookChips: $('book-chips'),
  tabWords: $('tab-words'),
  tabFav: $('tab-fav'),
  tabWrong: $('tab-wrong'),
  wordsPanel: $('words-panel'),
  favPanel: $('fav-panel'),
  wrongPanel: $('wrong-panel'),
  favList: $('fav-list'),
  favCountBooks: $('fav-count-books'),
  wordsCount: $('words-count'),
  wrongCount: $('wrong-count'),
  wordList: $('word-list'),
  wordSearch: $('word-search'), // ★ 词库搜索框
  wordPager: $('word-pager'),   // ★ 词库分页控件
  wrongList: $('wrong-list'),
  btnPracticeWrong: $('btn-practice-wrong'),

  // 我的
  meUsername: $('me-username'),
  meBook: $('me-book'),
  meLevel: $('me-level'),
  statAccuracy: $('stat-accuracy'),
  statTotal: $('stat-total'),
  statWrong: $('stat-wrong'),
  statMastered: $('stat-mastered'),
  goalInput: $('goal-input'),
  // ★ 学习工具 / 合规 / 注销
  meFavCount: $('me-fav-count'),
  btnGoFavorites: $('btn-go-favorites'),
  btnExport: $('btn-export'),
  btnPrivacy: $('btn-privacy'),
  btnTerms: $('btn-terms'),
  btnDeleteAccount: $('btn-delete-account'),
  deleteModal: $('delete-modal'),
  deleteConfirm: $('delete-confirm'),
  // ★ 单词详情
  wordModal: $('word-modal'),
  wordTitle: $('word-title'),
  wordPhonetic: $('word-phonetic'),
  wordMeaning: $('word-meaning'),
  wordDefinition: $('word-definition'),
  wordDefRow: $('word-def-row'),
  wordHint: $('word-hint'),
  wordHintRow: $('word-hint-row'),
  wordConfusable: $('word-confusable'),
  wordConfRow: $('word-conf-row'),
  wordFav: $('word-fav'),
  // ★ 合规弹层
  legalModal: $('legal-modal'),
  legalTitle: $('legal-title'),
  legalBody: $('legal-body'),

  // ★ 会员体系
  vipHomeFree: $('vip-home-free'),
  vipHomeMember: $('vip-home-member'),
  vipHomeExpire: $('vip-home-expire'),
  btnOpenVip: $('btn-open-vip'),
  vipModal: $('vip-modal'),
  vipClose: $('vip-close'),
  btnActivateVip: $('btn-activate-vip'),
  accountMenu: $('account-menu'),
  accountIdentity: $('account-identity'),
  accountExpire: $('account-expire'),
  menuGoMe: $('menu-go-me'),
  menuLogin: $('menu-login'),
  menuLogout: $('menu-logout'),
  meVipExpire: $('me-vip-expire'),
  // ★ 广告奖励：看广告领会员（mock 激励视频）
  btnAdReward: $('btn-ad-reward'),
  adRewardQuota: $('ad-reward-quota'),
  adModal: $('ad-modal'),
  adCountdown: $('ad-countdown'),
  adTip: $('ad-tip'),
  adClaim: $('ad-claim'),
  adClose: $('ad-close'),
  quizRecoLabel: $('quiz-reco-label'),
  kcRadarMember: $('kc-radar-member'),
  kcRadarLocked: $('kc-radar-locked'),
  kcRadarSvg: $('kc-radar-svg'),
  kcRadarLegend: $('kc-radar-legend'),
  btnOpenVipMe: $('btn-open-vip-me'),

  toast: $('toast'),
};

/* ---------------- 通用小工具 ---------------- */
function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function bookName(id) {
  const b = WORDBOOKS.find((x) => x.id === id);
  return b ? b.name : id;
}

function levelName(id) {
  const l = LEVELS.find((x) => x.id === id);
  return l ? l.name : id;
}

/* 手机号脱敏展示：138****8000 */
function maskPhone(phone) {
  const p = String(phone || '');
  return p.length === 11 ? `${p.slice(0, 3)}****${p.slice(7)}` : '未绑定手机号';
}

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 18) return '下午好';
  return '晚上好';
}

let toastTimer = null;
function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 2000);
}

function showView(name) {
  ['welcome', 'login', 'onboarding', 'home', 'quiz', 'books', 'me'].forEach((v) => {
    els[v].classList.toggle('hidden', v !== name);
  });

  state.view = name;
  updateGuestHint();
  closeAccountMenu(); // 切换页面时收起账号下拉

  const showTab = name === 'home' || name === 'books' || name === 'me';
  els.tabbar.classList.toggle('hidden', !showTab);
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    const active = btn.dataset.nav === name;
    btn.classList.toggle('text-brand-600', active);
    btn.classList.toggle('text-muted', !active);
    btn.querySelector('svg').setAttribute('stroke-width', active ? '2.1' : '1.8');
  });

  window.scrollTo({ top: 0 });
}

/* ============================================================
 * 账号体系：游客 / 手机号验证码 / 微信（只处理登录态与同步）
 * ------------------------------------------------------------
 * 做题、出题、错题、统计逻辑均不在此改动。
 * ============================================================ */
function updateGuestHint() {
  const hint = els.guestHint;
  if (!hint) return;
  const user = Store.getUser();
  const visible = !!(user && user.guest) && state.view !== 'welcome' && state.view !== 'login';
  hint.classList.toggle('hidden', !visible);
  hint.classList.toggle('flex', visible);
}

/* 打包本机已有学习数据，用于游客升级同步 */
function captureLocalData() {
  const user = Store.getUser() || {};
  return {
    records: Store.getRecords(),
    mastery: Store.getMastery(),
    placement: {
      wordbook: user.wordbook || null,
      level: user.level || null,
      onboarded: !!user.onboarded,
    },
    // ★ 新增：会员标记与 KC / SM2 数据一并同步，游客升级不丢进度
    vip: !!user.vip,
    kcMastery: Store.getKCMastery(),
    sm2: Store.getSM2(),
  };
}

/* 登录成功统一收尾：同步本机数据 → 回首页或继续定级 */
async function afterAuth(user, syncInfo, isNew) {
  state.draft.username = user.username || state.draft.username;
  els.obUsername.value = state.draft.username;
  renderBookOptions();
  renderLevelOptions();

  if (syncInfo && (syncInfo.syncedRecords || syncInfo.syncedMastery)) {
    toast(`已登录，同步本机 ${syncInfo.syncedRecords} 条记录`);
  } else {
    toast(isNew ? '账号已创建' : '登录成功');
  }

  if (user.onboarded) {
    await enterApp('home');
  } else {
    showView('onboarding');
    goObStep(2);
  }
  updateGuestHint();
}

/* 【游客体验】复用原有 login 接口创建本地用户，跳过昵称步骤直接定级 */
async function startGuest() {
  const current = Store.getUser();
  if (current && current.onboarded) {
    await enterApp('home');
    return;
  }
  if (!current) {
    await MockAPI.login({ username: '游客' }); // 原有接口不变
  }
  Store.saveUser({ guest: true, loggedIn: false });
  state.draft.username = '游客';
  els.obUsername.value = '游客';
  renderBookOptions();
  renderLevelOptions();
  showView('onboarding');
  goObStep(2);
  updateGuestHint();
}

function openLogin() {
  showLoginError('');
  showView('login');
  updateGuestHint();
}

function showLoginError(msg) {
  els.loginError.textContent = msg || '';
  els.loginError.classList.toggle('hidden', !msg);
}

/* 获取验证码：真实后端模式下由服务端下发，未配置后端时直接通过 */
async function sendCode() {
  const phone = els.loginPhone.value.trim();
  if (!/^1\d{10}$/.test(phone)) {
    showLoginError('请输入 11 位手机号');
    return;
  }
  showLoginError('');
  els.btnSendCode.disabled = true;
  els.btnSendCode.textContent = '发送中…';

  const res = await MockAPI.requestSmsCode(phone);
  if (!res.ok) {
    els.btnSendCode.disabled = false;
    els.btnSendCode.textContent = '获取验证码';
    showLoginError(res.error || '验证码发送失败');
    return;
  }

  let left = 60;
  els.btnSendCode.textContent = `${left}s 后重发`;
  toast('验证码已发送，请输入 6 位数字');
  clearInterval(state.codeTimer);
  state.codeTimer = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      clearInterval(state.codeTimer);
      state.codeTimer = null;
      els.btnSendCode.disabled = false;
      els.btnSendCode.textContent = '获取验证码';
      return;
    }
    els.btnSendCode.textContent = `${left}s 后重发`;
  }, 1000);
}

/* 手机号验证码登录（含游客数据自动同步） */
async function doPhoneLogin() {
  if (state.authBusy) return;
  state.authBusy = true;
  try {
    const phone = els.loginPhone.value.trim();
    const code = els.loginCode.value.trim();
    const local = captureLocalData();

    const res = await MockAPI.loginByPhone(phone, code);
    if (!res.ok) {
      showLoginError(res.error || '登录失败');
      return;
    }
    showLoginError('');

    // 游客升级：本机已有记录一并同步进账号
    // （真实后端模式下即使本机为空也要同步一次，才能拉回账号已有进度）
    let syncInfo = null;
    if (local.records.length || Object.keys(local.mastery).length || MockAPI.isRemote()) {
      syncInfo = await MockAPI.syncLocalRecordToUser(local);
    }
    await afterAuth(res.user, syncInfo, res.isNew);
  } finally {
    state.authBusy = false;
  }
}

/* 微信一键登录（mock；后续替换为微信 OAuth 授权回调） */
async function doWechatLogin() {
  if (state.authBusy) return;
  state.authBusy = true;
  try {
    const local = captureLocalData();
    const res = await MockAPI.loginByWechat();
    if (!res.ok) {
      toast(res.error || '微信登录失败');
      return;
    }
    let syncInfo = null;
    if (local.records.length || Object.keys(local.mastery).length || MockAPI.isRemote()) {
      syncInfo = await MockAPI.syncLocalRecordToUser(local);
    }
    await afterAuth(res.user, syncInfo, res.isNew);
  } finally {
    state.authBusy = false;
  }
}

function openLogoutModal() {
  els.logoutModal.classList.remove('hidden');
  els.logoutModal.classList.add('flex');
}

function closeLogoutModal() {
  els.logoutModal.classList.add('hidden');
  els.logoutModal.classList.remove('flex');
}

/* 退出登录：保留本地记录（转游客）或清空本地记录 */
async function doLogout(mode) {
  closeLogoutModal();

  if (mode === 'clear') {
    clearInterval(state.timerId);
    clearInterval(state.codeTimer);
    state.session = null;
    state.question = null;
    state.draft = { username: '', wordbook: 'zk', level: 'general' };
    els.obUsername.value = '';
    await MockAPI.logout(); // 原有接口：清空本机数据
    renderBookOptions();
    renderLevelOptions();
    updateGuestHint();
    showView('welcome');
    toast('已退出并清空本机记录');
    return;
  }

  // 保留本地记录：数据原样留在 localStorage，仅把账号态降为游客
  await MockAPI.logoutSession(); // 清掉服务端 token，避免退出后仍以旧身份请求
  // ★ 会员绑定登录账号：降级为游客时同步清空会员标记，避免游客白嫖会员
  Store.saveUser({
    username: '游客',
    phone: null,
    wechat: false,
    wechatOpenId: null,
    guest: true,
    loggedIn: false,
    authMode: null,
    vip: false,
    vipExpireTime: null,
    vipActivatedAt: null,
    vipLastRewardAt: null,
  });
  await refreshHome();
  await renderMe();
  await renderBooks();
  updateGuestHint();
  toast('已退出，学习记录保留在本机');
}

/* ============================================================
 * 会员体系：VIP 卡片 / 弹窗 / KC 雷达 / 推荐标识
 * ------------------------------------------------------------
 * 只做 UI 与身份展示；推荐与数据逻辑全部在 MockAPI / Store。
 * 会员判断集中走 isVip()，避免散落判断导致前后端能力不一致。
 * ============================================================ */
function isVip() {
  return vipInfo().active;
}

/* ★ 会员时间判断：会员绑定登录账号，游客一律不算会员；
 *   vip 为 true 且（无到期时间 或 当前时间 < vipExpireTime）才算会员 */
function vipInfo() {
  const u = Store.getUser() || {};
  const expireAt = u.vipExpireTime || null;
  const loggedIn = !!u.loggedIn && !u.guest;
  const active = loggedIn && !!u.vip && (!expireAt || expireAt > Date.now());
  const expired = loggedIn && !!u.vip && !!expireAt && expireAt <= Date.now();
  return { active, expireAt, expired };
}

/* 到期时间格式化：2027-04-21 */
function formatExpire(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function openVipModal() {
  els.vipModal.classList.remove('hidden');
  els.vipModal.classList.add('flex');
}
function closeVipModal() {
  els.vipModal.classList.add('hidden');
  els.vipModal.classList.remove('flex');
}

/* mock 开通会员：前端直接置 vip=true（+5 个月），后续替换为支付成功回调 */
async function doActivateVip() {
  closeVipModal();
  const user = Store.getUser() || {};
  // ★ 会员绑定登录账号：游客点击开通先去登录，不发生任何会员变更
  if (!user.loggedIn || user.guest) {
    toast('会员需登录后开通');
    openLogin();
    return;
  }
  const res = await MockAPI.activateVip();
  if (!res.ok) {
    toast(res.reason || '开通失败，请稍后再试');
    return;
  }
  toast(res.vipExpireTime
    ? `已开通 AI 会员，有效期至 ${formatExpire(res.vipExpireTime)}`
    : '已开通 AI 会员，精准复习已启用');
  await refreshHome();
  await renderMe();
  updateRecoLabel();
}

/* ============================================================
 * ★ 广告奖励：看广告领会员（mock 激励视频倒计时）
 * ------------------------------------------------------------
 * 真实对接：把 startAdReward 里的倒计时换成激励视频 SDK 播放，
 *   在 SDK 的 onReward 回调里调用 claimAdReward() 发放会员即可。
 *   发放逻辑全部封装在 MockAPI.extendVipByAdReward，前端只负责展示。
 * ============================================================ */
const AD_MOCK_SECONDS = 5; // mock 广告时长（秒），仅用于演示流程

/* 刷新首页「今日剩余 N 次」配额展示 */
function renderAdRewardQuota() {
  if (!els.adRewardQuota) return;
  const user = Store.getUser() || {};
  // ★ 游客不参与广告奖励，只提示登录
  if (!user.loggedIn || user.guest) {
    els.adRewardQuota.textContent = '登录后可领取';
    els.adRewardQuota.classList.remove('text-brand-600');
    els.adRewardQuota.classList.add('text-muted');
    return;
  }
  const quota = MockAPI.getAdRewardQuota();
  if (quota.remaining > 0) {
    els.adRewardQuota.textContent = `今日剩余 ${quota.remaining} 次`;
    els.adRewardQuota.classList.remove('text-muted');
    els.adRewardQuota.classList.add('text-brand-600');
  } else {
    els.adRewardQuota.textContent = '今日已领完';
    els.adRewardQuota.classList.remove('text-brand-600');
    els.adRewardQuota.classList.add('text-muted');
  }
}

function openAdModal() {
  if (!els.adModal) return;
  els.adModal.classList.remove('hidden');
  els.adModal.classList.add('flex');
}
function closeAdModal() {
  if (!els.adModal) return;
  els.adModal.classList.add('hidden');
  els.adModal.classList.remove('flex');
  clearInterval(state.adTimer);
  state.adTimer = null;
}

/* 点击「看广告领会员」：先校验登录态与每日配额，再播放 mock 倒计时 */
function startAdReward() {
  const user = Store.getUser() || {};
  // ★ 会员绑定登录账号：游客不参与广告奖励
  if (!user.loggedIn || user.guest) {
    toast('登录后可领会员');
    openLogin();
    return;
  }

  const quota = MockAPI.getAdRewardQuota();
  if (quota.remaining <= 0) {
    toast('今天的广告奖励已领完，明天再来吧');
    return;
  }

  // 重置弹窗 UI
  els.adCountdown.textContent = `${AD_MOCK_SECONDS}s`;
  els.adTip.textContent = '广告播放中，请稍候…';
  els.adClaim.disabled = true;
  els.adClaim.classList.remove('bg-brand-600');
  els.adClaim.classList.add('bg-slate-300');
  els.adClaim.textContent = '领取会员';
  openAdModal();

  // mock：倒计时结束后解锁「领取会员」按钮
  // （真实环境：此处替换为广告 SDK 播放，onReward 回调里直接调 claimAdReward）
  state.adSecondsLeft = AD_MOCK_SECONDS;
  clearInterval(state.adTimer);
  state.adTimer = setInterval(() => {
    state.adSecondsLeft -= 1;
    if (state.adSecondsLeft > 0) {
      els.adCountdown.textContent = `${state.adSecondsLeft}s`;
    } else {
      clearInterval(state.adTimer);
      state.adTimer = null;
      els.adCountdown.textContent = '✓';
      els.adTip.textContent = '广告已看完，点击下方按钮领取会员';
      els.adClaim.disabled = false;
      els.adClaim.classList.remove('bg-slate-300');
      els.adClaim.classList.add('bg-brand-600');
    }
  }, 1000);
}

/* 倒计时结束后点击领取：调用接口发放会员天数并刷新所有会员展示 */
async function claimAdReward() {
  if (els.adClaim.disabled) return;
  els.adClaim.disabled = true;
  els.adClaim.textContent = '发放中…';
  els.adTip.textContent = '正在发放会员，请稍候…';

  const res = await MockAPI.extendVipByAdReward();
  if (res.ok) {
    toast(`已领取 ${res.days} 天 AI 会员，有效期至 ${formatExpire(res.vipExpireTime)}`);
    await refreshHome(); // 刷新首页会员卡 / 到期时间 / 配额
    await renderMe();    // 刷新统计页到期展示
    updateRecoLabel();   // 答题页推荐标识同步
  } else {
    toast(res.reason || '领取失败，请稍后再试');
  }
  closeAdModal();
}

/* 首页会员卡片 + 账号下拉身份展示（含会员到期时间） */
function renderVipCard() {
  const info = vipInfo();
  const vip = info.active;
  const expireText = info.expireAt ? formatExpire(info.expireAt) : '';

  if (els.vipHomeFree) {
    els.vipHomeFree.classList.toggle('hidden', vip);
    els.vipHomeFree.classList.toggle('flex', !vip);
  }
  if (els.vipHomeMember) {
    els.vipHomeMember.classList.toggle('hidden', !vip);
    els.vipHomeMember.classList.toggle('flex', vip);
  }
  if (els.vipHomeExpire) {
    els.vipHomeExpire.textContent = vip && expireText ? `会员有效期至 ${expireText}` : '';
  }

  const user = Store.getUser() || {};
  const guest = !user.loggedIn || !!user.guest;
  if (els.accountIdentity) {
    els.accountIdentity.textContent = guest ? '游客 · 未登录' : (vip ? 'AI 会员' : '免费用户');
  }
  if (els.accountExpire) {
    els.accountExpire.textContent = vip && expireText ? `到期 ${expireText}` : '';
  }

  // 下拉菜单项：游客显示「登录」，已登录显示「退出登录」
  if (els.menuLogin) els.menuLogin.classList.toggle('hidden', !!user.loggedIn);
  if (els.menuLogout) els.menuLogout.classList.toggle('hidden', !user.loggedIn);

  // ★ 广告奖励：刷新「今日剩余 N 次」配额
  renderAdRewardQuota();
}

function toggleAccountMenu() {
  const open = els.accountMenu.classList.contains('hidden');
  els.accountMenu.classList.toggle('hidden', !open);
}
function closeAccountMenu() {
  if (els.accountMenu) els.accountMenu.classList.add('hidden');
}

/* 答题页角落小字：会员「AI收益推荐中」/ 免费「SM2基础复习」 */
function updateRecoLabel() {
  if (!els.quizRecoLabel) return;
  els.quizRecoLabel.textContent = isVip() ? 'AI收益推荐中' : 'SM2基础复习';
}

/* 统计页 KC 雷达：会员展示三维掌握，免费显示开通引导 */
async function renderKCRadar() {
  const vip = isVip();
  if (els.kcRadarMember) els.kcRadarMember.classList.toggle('hidden', !vip);
  if (els.kcRadarLocked) els.kcRadarLocked.classList.toggle('hidden', vip);
  if (!vip) return;

  const res = await MockAPI.getKCSummary();
  const items = res.items || [];
  const cx = 90, cy = 90, R = 64;
  const angles = [-90, 30, 150]; // 释义(顶)、搭配(右下)、拼写(左下)
  const pts = items.map((it, i) => {
    const rad = (angles[i] * Math.PI) / 180;
    const r = R * (0.2 + 0.8 * it.mastery); // 保底 20% 可见
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  });
  const poly = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const grid = [0.25, 0.5, 0.75, 1].map((g) => {
    const gp = angles.map((a) => {
      const rad = (a * Math.PI) / 180;
      return `${(cx + R * g * Math.cos(rad)).toFixed(1)},${(cy + R * g * Math.sin(rad)).toFixed(1)}`;
    }).join(' ');
    return `<polygon points="${gp}" fill="none" stroke="#d9f5ee" stroke-width="1"/>`;
  }).join('');
  const axes = angles.map((a) => {
    const rad = (a * Math.PI) / 180;
    return `<line x1="${cx}" y1="${cy}" x2="${(cx + R * Math.cos(rad)).toFixed(1)}" y2="${(cy + R * Math.sin(rad)).toFixed(1)}" stroke="#b4ebdf" stroke-width="1"/>`;
  }).join('');
  const labels = items.map((it, i) => {
    const rad = (angles[i] * Math.PI) / 180;
    const lx = cx + (R + 18) * Math.cos(rad);
    const ly = cy + (R + 18) * Math.sin(rad);
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="#7b918d">${esc(it.label)}</text>`;
  }).join('');

  els.kcRadarSvg.innerHTML = `
    <svg width="200" height="200" viewBox="0 0 200 200">
      ${grid}
      ${axes}
      <polygon points="${poly}" fill="rgba(34,171,152,0.25)" stroke="#22ab98" stroke-width="2"/>
      ${labels}
    </svg>`;
  els.kcRadarLegend.innerHTML = items.map((it) => `
    <div class="rounded-xl bg-brand-50 p-2 text-center">
      <p class="text-[10px] text-muted">${esc(it.label)}</p>
      <p class="mt-0.5 text-sm font-semibold text-brand-700">${Math.round(it.mastery * 100)}%</p>
    </div>`).join('');
}

/* ============================================================
 * ★ 每日打卡 & 学习周报
 * ============================================================ */
async function renderCheckinCard() {
  if (!els.checkinDays) return;
  const report = await MockAPI.getWeeklyReport();
  els.checkinStreak.textContent = report.streak;
  els.checkinToday.textContent = report.checkedToday
    ? `今天已完成 ${report.todayCount} 题，打卡成功`
    : '今天还没开始，做一题自动打卡';
  els.checkinDays.innerHTML = report.days.map((d) => {
    const done = d.total > 0;
    return `<div class="flex flex-col items-center gap-1 rounded-xl py-2 ${done ? 'bg-brand-50' : 'bg-paper'}">
      <span class="text-[10px] ${done ? 'text-brand-700' : 'text-muted'}">${d.label}</span>
      <span class="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${done ? 'bg-brand-600 text-white' : 'bg-white text-slate-300'}">${done ? d.total : '·'}</span>
    </div>`;
  }).join('');
}

function openWeeklyModal() {
  if (!els.weeklyModal) return;
  els.weeklyModal.classList.remove('hidden');
  els.weeklyModal.classList.add('flex');
}
function closeWeeklyModal() {
  if (!els.weeklyModal) return;
  els.weeklyModal.classList.add('hidden');
  els.weeklyModal.classList.remove('flex');
}

async function showWeeklyReport() {
  const r = await MockAPI.getWeeklyReport();
  els.weeklySummary.innerHTML = [
    { label: '做题', value: `${r.total} 题` },
    { label: '正确率', value: `${r.accuracy}%` },
    { label: '学习天数', value: `${r.activeDays} / 7` },
  ].map((it) => `
    <div class="rounded-xl bg-brand-50 p-2.5 text-center">
      <p class="text-[10px] text-muted">${it.label}</p>
      <p class="mt-0.5 text-sm font-semibold text-brand-700">${it.value}</p>
    </div>`).join('');
  els.weeklyList.innerHTML = r.days.map((d) => `
    <div class="flex items-center justify-between rounded-xl px-3 py-2 ${d.total ? 'bg-paper' : 'bg-white'}">
      <span class="text-xs ${d.total ? 'text-ink' : 'text-slate-300'}">周${d.label} · ${d.date.slice(5)}</span>
      <span class="text-[11px] ${d.total ? 'text-brand-700' : 'text-slate-300'}">${d.total ? `${d.total} 题 · ${d.accuracy}%` : '未学习'}</span>
    </div>`).join('');
  openWeeklyModal();
}

/* ============================================================
 * ★ 单词详情弹层：发音 / 释义 / 助记 / 易混 / 收藏 / 标记
 * ============================================================ */
async function openWordDetail(bookId, wordId) {
  const w = await MockAPI.getWordDetail(bookId, wordId);
  if (!w) return;
  state.wordDetail = w;
  els.wordTitle.textContent = w.word;
  els.wordPhonetic.textContent = w.phonetic || '';
  els.wordMeaning.textContent = w.meaning || '暂无词义';
  els.wordDefinition.textContent = w.definition || '';
  els.wordDefRow.classList.toggle('hidden', !w.definition);
  els.wordHint.textContent = w.hint || '';
  els.wordHintRow.classList.toggle('hidden', !w.hint);
  const confusables = (w.confusables || []).join('；');
  els.wordConfusable.textContent = confusables;
  els.wordConfRow.classList.toggle('hidden', !confusables);
  els.wordFav.textContent = w.favorite ? '★' : '☆';
  els.wordFav.classList.toggle('text-amber-500', !!w.favorite);
  els.wordFav.classList.toggle('text-ink', !w.favorite);
  els.wordModal.classList.remove('hidden');
  els.wordModal.classList.add('flex');
}

function closeWordDetail() {
  if (!els.wordModal) return;
  els.wordModal.classList.add('hidden');
  els.wordModal.classList.remove('flex');
  state.wordDetail = null;
}

async function markFromWordDetail(status) {
  const w = state.wordDetail;
  if (!w) return;
  await MockAPI.markWord({ bookId: w.bookId, wordId: w.id, status });
  w.status = status;
  toast(status === 'known' ? `已标记认识：${w.word}` : `已标记不认识：${w.word}`);
  await renderBooks();
}

function speakWord(text) {
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    toast('当前设备不支持发音');
    return;
  }
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    synth.speak(u);
  } catch (err) {
    toast('发音失败，请稍后再试');
  }
}

/* ============================================================
 * ★ 合规文本 / 数据导出 / 注销账号
 * ============================================================ */
const LEGAL_TEXT = {
  privacy: {
    title: '隐私政策',
    blocks: [
      '词溯重视你的隐私。本政策说明我们收集哪些信息、如何使用，以及你可以如何管理自己的数据。',
      '一、我们收集的信息\n1. 账号信息：手机号或微信标识，仅用于登录与账号识别。\n2. 学习数据：作答记录、掌握标记、复习间隔、打卡与收藏，用于生成学习报告和推荐下一题。\n3. 设备本地数据：游客模式下所有数据只保存在本机浏览器中。',
      '二、信息的使用\n学习数据仅用于为你安排复习节奏、展示统计与周报，不会用于与学习无关的用途。',
      '三、信息的存储\n未登录时数据保存在本机；登录后同步到账号，用于多端恢复。你可以在「我的 - 学习工具」中导出或注销删除。',
      '四、你的权利\n你可以随时导出学习数据、重置学习记录或注销账号。注销后账号与服务端学习数据将被删除且不可恢复。',
      '五、联系我们\n如对隐私政策有疑问，可通过应用内反馈渠道联系我们。',
    ],
  },
  terms: {
    title: '用户协议',
    blocks: [
      '欢迎使用词溯。使用本应用即表示你同意以下条款。',
      '一、服务内容\n词溯提供单词学习、刷题、错题复测、学习统计等功能。部分功能（如 AI 会员）需要登录后使用。',
      '二、账号与数据\n请妥善保管账号。游客数据仅保存在本机，更换设备或清理浏览器数据可能导致丢失；登录后可多端同步。',
      '三、使用规范\n请勿利用本应用进行任何违法或干扰服务正常运行的行为。',
      '四、会员与广告\n会员权益、赠送与广告奖励以应用内展示的规则为准。体验版开通不产生真实支付。',
      '五、免责声明\n词库与释义仅供参考，学习效果因人而异。因设备、网络或不可抗力造成的服务中断，我们会尽力恢复但不承担由此产生的间接损失。',
      '六、条款更新\n我们可能根据功能调整更新本协议，更新后会在应用内展示。',
    ],
  },
};

function openLegal(kind) {
  const data = LEGAL_TEXT[kind];
  if (!data || !els.legalModal) return;
  els.legalTitle.textContent = data.title;
  els.legalBody.innerHTML = data.blocks
    .map((t) => `<p class="whitespace-pre-line">${esc(t)}</p>`)
    .join('');
  els.legalModal.classList.remove('hidden');
  els.legalModal.classList.add('flex');
}
function closeLegal() {
  if (!els.legalModal) return;
  els.legalModal.classList.add('hidden');
  els.legalModal.classList.remove('flex');
}

async function exportLearningData() {
  const data = await MockAPI.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `cishuo-data-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  toast('学习数据已导出');
}

function openDeleteModal() {
  if (!els.deleteModal) return;
  els.deleteModal.classList.remove('hidden');
  els.deleteModal.classList.add('flex');
}
function closeDeleteModal() {
  if (!els.deleteModal) return;
  els.deleteModal.classList.add('hidden');
  els.deleteModal.classList.remove('flex');
  if (els.deleteConfirm) {
    els.deleteConfirm.disabled = false;
    els.deleteConfirm.textContent = '确认注销';
  }
}

async function confirmDeleteAccount() {
  const btn = els.deleteConfirm;
  if (!btn || btn.disabled) return;
  btn.disabled = true;
  btn.textContent = '注销中…';
  const res = await MockAPI.deleteAccount();
  if (!res.ok) {
    btn.disabled = false;
    btn.textContent = '确认注销';
    toast(res.error || '注销失败，请稍后再试');
    return;
  }
  closeDeleteModal();
  state.session = null;
  state.question = null;
  state.draft = { username: '', wordbook: 'zk', level: 'general' };
  els.obUsername.value = '';
  renderBookOptions();
  renderLevelOptions();
  updateGuestHint();
  showView('welcome');
  toast('账号已注销，本机数据已清空');
}

/* ============================================================
 * 引导流程
 * ============================================================ */
function goObStep(step) {
  state.obStep = step;
  for (let i = 1; i <= 5; i++) {
    const box = $(`ob-${i}`);
    if (box) box.classList.toggle('hidden', i !== step);
  }

  $('ob-next-1').classList.toggle('hidden', step !== 1);
  $('ob-next-2').classList.toggle('hidden', step !== 2);
  $('ob-next-3').classList.toggle('hidden', step !== 3);
  $('ob-start-placement').classList.toggle('hidden', step !== 4);
  $('ob-enter-app').classList.toggle('hidden', step !== 5);

  els.obBack.classList.toggle('hidden', step === 1 || step === 5);
  els.obDots.classList.toggle('hidden', step === 5);

  document.querySelectorAll('#ob-dots span').forEach((dot, i) => {
    dot.className = `h-1.5 w-1.5 rounded-full ${i < Math.min(step, 4) ? 'bg-brand-400' : 'bg-brand-200'}`;
  });
}

function renderBookOptions() {
  els.obBooks.innerHTML = WORDBOOKS.map((b) => {
    const active = state.draft.wordbook === b.id;
    return `
      <button data-book="${b.id}" class="flex w-full items-center justify-between rounded-2xl border-2 bg-white px-4 py-4 text-left ${active ? 'border-brand-500' : 'border-slate-200'}">
        <div>
          <p class="text-sm font-semibold">${b.name}</p>
          <p class="mt-0.5 text-[11px] text-muted">${b.desc} · ${getBookWords(b.id).length} 词</p>
        </div>
        <span class="flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200'}">${active ? '✓' : ''}</span>
      </button>`;
  }).join('');
}

function renderLevelOptions() {
  els.obLevels.innerHTML = LEVELS.map((l) => {
    const active = state.draft.level === l.id;
    return `
      <button data-level="${l.id}" class="flex w-full items-start gap-3 rounded-2xl border-2 bg-white px-4 py-4 text-left ${active ? 'border-brand-500' : 'border-slate-200'}">
        <span class="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 ${active ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200'}">${active ? '✓' : ''}</span>
        <div>
          <p class="text-sm font-semibold">${l.name}</p>
          <p class="mt-0.5 text-[11px] leading-relaxed text-muted">${l.desc}</p>
        </div>
      </button>`;
  }).join('');
}

function renderObSummary() {
  els.obSummary.innerHTML = `
    <div class="flex items-center justify-between"><span class="text-muted">词书</span><span class="font-medium">${bookName(state.draft.wordbook)}</span></div>
    <div class="flex items-center justify-between"><span class="text-muted">自评水平</span><span class="font-medium">${levelName(state.draft.level)}</span></div>
    <div class="flex items-center justify-between"><span class="text-muted">题目数量</span><span class="font-medium">${PLACEMENT_TOTAL} 道</span></div>`;
}

async function handleLoginNext() {
  const name = els.obUsername.value.trim();
  if (!name) {
    els.obUsernameError.classList.remove('hidden');
    els.obUsername.focus();
    return;
  }
  els.obUsernameError.classList.add('hidden');
  state.draft.username = name;
  await MockAPI.login({ username: name });
  renderBookOptions();
  goObStep(2);
}

/* ============================================================
 * 首页
 * ============================================================ */
async function refreshHome() {
  const s = await MockAPI.getHomeSummary();
  const user = Store.getUser() || {};
  els.homeGreeting.textContent = `${greeting()}，${s.username || '同学'}`;
  els.homeBookTag.textContent = bookName(s.wordbook);

  const answered = s.answeredToday;
  const target = s.newTarget;
  els.homeNew.textContent = Math.min(answered, target);
  els.homeNewTarget.textContent = `/ ${target}`;
  els.homeReview.textContent = s.reviewCount;
  els.homeMastered.textContent = s.mastered;
  els.homeTotal.textContent = `/ ${s.totalWords}`;
  els.homeAccuracy.textContent = s.todayAccuracy;
  els.homeProgressText.textContent = `${Math.min(answered, target)} / ${target}`;
  els.homeProgressBar.style.width = `${target ? Math.min(100, (answered / target) * 100) : 0}%`;

  if (user.username) {
    const avatar = $('btn-go-me');
    avatar.textContent = user.username.slice(0, 1).toUpperCase();
  }

  // 记忆分层 / 薄弱雷达（只读展示，不影响出题逻辑）
  Memory.renderHome();

  // ★ 会员卡片与账号下拉身份展示
  renderVipCard();

  // ★ 每日打卡 + 近 7 天学习
  await renderCheckinCard();
}

async function enterApp(view = 'home') {
  await refreshHome();
  if (view === 'books') await renderBooks();
  if (view === 'me') await renderMe();
  showView(view);
}

/* ============================================================
 * 答题
 * ============================================================ */
function quizModeText(mode) {
  if (mode === 'placement') return '定级测试';
  if (mode === 'wrong') return '错题重练';
  return '随机练习';
}

function startSession(mode, opts = {}) {
  const user = Store.getUser();
  state.session = {
    mode,
    wordbook: mode === 'wrong' ? null : (user ? user.wordbook : 'zk'),
    total: mode === 'placement' ? PLACEMENT_TOTAL : (opts.total || 0),
    answered: 0,
    correct: 0,
    askedWordIds: [],
    wrongItems: opts.wrongItems || [],
  };
  state.session.wordbook = state.session.wordbook || 'zk';
  showView('quiz');
  updateQuizHeader();
  loadNextQuestion();
}

function updateQuizHeader() {
  const s = state.session;
  if (!s) return;
  const idx = Math.min(s.answered + 1, s.total || s.answered + 1);
  els.quizCounter.textContent = s.total ? `第 ${idx} / ${s.total} 题` : `第 ${s.answered + 1} 题`;
  els.quizModeLabel.textContent = s.mode === 'wrong'
    ? '错题重练'
    : `${quizModeText(s.mode)} · ${bookName(s.wordbook)}`;

  let progress = 0;
  if (s.mode === 'placement') {
    progress = (s.answered / s.total) * 100;
  } else if (s.mode === 'wrong' && s.total) {
    progress = (s.answered / s.total) * 100;
  } else {
    const goal = Store.getSettings().dailyGoal;
    const done = Store.getStats().todayTotal;
    progress = goal ? (done / goal) * 100 : 0;
  }
  els.quizProgress.style.width = `${Math.min(100, progress)}%`;
}

function startTimer() {
  clearInterval(state.timerId);
  state.startedAt = performance.now();
  els.quizTimer.textContent = '00:00';
  state.timerId = setInterval(() => {
    const sec = Math.floor((performance.now() - state.startedAt) / 1000);
    els.quizTimer.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }, 300);
}

function resetQuestionUI() {
  state.answered = false;
  state.selectedKey = null;
  state.revealedHint = false;
  state.clozeAnswers = []; // ★ 重置完形填空选择

  els.quizCard.classList.add('opacity-50');
  els.quizPrompt.textContent = '出题中…';
  els.quizPrompt.className = 'mt-4 text-2xl font-semibold text-muted';
  els.quizPhonetic.textContent = '';
  els.quizOptions.innerHTML = '';
  if (els.quizImageWrap) els.quizImageWrap.classList.add('hidden');
  if (els.quizImage) els.quizImage.removeAttribute('src');
  els.quizHint.classList.add('hidden');
  els.quizAnalysis.classList.add('hidden');
  els.btnSubmit.classList.remove('hidden');
  els.btnNext.classList.add('hidden');
  els.btnHint.classList.add('hidden'); // 出题后再按是否有助记决定显示
}

async function loadNextQuestion() {
  const s = state.session;
  if (!s) return;
  const token = ++state.qToken;

  resetQuestionUI();

  const q = await MockAPI.fetchNextQuestion({
    wordbook: s.wordbook,
    mode: s.mode,
    excludeWordIds: s.askedWordIds,
    wrongItems: s.wrongItems,
  });

  if (token !== state.qToken) return; // 防止快速点击导致旧请求覆盖

  if (!q) {
    state.session = null;
    await enterApp('home');
    toast('题目暂时用完了，先休息一下');
    return;
  }

  state.question = q;
  state.session.askedWordIds.push(q.wordId);
  renderQuestion(q);
  updateQuizHeader();
}

/* ============================================================
 * ★ 答题页题型分支渲染：单选 / 图片匹配（两个子形式）/ 短句完形
 *   判分与上报仍复用同一套逻辑（answerKey / answer）。
 * ============================================================ */
function renderQuestion(q) {
  els.quizCard.classList.remove('opacity-50');
  els.quizCard.classList.remove('fade-in');
  void els.quizCard.offsetWidth;
  els.quizCard.classList.add('fade-in');

  // ★ 答题页角落标识：会员/免费切换文案
  updateRecoLabel();

  els.quizType.textContent = q.typeLabel || '看英文，选中文';
  if (els.quizImageWrap) els.quizImageWrap.classList.add('hidden');
  state.clozeAnswers = [];
  resetOptionsLayout(); // 每题先恢复默认纵向布局，图片题再改成网格

  if (q.type === 'cloze') {
    renderClozeQuestion(q);
  } else if (q.type === 'img2word') {
    renderImageToWord(q);
  } else if (q.type === 'word2img') {
    renderWordToImage(q);
  } else if (q.type === 'def2word' || q.type === 'word2def') {
    renderDefQuestion(q);
  } else {
    renderPlainChoice(q);
  }

  // ★ 没有助记就不出「查看提示」按钮，避免点开永远没内容
  els.btnHint.classList.toggle('hidden', !(q.explanation && q.explanation.hint));

  startTimer();
}

/* 题型 1：原有单选（英文→中文 / 中文→英文 / 拼写） */
function renderPlainChoice(q) {
  if (q.type === 'zh2en') {
    els.quizPrompt.textContent = q.prompt;
    els.quizPrompt.className = 'mt-4 text-[22px] font-semibold leading-relaxed';
    els.quizPhonetic.textContent = '从下面选出对应的英文单词';
    els.quizPhonetic.className = 'mt-1.5 text-xs text-muted';
  } else {
    els.quizPrompt.textContent = q.prompt;
    els.quizPrompt.className = 'mt-4 text-[32px] font-semibold tracking-tight';
    els.quizPhonetic.textContent = q.phonetic;
    els.quizPhonetic.className = 'mt-1.5 text-sm text-muted';
  }

  els.quizOptions.innerHTML = q.options.map((o) => `
    <button data-key="${o.key}" class="opt-btn flex w-full items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-left">
      <span data-key-badge class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700">${o.key}</span>
      <span class="flex-1 text-[15px] leading-snug">${esc(o.text)}</span>
    </button>`).join('');
}

/* 题型 2-①：展示图片，选择英文单词 */
function renderImageToWord(q) {
  els.quizPrompt.textContent = '看图，选出对应的英文单词';
  els.quizPrompt.className = 'mt-3 text-[15px] font-medium text-muted';
  els.quizPhonetic.textContent = '';
  els.quizPhonetic.className = 'hidden';

  if (els.quizImageWrap && els.quizImage) {
    els.quizImage.src = q.imageUrl || (q.options[0] && q.options[0].imageUrl) || '';
    els.quizImage.alt = '题目配图';
    els.quizImageWrap.classList.remove('hidden');
  }

  els.quizOptions.innerHTML = q.options.map((o) => `
    <button data-key="${o.key}" class="opt-btn flex w-full items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-4 text-left">
      <span data-key-badge class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700">${o.key}</span>
      <span class="flex-1 text-[16px] font-medium leading-snug">${esc(o.text)}</span>
    </button>`).join('');
}

/* 题型 2-②：展示单词，选择匹配图片 */
function renderWordToImage(q) {
  els.quizPrompt.textContent = q.word;
  els.quizPrompt.className = 'mt-4 text-[32px] font-semibold tracking-tight';
  els.quizPhonetic.textContent = `${q.phonetic} · 选出对应的图片`;
  els.quizPhonetic.className = 'mt-1.5 text-xs text-muted';

  els.quizOptions.className = 'mt-5 grid grid-cols-2 gap-3';
  els.quizOptions.innerHTML = q.options.map((o) => `
    <button data-key="${o.key}" class="opt-btn img-opt relative overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
      <img src="${o.imageUrl || ''}" alt="选项 ${o.key}" class="h-24 w-full object-cover" loading="lazy" />
      <span data-key-badge class="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-[10px] font-semibold text-brand-700 shadow-sm">${o.key}</span>
    </button>`).join('');
}

/* 题型 4：英文释义匹配（def2word 看义选词 / word2def 看词选义） */
function renderDefQuestion(q) {
  if (q.type === 'def2word') {
    els.quizPrompt.textContent = q.prompt;
    els.quizPrompt.className = 'mt-4 text-[15px] font-medium leading-relaxed text-slate-700';
    els.quizPhonetic.textContent = '从下面选出对应的英文单词';
    els.quizPhonetic.className = 'mt-1.5 text-xs text-muted';
  } else {
    els.quizPrompt.textContent = q.prompt;
    els.quizPrompt.className = 'mt-4 text-[32px] font-semibold tracking-tight';
    els.quizPhonetic.textContent = `${q.phonetic} · 选出对应的英文释义`;
    els.quizPhonetic.className = 'mt-1.5 text-xs text-muted';
  }

  els.quizOptions.innerHTML = q.options.map((o) => `
    <button data-key="${o.key}" class="opt-btn flex w-full items-start gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 text-left">
      <span data-key-badge class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-semibold text-brand-700">${o.key}</span>
      <span class="flex-1 text-[14px] leading-snug">${esc(o.text)}</span>
    </button>`).join('');
}

/* 题型 3：短句完形填空（{{blank}} → 下拉选词，全部答对才算正确） */
function renderClozeQuestion(q) {
  els.quizPrompt.className = 'mt-4 text-[15px] font-medium leading-loose';
  els.quizPhonetic.textContent = `共 ${(q.blanks || []).length} 个空 · 全部选对才算正确`;
  els.quizPhonetic.className = 'mt-1.5 text-xs text-muted';

  const parts = esc(q.prompt).split('{{blank}}');
  let html = '';
  parts.forEach((part, i) => {
    html += part;
    if (i < parts.length - 1) {
      const blank = (q.blanks || [])[i];
      const opts = (blank ? blank.options : []).map((o) => `<option value="${esc(o.text)}">${esc(o.text)}</option>`).join('');
      html += `<select class="cloze-select mx-1 rounded-xl border-2 border-brand-200 bg-brand-50 px-2 py-1 text-sm font-medium text-brand-800 outline-none" data-blank="${i}">
        <option value="">请选择</option>${opts}
      </select>`;
    }
  });
  els.quizPrompt.innerHTML = html;

  els.quizOptions.className = 'mt-5';
  els.quizOptions.innerHTML = '<p class="rounded-2xl bg-paper px-4 py-3 text-center text-xs text-muted">在每个下拉框中选一个词，全部答对本题才算正确</p>';
}

/* 恢复选项容器为默认布局（下一题可能是不同类型） */
function resetOptionsLayout() {
  els.quizOptions.className = 'mt-5 space-y-2.5';
}

function selectOption(key) {
  if (state.answered) return;
  state.selectedKey = key;
  document.querySelectorAll('#quiz-options button').forEach((btn) => {
    const active = btn.dataset.key === key;
    btn.classList.toggle('border-brand-500', active);
    btn.classList.toggle('bg-brand-50', active);
    btn.classList.toggle('border-slate-200', !active);
    btn.classList.toggle('bg-white', !active);
  });
}

function paintOptions() {
  const q = state.question;
  document.querySelectorAll('#quiz-options button').forEach((btn) => {
    const key = btn.dataset.key;
    const isImageOpt = btn.classList.contains('img-opt');
    btn.disabled = true;
    btn.classList.remove('border-brand-500', 'bg-brand-50', 'border-slate-200', 'bg-white');
    if (key === q.answerKey) {
      btn.classList.add('border-emerald-500', 'bg-emerald-50');
      const badge = btn.querySelector('[data-key-badge]');
      if (badge && !isImageOpt) badge.className = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-semibold text-white';
    } else if (key === state.selectedKey) {
      btn.classList.add('border-rose-400', 'bg-rose-50');
      const badge = btn.querySelector('[data-key-badge]');
      if (badge && !isImageOpt) badge.className = 'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-400 text-[11px] font-semibold text-white';
    } else {
      btn.classList.add('border-slate-100', 'bg-white', 'opacity-60');
    }
  });
}

/* ★ 完形填空判分着色：每个下拉框按对错标色 */
function paintCloze() {
  const q = state.question;
  document.querySelectorAll('.cloze-select').forEach((sel) => {
    const i = Number(sel.dataset.blank);
    const correct = q.blanks && q.blanks[i] ? q.blanks[i].answer : null;
    sel.disabled = true;
    sel.classList.remove('border-brand-200', 'bg-brand-50');
    if (sel.value === correct) {
      sel.classList.add('border-emerald-500', 'bg-emerald-50', 'text-emerald-700');
    } else {
      sel.classList.add('border-rose-400', 'bg-rose-50', 'text-rose-600');
    }
  });
}

async function submitCurrentAnswer() {
  const q = state.question;
  if (!q || state.answered) return;

  let isCorrect = false;
  let userChoice = '';
  let wrongChoice = null;
  let chosen = null;

  if (q.type === 'cloze') {
    // ★ 完形：所有空都选了才能提交；全部答对才算本题正确
    const blanks = q.blanks || [];
    if (blanks.some((b, i) => !state.clozeAnswers[i])) {
      toast('请把每个空都选完');
      return;
    }
    isCorrect = blanks.every((b, i) => state.clozeAnswers[i] === b.answer);
    userChoice = state.clozeAnswers.join(' / ');
    wrongChoice = isCorrect ? null : userChoice;
  } else {
    if (!state.selectedKey) {
      toast('先选一个选项再提交');
      return;
    }
    chosen = q.options.find((o) => o.key === state.selectedKey);
    isCorrect = state.selectedKey === q.answerKey;
    userChoice = chosen ? chosen.text : '';
    wrongChoice = isCorrect ? null : (chosen ? chosen.text : null);
  }

  state.answered = true;
  clearInterval(state.timerId);
  const durationMs = Math.round(performance.now() - state.startedAt);

  if (q.type === 'cloze') {
    paintCloze();
  } else {
    paintOptions();
  }
  showAnalysis(isCorrect, chosen);

  els.btnSubmit.classList.add('hidden');
  els.btnNext.classList.remove('hidden');
  els.btnHint.classList.add('hidden');

  state.session.answered += 1;
  if (isCorrect) state.session.correct += 1;

  // ★ 提交作答记录：参数固定，后续替换成真实接口即可（题型不影响入参）
  try {
    await MockAPI.submitAnswer({
      questionId: q.questionId,
      userChoice,
      isCorrect,
      durationMs,
      wrongChoice,
    });
  } catch (e) {
    toast('记录上报失败，已保存在本地');
  }

  updateQuizHeader();
}

function showAnalysis(isCorrect, chosen) {
  const q = state.question;
  els.quizAnalysis.classList.remove('hidden');

  // ★ 完形题没有选项字母，直接展示正确填法与完整句子
  const isCloze = q.type === 'cloze';
  const answerLabel = isCloze ? q.answerText : `${q.answerKey} · ${q.answerText}`;
  if (isCloze) {
    els.analysisVerdict.innerHTML = isCorrect
      ? '回答正确 🎉'
      : `回答错误，正确填法：${esc(q.answerText)}<br><span class="font-normal text-muted">${esc(q.sentenceFilled || '')}</span>`;
  } else {
    els.analysisVerdict.textContent = isCorrect
      ? '回答正确 🎉'
      : `回答错误，正确答案：${answerLabel}`;
  }
  els.analysisVerdict.className = `text-sm font-semibold ${isCorrect ? 'text-emerald-600' : 'text-rose-500'}`;

  els.analysisMeaning.textContent = q.explanation.meaning;

  // ★ 助记/易混：有内容才显示这一行，避免整片「暂无」
  const hintText = q.explanation.hint || '';
  els.analysisHint.textContent = hintText;
  els.analysisHint.parentElement.classList.toggle('hidden', !hintText);

  const confusableText = q.explanation.confusables.length
    ? q.explanation.confusables.join('；')
    : '';
  let extra = '';
  if (!isCorrect && chosen) extra = `你选了：${chosen.text}`;
  if (!isCorrect && isCloze) extra = `你填了：${state.clozeAnswers.join(' / ')}`;
  els.analysisConfusable.textContent = confusableText
    ? (extra ? `${confusableText}（${extra}）` : confusableText)
    : extra;
  els.analysisConfusable.parentElement.classList.toggle('hidden', !confusableText && !extra);

  els.analysisBody.classList.remove('hidden');
  els.analysisChevron.textContent = '收起 ▲';
}

async function goNextQuestion() {
  const s = state.session;
  if (!s) return;

  if (s.mode === 'placement' && s.answered >= s.total) {
    await finishPlacement();
    return;
  }
  await loadNextQuestion();
}

async function finishPlacement() {
  clearInterval(state.timerId);
  const s = state.session;
  const correct = s.correct;
  const total = s.total;

  await MockAPI.completeOnboarding({
    wordbook: state.draft.wordbook,
    level: state.draft.level,
  });

  state.session = null;
  state.question = null;

  els.obResultText.textContent = `已按你的自评水平「${levelName(state.draft.level)}」安排学习节奏。`;
  els.obResultBox.innerHTML = `
    <div class="flex items-center justify-between text-sm"><span class="text-muted">定级答对</span><span class="font-semibold text-brand-700">${correct} / ${total}</span></div>
    <div class="mt-2 flex items-center justify-between text-sm"><span class="text-muted">当前词书</span><span class="font-semibold">${bookName(state.draft.wordbook)}</span></div>
    <div class="mt-2 flex items-center justify-between text-sm"><span class="text-muted">每日新词</span><span class="font-semibold">${Store.getSettings().dailyGoal} 个</span></div>`;

  await refreshHome();
  showView('onboarding');
  goObStep(5);
}

function exitQuiz() {
  clearInterval(state.timerId);
  const wasPlacement = state.session && state.session.mode === 'placement';
  state.session = null;
  state.question = null;
  state.qToken += 1;

  if (wasPlacement) {
    showView('onboarding');
    goObStep(4);
  } else {
    enterApp('home');
  }
}

/* ============================================================
 * 词书 & 单词本 & 错题本
 * ============================================================ */

/* ★ 词书列表分页控件渲染（大词库下只渲染当前页，避免一次性塞上千个 DOM 节点卡顿） */
function renderWordPager(count) {
  if (!els.wordPager) return;
  const totalPages = state.wordTotalPages;
  if (totalPages <= 1) {
    els.wordPager.innerHTML = '';
    return;
  }
  const p = state.wordPage;
  els.wordPager.innerHTML = `
    <button data-page="prev" class="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs text-brand-700 disabled:opacity-40" ${p <= 1 ? 'disabled' : ''}>上一页</button>
    <span class="text-xs text-muted">第 ${p} / ${totalPages} 页 · 共 ${count} 词</span>
    <button data-page="next" class="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs text-brand-700 disabled:opacity-40" ${p >= totalPages ? 'disabled' : ''}>下一页</button>`;
}

async function renderBooks() {
  const user = Store.getUser() || {};
  const bookId = user.wordbook || 'zk';

  els.bookChips.innerHTML = WORDBOOKS.map((b) => {
    const active = b.id === bookId;
    return `<button data-book="${b.id}" class="shrink-0 rounded-full border px-4 py-2 text-xs font-medium ${active ? 'border-brand-600 bg-brand-600 text-white' : 'border-brand-100 bg-white text-muted'}">${b.name}</button>`;
  }).join('');

  els.tabWords.className = `rounded-xl py-2.5 text-sm font-medium ${state.booksTab === 'words' ? 'bg-brand-600 text-white' : 'text-muted'}`;
  els.tabFav.className = `rounded-xl py-2.5 text-sm font-medium ${state.booksTab === 'fav' ? 'bg-brand-600 text-white' : 'text-muted'}`;
  els.tabWrong.className = `rounded-xl py-2.5 text-sm font-medium ${state.booksTab === 'wrong' ? 'bg-brand-600 text-white' : 'text-muted'}`;
  els.wordsPanel.classList.toggle('hidden', state.booksTab !== 'words');
  els.favPanel.classList.toggle('hidden', state.booksTab !== 'fav');
  els.wrongPanel.classList.toggle('hidden', state.booksTab !== 'wrong');

  const words = await MockAPI.getWordList(bookId);
  const total = words.length;
  // ★ 搜索过滤：匹配单词或释义（不区分大小写）
  const kw = state.wordSearch.trim().toLowerCase();
  const filtered = kw
    ? words.filter((w) => w.word.toLowerCase().includes(kw) || (w.meaning || '').toLowerCase().includes(kw))
    : words;
  const knownCount = filtered.filter((w) => w.status === 'known').length;
  els.wordsCount.textContent = kw ? `${filtered.length} / ${total}` : total;

  // ★ 分页：仅渲染当前页，避免上千词一次性塞进 DOM
  const pageSize = state.wordPageSize;
  state.wordTotalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  if (state.wordPage > state.wordTotalPages) state.wordPage = state.wordTotalPages;
  if (state.wordPage < 1) state.wordPage = 1;
  const start = (state.wordPage - 1) * pageSize;
  const pageWords = filtered.slice(start, start + pageSize);

  els.wordList.innerHTML =
    `<p class="px-1 pb-1 text-[11px] text-muted">已标记认识 ${knownCount} / ${filtered.length}${kw ? '（搜索结果）' : ''}</p>` +
    (pageWords.length
      ? pageWords.map((w) => `
      <div data-open-word="${w.id}" class="cursor-pointer rounded-2xl bg-white p-3.5 shadow-sm active:bg-brand-50/60">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold">${esc(w.word)}<span class="ml-1.5 text-[10px] font-normal text-muted">${esc(w.phonetic)}</span></p>
            <p class="mt-0.5 text-xs text-muted">${esc(w.meaning)}</p>
          </div>
          <div class="flex shrink-0 gap-1.5">
            <button data-act="known" data-id="${w.id}" class="rounded-full px-2.5 py-1.5 text-[10px] ${w.status === 'known' ? 'bg-emerald-500 text-white' : 'bg-paper text-muted'}">认识</button>
            <button data-act="unknown" data-id="${w.id}" class="rounded-full px-2.5 py-1.5 text-[10px] ${w.status === 'unknown' ? 'bg-rose-400 text-white' : 'bg-paper text-muted'}">不认识</button>
          </div>
        </div>
      </div>`).join('')
      : `<div class="rounded-2xl bg-white p-8 text-center text-sm text-muted shadow-sm">没有找到匹配的单词</div>`);

  // ★ 分页控件
  renderWordPager(filtered.length);

  const wrong = await MockAPI.getWrongItems();
  els.wrongCount.textContent = wrong.length;
  els.wrongList.innerHTML = wrong.length
    ? wrong.map((w) => `
      <div data-open-word="${w.wordId}" data-open-book="${w.bookId}" class="cursor-pointer rounded-2xl bg-white p-3.5 shadow-sm active:bg-rose-50/60">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">${esc(w.word)}<span class="ml-1.5 text-[10px] font-normal text-muted">${esc(w.phonetic)}</span></p>
            <p class="mt-0.5 text-xs text-muted">${esc(w.meaning)}</p>
            ${w.wrongChoice ? `<p class="mt-1 text-[10px] text-rose-400">曾错选：${esc(w.wrongChoice)}${w.times > 1 ? ` · 错 ${w.times} 次` : ''}</p>` : ''}
          </div>
          <span class="shrink-0 rounded-full bg-rose-50 px-2 py-1 text-[10px] text-rose-500">${esc(bookName(w.bookId))}</span>
        </div>
      </div>`).join('')
    : `<div class="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p class="text-2xl">🌿</p>
        <p class="mt-2 text-sm font-medium">错题本是空的</p>
        <p class="mt-1 text-xs text-muted">做错的单词会自动收集到这里</p>
      </div>`;

  // ★ 收藏夹：展示所有收藏词，点开可看详情
  const favorites = await MockAPI.getFavorites();
  if (els.favCountBooks) els.favCountBooks.textContent = favorites.length;
  els.favList.innerHTML = favorites.length
    ? favorites.map((w) => `
      <div data-open-word="${w.wordId}" data-open-book="${w.bookId}" class="cursor-pointer rounded-2xl bg-white p-3.5 shadow-sm active:bg-brand-50/60">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">${esc(w.word)}<span class="ml-1.5 text-[10px] font-normal text-muted">${esc(w.phonetic)}</span></p>
            <p class="mt-0.5 text-xs text-muted">${esc(w.meaning)}</p>
          </div>
          <span class="shrink-0 text-amber-500">★</span>
        </div>
      </div>`).join('')
    : `<div class="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p class="text-2xl">📌</p>
        <p class="mt-2 text-sm font-medium">还没有收藏</p>
        <p class="mt-1 text-xs text-muted">在单词详情里点 ☆ 即可收藏</p>
      </div>`;
}

/* ============================================================
 * 数据 & 设置
 * ============================================================ */
async function renderMe() {
  const user = Store.getUser() || {};
  els.meUsername.textContent = user.username || '同学';

  // 账号信息：游客 / 手机号 / 微信（登录后才展示退出入口）
  if (els.meAccount) {
    if (!user.loggedIn) {
      els.meAccount.textContent = '游客模式 · 记录仅保存在本机';
    } else if (user.authMode === 'wechat') {
      els.meAccount.textContent = '微信登录 · 记录可多端同步';
    } else {
      els.meAccount.textContent = `手机号 ${maskPhone(user.phone)} · 记录可多端同步`;
    }
  }
  $('btn-logout').classList.toggle('hidden', !user.loggedIn);
  // ★ 注销账号仅登录用户可见；游客本地数据走「重置学习记录」
  if (els.btnDeleteAccount) {
    els.btnDeleteAccount.classList.toggle('hidden', !user.loggedIn);
    els.btnDeleteAccount.classList.toggle('flex', !!user.loggedIn);
  }

  // ★ 会员到期时间展示（统计页）
  const info = vipInfo();
  if (els.meVipExpire) {
    if (info.active) {
      els.meVipExpire.textContent = info.expireAt
        ? `AI 会员 · 有效期至 ${formatExpire(info.expireAt)}`
        : 'AI 会员 · 长期有效';
    } else if (info.expired) {
      els.meVipExpire.textContent = `会员已于 ${formatExpire(info.expireAt)} 到期，已回落到 SM2 基础复习`;
    } else {
      els.meVipExpire.textContent = !user.loggedIn ? '' : '免费用户 · SM2 基础复习';
    }
  }

  els.meBook.textContent = bookName(user.wordbook || 'zk');
  els.meLevel.textContent = levelName(user.level || 'general');
  $('me-avatar').textContent = (user.username || '词').slice(0, 1).toUpperCase();

  const st = await MockAPI.getStats();
  els.statAccuracy.textContent = st.accuracy;
  els.statTotal.textContent = st.total;
  els.statWrong.textContent = st.wrong;
  els.statMastered.textContent = st.mastered;

  // 记忆档案 / 收藏墙 / 学习小结（只读展示）
  Memory.renderMe();

  // ★ 会员专属：KC 维度掌握雷达（免费显示开通引导）
  await renderKCRadar();

  // ★ 学习工具：收藏数量
  if (els.meFavCount) {
    const favorites = await MockAPI.getFavorites();
    els.meFavCount.textContent = `${favorites.length} 个 ›`;
  }

  els.goalInput.value = Store.getSettings().dailyGoal;
}

/* ============================================================
 * 事件绑定
 * ============================================================ */
function bindEvents() {
  /* ---------- 引导 ---------- */
  $('ob-next-1').addEventListener('click', handleLoginNext);

  els.obUsername.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLoginNext();
  });

  $('ob-next-2').addEventListener('click', () => {
    renderLevelOptions();
    goObStep(3);
  });

  $('ob-next-3').addEventListener('click', () => {
    renderObSummary();
    goObStep(4);
  });

  $('ob-start-placement').addEventListener('click', () => {
    startSession('placement');
  });

  $('ob-enter-app').addEventListener('click', () => enterApp('home'));

  els.obBack.addEventListener('click', () => {
    if (state.obStep > 1) goObStep(state.obStep - 1);
  });

  els.obBooks.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-book]');
    if (!btn) return;
    state.draft.wordbook = btn.dataset.book;
    renderBookOptions();
  });

  els.obLevels.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-level]');
    if (!btn) return;
    state.draft.level = btn.dataset.level;
    renderLevelOptions();
  });

  /* ---------- Tab / 首页 ---------- */
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const nav = btn.dataset.nav;
      if (nav === 'quiz') {
        startSession('normal');
        return;
      }
      if (nav === 'books') {
        state.booksTab = 'words';
        await renderBooks();
      }
      if (nav === 'me') await renderMe();
      if (nav === 'home') await refreshHome();
      showView(nav);
    });
  });

  $('btn-start').addEventListener('click', () => startSession('normal'));
  // ★ 右上角头像：打开账号下拉菜单（不再直接跳「我的」，菜单内有入口）
  $('btn-go-me').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAccountMenu();
  });

  /* ---------- 答题 ---------- */
  $('quiz-back').addEventListener('click', exitQuiz);
  $('quiz-options').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-key]');
    if (!btn) return;
    selectOption(btn.dataset.key);
  });

  // ★ 完形填空：记录每个下拉框的选择
  $('quiz-prompt').addEventListener('change', (e) => {
    const sel = e.target.closest('.cloze-select');
    if (!sel) return;
    state.clozeAnswers[Number(sel.dataset.blank)] = sel.value;
  });

  els.btnHint.addEventListener('click', () => {
    if (!state.question) return;
    const hint = state.question.explanation.hint || '';
    if (!hint) {
      els.btnHint.classList.add('hidden');
      return;
    }
    els.quizHint.textContent = `助记：${hint}`;
    els.quizHint.classList.remove('hidden');
    state.revealedHint = true;
    els.btnHint.classList.add('hidden');
  });

  els.btnSubmit.addEventListener('click', submitCurrentAnswer);
  els.btnNext.addEventListener('click', goNextQuestion);

  $('analysis-toggle').addEventListener('click', () => {
    const collapsed = els.analysisBody.classList.toggle('hidden');
    els.analysisChevron.textContent = collapsed ? '展开 ▼' : '收起 ▲';
  });

  /* ---------- 词书 ---------- */
  els.bookChips.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-book]');
    if (!btn) return;
    const user = Store.getUser() || {};
    if (user.wordbook === btn.dataset.book) return;
    Store.saveUser({ wordbook: btn.dataset.book });
    state.booksTab = 'words';
    state.wordPage = 1;        // ★ 切换词书：回到第 1 页
    state.wordSearch = '';     // ★ 切换词书：清空搜索
    if (els.wordSearch) els.wordSearch.value = '';
    await renderBooks();
    toast(`已切换到「${bookName(btn.dataset.book)}」`);
  });

  els.tabWords.addEventListener('click', () => {
    state.booksTab = 'words';
    renderBooks();
  });

  els.tabFav.addEventListener('click', () => {
    state.booksTab = 'fav';
    renderBooks();
  });

  els.tabWrong.addEventListener('click', () => {
    state.booksTab = 'wrong';
    renderBooks();
  });

  els.wordList.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-act]');
    if (btn) {
      const user = Store.getUser() || {};
      const bookId = user.wordbook || 'zk';
      const scrollY = window.scrollY;
      await MockAPI.markWord({ bookId, wordId: btn.dataset.id, status: btn.dataset.act });
      await renderBooks();
      window.scrollTo(0, scrollY);
      return;
    }
    // ★ 点单词卡片打开详情
    const card = e.target.closest('[data-open-word]');
    if (card) await openWordDetail(null, card.dataset.openWord);
  });

  // ★ 错题本 / 收藏夹：点卡片查看单词详情
  [els.wrongList, els.favList].forEach((list) => {
    if (!list) return;
    list.addEventListener('click', (e) => {
      const card = e.target.closest('[data-open-word]');
      if (!card) return;
      openWordDetail(card.dataset.openBook || null, card.dataset.openWord);
    });
  });

  // ★ 词库搜索：输入即过滤并回到第 1 页
  if (els.wordSearch) {
    els.wordSearch.addEventListener('input', () => {
      state.wordSearch = els.wordSearch.value;
      state.wordPage = 1;
      renderBooks();
    });
  }
  // ★ 词库分页：上一页 / 下一页（事件委托）
  if (els.wordPager) {
    els.wordPager.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      if (btn.dataset.page === 'prev') state.wordPage = Math.max(1, state.wordPage - 1);
      else if (btn.dataset.page === 'next') state.wordPage = Math.min(state.wordTotalPages || 1, state.wordPage + 1);
      renderBooks();
    });
  }

  els.btnPracticeWrong.addEventListener('click', async () => {
    const wrong = await MockAPI.getWrongItems();
    if (!wrong.length) {
      toast('错题本还是空的');
      return;
    }
    startSession('wrong', { wrongItems: wrong, total: wrong.length });
  });

  /* ---------- 设置 ---------- */
  $('btn-save-goal').addEventListener('click', async () => {
    let goal = parseInt(els.goalInput.value, 10);
    if (Number.isNaN(goal)) goal = 20;
    goal = Math.max(5, Math.min(100, goal));
    els.goalInput.value = goal;
    await MockAPI.updateSettings({ dailyGoal: goal });
    await refreshHome();
    toast(`每日目标已设为 ${goal} 个新词`);
  });

  $('btn-reset').addEventListener('click', async () => {
    if (!confirm('确定要清空所有作答记录、错题和掌握标记吗？此操作不可撤销。')) return;
    await MockAPI.resetProgress();
    await refreshHome();
    await renderMe();
    await renderBooks();
    toast('学习记录已重置');
  });

  /* ---------- 账号：欢迎页 / 登录页 / 退出 ---------- */
  // 欢迎页两个入口
  $('btn-guest').addEventListener('click', startGuest);
  $('btn-open-login').addEventListener('click', openLogin);
  // 游客态右上角常驻提示，点击可去登录
  els.guestHint.addEventListener('click', openLogin);
  $('login-back').addEventListener('click', () => showView('welcome'));

  // 手机号验证码登录（mock）
  els.btnSendCode.addEventListener('click', sendCode);
  els.btnPhoneLogin.addEventListener('click', doPhoneLogin);
  els.loginPhone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') els.loginCode.focus();
  });
  els.loginCode.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doPhoneLogin();
  });

  // 微信一键登录（mock，后续替换为 OAuth 回调）
  $('btn-wechat-login').addEventListener('click', doWechatLogin);

  // 退出登录弹窗：保留本地记录 / 清空本地记录
  $('btn-logout').addEventListener('click', openLogoutModal);
  $('logout-cancel').addEventListener('click', closeLogoutModal);
  $('logout-keep').addEventListener('click', () => doLogout('keep'));
  $('logout-clear').addEventListener('click', () => doLogout('clear'));
  els.logoutModal.addEventListener('click', (e) => {
    if (e.target === els.logoutModal) closeLogoutModal();
  });

  /* ---------- ★ 会员：卡片 / 弹窗 / 账号下拉 ---------- */
  els.btnOpenVip.addEventListener('click', openVipModal);
  els.btnOpenVipMe.addEventListener('click', openVipModal);
  els.vipClose.addEventListener('click', closeVipModal);
  els.vipModal.addEventListener('click', (e) => {
    if (e.target === els.vipModal) closeVipModal();
  });
  els.btnActivateVip.addEventListener('click', doActivateVip);

  // ★ 广告奖励：看广告领会员（mock 激励视频）
  els.btnAdReward.addEventListener('click', startAdReward);
  els.adClaim.addEventListener('click', claimAdReward);
  els.adClose.addEventListener('click', closeAdModal);
  els.adModal.addEventListener('click', (e) => {
    if (e.target === els.adModal) closeAdModal();
  });

  /* ---------- ★ 打卡 / 周报 / 单词详情 / 合规 / 导出 / 注销 ---------- */
  els.btnWeekly.addEventListener('click', showWeeklyReport);
  $('weekly-close').addEventListener('click', closeWeeklyModal);
  els.weeklyModal.addEventListener('click', (e) => {
    if (e.target === els.weeklyModal) closeWeeklyModal();
  });

  $('word-close').addEventListener('click', closeWordDetail);
  els.wordModal.addEventListener('click', (e) => {
    if (e.target === els.wordModal) closeWordDetail();
  });
  $('word-speak').addEventListener('click', () => {
    if (state.wordDetail) speakWord(state.wordDetail.word);
  });
  els.wordFav.addEventListener('click', async () => {
    const w = state.wordDetail;
    if (!w) return;
    const res = await MockAPI.toggleFavorite({ bookId: w.bookId, wordId: w.id });
    w.favorite = res.favorite;
    els.wordFav.textContent = res.favorite ? '★' : '☆';
    els.wordFav.classList.toggle('text-amber-500', res.favorite);
    els.wordFav.classList.toggle('text-ink', !res.favorite);
    toast(res.favorite ? '已收藏' : '已取消收藏');
    await renderBooks();
  });
  $('word-known').addEventListener('click', () => markFromWordDetail('known'));
  $('word-unknown').addEventListener('click', () => markFromWordDetail('unknown'));

  $('legal-close').addEventListener('click', closeLegal);
  els.legalModal.addEventListener('click', (e) => {
    if (e.target === els.legalModal) closeLegal();
  });

  els.btnExport.addEventListener('click', exportLearningData);
  els.btnPrivacy.addEventListener('click', () => openLegal('privacy'));
  els.btnTerms.addEventListener('click', () => openLegal('terms'));
  els.btnDeleteAccount.addEventListener('click', openDeleteModal);
  $('delete-cancel').addEventListener('click', closeDeleteModal);
  els.deleteConfirm.addEventListener('click', confirmDeleteAccount);
  els.deleteModal.addEventListener('click', (e) => {
    if (e.target === els.deleteModal) closeDeleteModal();
  });
  els.btnGoFavorites.addEventListener('click', async () => {
    state.booksTab = 'fav';
    await renderBooks();
    showView('books');
  });

  // 账号下拉菜单项
  els.menuGoMe.addEventListener('click', async () => {
    closeAccountMenu();
    await renderMe();
    showView('me');
  });
  els.menuLogin.addEventListener('click', () => {
    closeAccountMenu();
    openLogin();
  });
  els.menuLogout.addEventListener('click', () => {
    closeAccountMenu();
    openLogoutModal();
  });
  // 点击页面空白处收起下拉
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#account-menu') && !e.target.closest('#btn-go-me')) {
      closeAccountMenu();
    }
  });
}

/* ============================================================
 * 启动
 * ============================================================ */
async function init() {
  bindEvents();
  renderBookOptions();
  renderLevelOptions();

  // ★ 真实后端：先校验登录态并对账（mock 模式下直接跳过）
  await MockAPI.refreshRemoteState();

  const user = Store.getUser();

  // 已完成定级：直接回到首页（登录态持久化，刷新不丢）
  if (user && user.onboarded) {
    await enterApp('home');
    updateGuestHint();
    return;
  }

  // 已登录 / 游客但还没定级：接着上次的流程从「选词书」开始
  if (user && (user.loggedIn || user.guest)) {
    state.draft.username = user.username || '';
    els.obUsername.value = state.draft.username;
    showView('onboarding');
    goObStep(2);
    updateGuestHint();
    return;
  }

  // 首次访问：先展示欢迎页
  showView('welcome');
  updateGuestHint();
}

document.addEventListener('DOMContentLoaded', init);
