/* ============================================================
 * 【Mock 接口层】—— 后续对接真实后端，只需要改这个文件
 * ------------------------------------------------------------
 * 1) fetchNextQuestion()  : 获取下一题（现在随机出题）
 *    替换方式：把函数体改成
 *      return fetch('/api/quiz/next', { method:'POST', body: JSON.stringify(params) })
 *        .then(res => res.json());
 *
 * 2) submitAnswer()       : 提交作答记录（参数固定，方便对接 KT 模型）
 *    参数：questionId、userChoice、isCorrect、durationMs、wrongChoice
 *    替换方式：改成 POST /api/quiz/answer
 *
 * 其余函数（登录、统计、单词本等）同样带 ★ 注释，按需替换。
 * ============================================================ */

const MockAPI = (() => {
  const LATENCY_MIN = 150;
  const LATENCY_MAX = 380;

  function delay(min = LATENCY_MIN, max = LATENCY_MAX) {
    return new Promise((resolve) => setTimeout(resolve, Math.random() * (max - min) + min));
  }

  function shuffle(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  /* ============================================================
   * ★ 真实后端接入（server/ 里的零依赖 Node 服务）
   * ------------------------------------------------------------
   * 后端地址解析优先级：
   *   1) 页面地址带 ?api=http://host:port（会写入 localStorage，只用作一次）
   *   2) localStorage 'cishuo:api-base'
   *   3) 本地开发（localhost / 127.0.0.1）默认 http://127.0.0.1:8787
   *   4) 其余（线上静态站）为空 → 自动使用下面的 MockAPI，离线可用
   * 未配置后端时所有接口行为与之前完全一致。
   * ============================================================ */
  const TOKEN_KEY = 'cishuo:token';
  const API_BASE_KEY = 'cishuo:api-base';
  const QUOTA_CACHE_KEY = 'cishuo:ad-quota';
  const DEFAULT_LOCAL_BASE = 'http://127.0.0.1:8787';

  function normalizeBase(value) {
    return String(value || '').trim().replace(/\/+$/, '');
  }

  function resolveApiBase() {
    let base = '';
    let forcedMock = false;
    try {
      const params = new URLSearchParams(location.search);
      const fromQuery = params.get('api');
      if (fromQuery !== null) {
        const v = normalizeBase(fromQuery);
        if (!v || v === 'mock' || v === 'off') {
          localStorage.removeItem(API_BASE_KEY);
          forcedMock = true;
        } else {
          localStorage.setItem(API_BASE_KEY, v);
        }
      }
      base = normalizeBase(localStorage.getItem(API_BASE_KEY));
    } catch (err) {
      base = '';
    }
    // ★ APK / 原生壳：由 js/app-env.js 注入后端地址（?api=mock 可强制本地模式）
    if (!forcedMock && !base) {
      try {
        const injected = normalizeBase(window.CISHUO_API_BASE);
        if (injected) base = injected;
      } catch (err) {
        /* 忽略 */
      }
    }
    if (base) return base;
    // ★ Capacitor 原生壳里的 localhost 是 WebView 自身，不是开发服务器。
    //   未注入后端地址时直接走本地存储，避免误请求 127.0.0.1:8787 报连接失败。
    try {
      const cap = window.Capacitor;
      if (cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform()) {
        return '';
      }
    } catch (err) {
      /* 忽略 */
    }
    try {
      const host = location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') return DEFAULT_LOCAL_BASE;
    } catch (err) {
      /* file:// 等无 location.hostname 的场景保持 mock */
    }
    return '';
  }

  let API_BASE = resolveApiBase();
  const USE_REMOTE = !!API_BASE;

  /* 是否为本机地址（用于识别失效的临时 ?api= 端口） */
  function isLocalBase(base) {
    try {
      const host = new URL(base).hostname;
      return host === 'localhost' || host === '127.0.0.1';
    } catch (err) {
      return false;
    }
  }

  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || '';
    } catch (err) {
      return '';
    }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (err) {
      /* 存储不可用时忽略 */
    }
  }

  function readQuotaCache() {
    try {
      return JSON.parse(localStorage.getItem(QUOTA_CACHE_KEY) || 'null');
    } catch (err) {
      return null;
    }
  }

  function saveQuotaCache(quota) {
    if (!quota) return;
    try {
      localStorage.setItem(QUOTA_CACHE_KEY, JSON.stringify(quota));
    } catch (err) {
      /* 存储不可用时忽略 */
    }
  }

  function clearQuotaCache() {
    try {
      localStorage.removeItem(QUOTA_CACHE_KEY);
    } catch (err) {
      /* 存储不可用时忽略 */
    }
  }

  /* 统一请求封装：自动带 Bearer token，401 自动清 token，网络错误不抛出 */
  async function apiFetch(path, options = {}) {
    const { method = 'GET', body = null, auth = true } = options;
    const headers = {};
    if (body !== null) headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (auth && token) headers.Authorization = `Bearer ${token}`;

    async function request(base) {
      const res = await fetch(`${base}${path}`, {
        method,
        headers,
        body: body !== null ? JSON.stringify(body) : undefined,
      });
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = { ok: false, error: '服务端返回格式异常' };
      }
      if (res.status === 401 && auth) setToken(null);
      return { ...data, status: res.status, ok: !!data.ok };
    }

    try {
      return await request(API_BASE);
    } catch (err) {
      // 之前用 ?api= 指到过的本机端口已失效时，自动回退到默认 8787
      if (API_BASE !== DEFAULT_LOCAL_BASE && isLocalBase(API_BASE)) {
        API_BASE = DEFAULT_LOCAL_BASE;
        try { localStorage.setItem(API_BASE_KEY, DEFAULT_LOCAL_BASE); } catch (e) { /* ignore */ }
        try {
          return await request(API_BASE);
        } catch (e) {
          /* 继续走统一错误提示 */
        }
      }
      return { ok: false, status: 0, error: '无法连接后端，请确认 server 已启动（http://127.0.0.1:8787）' };
    }
  }

  /* 服务端 bootstrap → 本地缓存（records 服务端是旧→新，本地要求新→旧） */
  function applyBootstrap(data) {
    if (!data || !data.ok) return null;
    const records = Array.isArray(data.records) ? data.records.slice().reverse() : [];
    Store.replaceRecords(records);
    if (data.progress) Store.replaceProgress(data.progress);
    if (data.user) {
      Store.saveUser({
        ...data.user,
        guest: false,
        loggedIn: true,
        vip: !!data.vip,
        vipExpireTime: data.expireAt || null,
      });
    }
    return Store.getUser();
  }

  /* ★ KC 知识维度定义（会员版使用，免费版忽略）
   * kc1 释义识别 / kc2 搭配运用 / kc3 听音·拼写
   * 题型与 KC 的对应关系集中在此，后续对接后端保持一致即可。
   * ★ 题型：img2word/word2img（图片，暂时下线）→ kc1；def2word/word2def（英文释义匹配）→ kc1；cloze（短句完形）→ kc2
   */
  const KC_BY_TYPE = {
    en2zh: 'kc1',
    zh2en: 'kc2',
    spell: 'kc3',
    img2word: 'kc1',
    word2img: 'kc1',
    def2word: 'kc1', // 看英文释义，选单词
    word2def: 'kc1', // 看单词，选英文释义
    cloze: 'kc2',
  };
  const KC_META = {
    kc1: { label: '释义识别' },
    kc2: { label: '搭配运用' },
    kc3: { label: '听音/拼写' },
  };
  const KC_LIST = ['kc1', 'kc2', 'kc3'];

  /* 题型难度（0~1，供会员收益打分的 difficulty_gap 使用） */
  const DIFFICULTY_BY_TYPE = {
    img2word: 0.2,
    word2img: 0.25,
    def2word: 0.4,
    word2def: 0.45,
    en2zh: 0.45,
    zh2en: 0.5,
    spell: 0.55,
    cloze: 0.6,
  };

  /* ★ 按单词可用的题型。
   *   - 图片题（img2word / word2img）暂时下线：配图数据集还没就绪，
   *     现在的 picsum 占位图和词义无关，会出垃圾题。拿到真图后把
   *     这两个 type 加回下面的数组即可恢复，其余代码不用动。
   *   - 没有完形句子的词不出现 cloze。
   */
  function typesForWord(wordId) {
    const types = ['en2zh', 'zh2en']; // TODO(配图就绪): 加回 'img2word', 'word2img'
    const w = findWord(wordId);
    if (w && w.definition) types.push('def2word', 'word2def'); // 有英文释义才出释义匹配题
    if (CLOZE[wordId]) types.push('cloze');
    return types;
  }

  function pickTypeForWord(wordId) {
    return pick(typesForWord(wordId));
  }

  /* 从词池中取若干个不重复的干扰项 */
  function sampleDistinct(pool, count, field, excludeValue) {
    const seen = new Set([excludeValue]);
    const result = [];
    for (const item of shuffle(pool)) {
      if (seen.has(item[field])) continue;
      seen.add(item[field]);
      result.push(item);
      if (result.length === count) break;
    }
    return result;
  }

  /* ============================================================
   * ★ 易混：零成本自动生成（不改词库数据，也不调外部服务）
   *   同词书中首/尾字母相同、拼写最接近的形近词，最多 3 个。
   *   词库里有手写 confusables 时优先用词库内容。
   * ============================================================ */

  /* 词义取第一段中文，去掉词性前缀，最长 12 字 */
  function shortMeaning(meaning) {
    const first = String(meaning || '').split(/[；;]/)[0].trim();
    const cn = first.replace(/^[a-z]+\.\s*/i, '');
    return cn.length > 12 ? `${cn.slice(0, 12)}…` : cn;
  }

  /* 形近易混词：同词书内拼写最接近的词（首字母或尾字母相同） */
  const CONFUSABLE_BUCKETS = {};
  const CONFUSABLE_CACHE = {};

  function editDistance(a, b, limit) {
    if (Math.abs(a.length - b.length) > limit) return limit + 1;
    let prev = [];
    for (let j = 0; j <= b.length; j += 1) prev[j] = j;
    for (let i = 1; i <= a.length; i += 1) {
      const cur = [i];
      let rowMin = i;
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
        if (cur[j] < rowMin) rowMin = cur[j];
      }
      if (rowMin > limit) return limit + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  function buildBuckets(bookId) {
    const head = new Map();
    const tail = new Map();
    const add = (map, key, w) => {
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(w);
    };
    getBookWords(bookId).forEach((w) => {
      const low = String(w.word || '').toLowerCase();
      if (low.length < 3) return;
      add(head, low[0], w);
      add(tail, low[low.length - 1], w);
    });
    return { head, tail };
  }

  function confusablesFor(bookId, word) {
    const low = String(word.word || '').toLowerCase();
    if (!CONFUSABLE_BUCKETS[bookId]) CONFUSABLE_BUCKETS[bookId] = buildBuckets(bookId);

    const cacheKey = `${bookId}|${word.id}`;
    if (CONFUSABLE_CACHE[cacheKey]) return CONFUSABLE_CACHE[cacheKey];

    const { head, tail } = CONFUSABLE_BUCKETS[bookId];
    const seen = new Map();
    [...(head.get(low[0]) || []), ...(tail.get(low[low.length - 1]) || [])]
      .forEach((w) => seen.set(w.id, w));

    const limit = low.length <= 4 ? 1 : (low.length <= 6 ? 2 : 3);
    const hits = [];
    seen.forEach((o) => {
      if (o.id === word.id) return;
      const other = String(o.word || '').toLowerCase();
      if (other === low) return;
      const d = editDistance(low, other, limit);
      if (d <= limit) hits.push({ w: o, d });
    });
    hits.sort((x, y) => x.d - y.d || x.w.word.length - y.w.word.length);
    const result = hits.slice(0, 3).map((h) => `${h.w.word}（${shortMeaning(h.w.meaning)}）`);
    CONFUSABLE_CACHE[cacheKey] = result;
    return result;
  }

  /* 解析区统一解释块：助记用词库手写内容，易混缺失时自动生成 */
  function explanationFor(bookId, word) {
    const hint = word.hint || '';
    const confusables = (word.confusables && word.confusables.length)
      ? word.confusables
      : confusablesFor(bookId, word);
    return { meaning: word.meaning, hint, confusables };
  }

  /* ============================================================
   * ★ 题型 1：原有单项选择题（保留原逻辑，仅补充统一字段）
   * ============================================================ */
  function buildChoiceQuestion(bookId, word, type) {
    const pool = getBookWords(bookId);
    const keys = ['A', 'B', 'C', 'D'];
    let texts;
    let answerText;

    if (type === 'zh2en') {
      answerText = word.word;
      texts = [word.word, ...sampleDistinct(pool, 3, 'word', word.word).map((w) => w.word)];
    } else {
      answerText = word.meaning;
      texts = [word.meaning, ...sampleDistinct(pool, 3, 'meaning', word.meaning).map((w) => w.meaning)];
    }

    const options = shuffle(texts).map((text, i) => ({ key: keys[i], text }));
    const answerKey = options.find((o) => o.text === answerText).key;

    return {
      questionId: `${bookId}|${word.id}|${type}`, // 稳定 id，方便后端对账
      wordbook: bookId,
      wordId: word.id,
      word: word.word,
      phonetic: word.phonetic,
      type,
      typeLabel: type === 'zh2en'
        ? '看中文，选英文'
        : (type === 'spell' ? '听音/拼写 · 选释义' : '看英文，选中文'),
      kc: KC_BY_TYPE[type] || 'kc1', // 每道题绑定的 KC 标签
      difficulty: DIFFICULTY_BY_TYPE[type] || 0.45,
      answer: answerText, // ★ 统一答案字段
      prompt: type === 'zh2en' ? word.meaning : word.word,
      hint: word.hint,
      imageUrl: word.imageUrl || null,
      options,
      answerKey,
      answerText,
      explanation: explanationFor(bookId, word),
    };
  }

  /* ============================================================
   * ★ 新增题型 2：图片匹配题（难度低）
   *   img2word：展示图片，选择对应英文单词
   *   word2img：展示单词，选择匹配图片
   * 判分仍用 answerKey，选项点击 / 上报完全复用单选逻辑。
   * ============================================================ */
  function buildImageQuestion(bookId, word, type) {
    const pool = getBookWords(bookId);
    const keys = ['A', 'B', 'C', 'D'];
    const others = sampleDistinct(pool, 3, 'id', word.id);
    const entries = shuffle([word, ...others]);

    const options = entries.map((w, i) => ({
      key: keys[i],
      text: w.word,
      imageUrl: w.imageUrl,
    }));
    const answerKey = options.find((o) => o.text === word.word).key;

    return {
      questionId: `${bookId}|${word.id}|${type}`,
      wordbook: bookId,
      wordId: word.id,
      word: word.word,
      phonetic: word.phonetic,
      type,
      typeLabel: type === 'img2word' ? '看图，选英文单词' : '看单词，选对应图片',
      kc: KC_BY_TYPE[type],
      difficulty: DIFFICULTY_BY_TYPE[type],
      answer: word.word,
      prompt: type === 'img2word' ? '看图，选出对应的英文单词' : word.word,
      imageUrl: word.imageUrl,
      hint: word.hint,
      options,
      answerKey,
      answerText: word.word,
      explanation: explanationFor(bookId, word),
    };
  }

  /* ============================================================
   * ★ 新增题型 4：英文释义匹配题
   *   def2word：展示英文释义，选择对应单词（看义认词）
   *   word2def：展示单词，选择对应的英文释义（看词辨义）
   * 数据来源：data.js 的 definition 字段（来自 ECDICT，已清洗）。
   * 没有 definition 的词不出这两类题（见 typesForWord）。
   * 判分仍用 answerKey，完全复用单选逻辑。
   * ============================================================ */
  function buildDefQuestion(bookId, word, type) {
    const pool = getBookWords(bookId).filter((w) => w.definition);
    const keys = ['A', 'B', 'C', 'D'];
    const others = sampleDistinct(pool, 3, 'id', word.id);
    const entries = shuffle([word, ...others]);
    const answerIdx = entries.indexOf(word);

    let prompt;
    let answerText;
    let optField;
    if (type === 'def2word') {
      prompt = word.definition;
      answerText = word.word;
      optField = 'word';
    } else {
      prompt = word.word;
      answerText = word.definition;
      optField = 'definition';
    }

    const options = entries.map((w, i) => ({
      key: keys[i],
      text: w[optField],
      imageUrl: null,
    }));

    return {
      questionId: `${bookId}|${word.id}|${type}`,
      wordbook: bookId,
      wordId: word.id,
      word: word.word,
      phonetic: word.phonetic,
      type,
      typeLabel: type === 'def2word' ? '看英文释义，选单词' : '看单词，选英文释义',
      kc: KC_BY_TYPE[type],
      difficulty: DIFFICULTY_BY_TYPE[type],
      answer: answerText,
      prompt,
      imageUrl: null,
      hint: word.hint,
      options,
      answerKey: keys[answerIdx],
      answerText,
      explanation: explanationFor(bookId, word),
    };
  }

  /* ============================================================
   * ★ 新增题型 3：短句完形填空（轻量，1~2 空）
   *   题干用 {{blank}} 标记空位，每个空一个下拉选词；
   *   全部空答对才算本题正确，KC 固定绑定 kc2【搭配运用】。
   * ============================================================ */
  function buildClozeQuestion(bookId, word) {
    const entry = CLOZE[word.id];
    if (!entry) return null;

    const pool = getBookWords(bookId);
    const keys = ['A', 'B', 'C', 'D'];
    const blanks = entry.answers.map((ans, i) => {
      const distractors = sampleDistinct(pool, 3, 'word', ans).map((w) => w.word);
      const texts = shuffle([ans, ...distractors]);
      return {
        index: i,
        answer: ans,
        options: texts.map((t, j) => ({ key: keys[j], text: t })),
      };
    });

    let k = 0;
    const sentenceFilled = entry.text.replace(/\{\{blank\}\}/g, () => entry.answers[k++] || '');

    return {
      questionId: `${bookId}|${word.id}|cloze`,
      wordbook: bookId,
      wordId: word.id,
      word: word.word,
      phonetic: word.phonetic,
      type: 'cloze',
      typeLabel: '短句完形 · 选词填空',
      kc: 'kc2',
      difficulty: DIFFICULTY_BY_TYPE.cloze,
      answer: entry.answers, // 多空时是数组
      prompt: entry.text,
      hint: word.hint,
      imageUrl: null,
      blanks,
      options: [],
      answerKey: null,
      answerText: entry.answers.join(' / '),
      sentenceFilled,
      explanation: {
        ...explanationFor(bookId, word),
        sentence: sentenceFilled,
      },
    };
  }

  /* 题型统一分发：原有调用方仍传 type，内部按题型分支 */
  function buildQuestion(bookId, word, type) {
    if (type === 'img2word' || type === 'word2img') {
      return buildImageQuestion(bookId, word, type);
    }
    if (type === 'def2word' || type === 'word2def') {
      return buildDefQuestion(bookId, word, type);
    }
    if (type === 'cloze') {
      return buildClozeQuestion(bookId, word) || buildChoiceQuestion(bookId, word, 'en2zh');
    }
    return buildChoiceQuestion(bookId, word, type);
  }

  /* ============================================================
   * ★ 核心接口 1：获取下一题
   * 参数：
   *   wordbook       当前词书 id
   *   mode           normal | placement | wrong
   *   excludeWordIds 本轮已出过的单词（避免连续重复）
   *   wrongItems     错题模式下的错题列表 [{ bookId, wordId }]
   * ============================================================ */
  async function fetchNextQuestion({
    wordbook,
    mode = 'normal',
    excludeWordIds = [],
    wrongItems = [],
  } = {}) {
    await delay(); // 模拟网络延迟，替换为真实 fetch 时删掉

    // —— 错题模式：从错题清单中抽一题（★ 支持全部题型）——
    if (mode === 'wrong' && wrongItems.length) {
      const item = pick(wrongItems);
      const word = findWord(item.wordId);
      if (word) {
        return buildQuestion(word.bookId, word, pickTypeForWord(word.id));
      }
    }

    // ★ 会员：走 KC 收益打分推荐（与免费逻辑完全隔离，不影响免费出题）
    const recUser = Store.getUser();
    if (mode === 'normal' && isVipActive(recUser)) {
      const vipQ = pickNextVipQuestion(wordbook, excludeWordIds);
      if (vipQ) return vipQ;
    }

    // ★ 免费：先取 SM2 到期词复习；没有到期词再走下面的随机出题
    if (mode === 'normal') {
      const dueWord = pickDueSM2Word(wordbook, excludeWordIds);
      if (dueWord) {
        return buildQuestion(wordbook, dueWord, pickTypeForWord(dueWord.id));
      }
    }

    // —— 普通 / 定级模式：从当前词书随机抽一道（原有 mock 推荐逻辑，保留不动）——
    const pool = getBookWords(wordbook);
    if (!pool.length) return null;

    let candidates = pool.filter((w) => !excludeWordIds.includes(w.id));
    if (!candidates.length) candidates = pool; // 抽完了就重新开始

    const word = pick(candidates);
    return buildQuestion(wordbook, word, pickTypeForWord(word.id));
  }

  /* ============================================================
   * ★ 核心接口 2：提交作答记录
   * 参数固定（后续直接对接 KT 知识追踪模型）：
   *   questionId  题目 id
   *   userChoice  用户选择的选项文本
   *   isCorrect   是否正确
   *   durationMs  作答耗时（毫秒）
   *   wrongChoice 选错的选项（答对时为 null）
   * ============================================================ */
  async function submitAnswer({ questionId, userChoice, isCorrect, durationMs, wrongChoice }) {
    await delay(60, 140); // 模拟上报延迟

    // mock 后端：写入 localStorage，相当于服务端落库
    const record = {
      questionId,
      userChoice,
      isCorrect,
      durationMs,
      wrongChoice: isCorrect ? null : wrongChoice,
      ts: Date.now(),
    };
    Store.addRecord(record);
    Store.markCheckin(record.ts); // ★ 每日首次作答自动打卡

    // ★ 真实后端：单条记录即时上报（失败不影响本地做题）
    if (USE_REMOTE && getToken()) {
      apiFetch('/api/user/records', { method: 'POST', body: { record } });
    }

    // ★ 新增：按会员身份更新对应推荐状态（入参不变，仅追加副作用）
    const [bookId, wordId, type] = String(questionId).split('|');
    const kc = KC_BY_TYPE[type] || 'kc1';
    const answerUser = Store.getUser() || {};
    if (isVipActive(answerUser)) {
      // 会员：单独更新该题对应 KC 的掌握度（0~1）
      const prev = Store.getKCMasteryValue(bookId, wordId, kc);
      Store.setKCMastery(bookId, wordId, kc, isCorrect ? Math.min(1, prev + 0.15) : Math.max(0, prev - 0.2));
    } else {
      // 免费：只更新单词整体的 SM2 间隔状态，不拆 KC
      Store.setSM2(bookId, wordId, calcSM2({ bookId, wordId, sm2: Store.getWordSM2(bookId, wordId) }, isCorrect));
    }
    updateFatigue(); // 更新当日疲劳值（影响会员难题权重）

    return { ok: true, questionId, receivedAt: Date.now() };
  }

  /* ============================================================
   * ★ 登录（只用用户名，本地模拟）
   * ============================================================ */
  async function login({ username }) {
    await delay(100, 200);
    const user = Store.saveUser({
      username,
      onboarded: false,
      createdAt: Date.now(),
    });
    return { ok: true, user };
  }

  async function completeOnboarding({ wordbook, level }) {
    await delay(100, 200);
    const user = Store.saveUser({ wordbook, level, onboarded: true });
    // ★ 真实后端：定级结果同步到账号（失败不阻塞进入首页）
    if (USE_REMOTE && getToken()) {
      apiFetch('/api/user/profile', { method: 'POST', body: { wordbook, level, onboarded: true } });
    }
    return { ok: true, user };
  }

  /* ============================================================
   * ★ 首页今日任务
   * ============================================================ */
  async function getHomeSummary() {
    const user = Store.getUser();
    const settings = Store.getSettings();
    const stats = Store.getStats();
    const bookWords = getBookWords(user ? user.wordbook : 'zk');

    return {
      username: user ? user.username : '',
      wordbook: user ? user.wordbook : 'zk',
      newTarget: settings.dailyGoal,
      answeredToday: stats.todayTotal,
      reviewCount: Store.getWrongItems().length,
      mastered: stats.mastered,
      totalWords: bookWords.length,
      todayAccuracy: stats.todayAccuracy,
    };
  }

  /* ============================================================
   * ★ 单词本数据
   * ============================================================ */
  async function getWordList(bookId) {
    const mastery = Store.getMastery();
    return getBookWords(bookId).map((w) => ({
      ...w,
      status: mastery[Store.masteryKey(bookId, w.id)] || null,
    }));
  }

  async function markWord({ bookId, wordId, status }) {
    await delay(60, 120);
    Store.setMastery(bookId, wordId, status);
    return { ok: true };
  }

  /* ============================================================
   * ★ 数据统计 / 错题 / 设置 / 重置
   * ============================================================ */
  async function getStats() {
    return Store.getStats();
  }

  async function getWrongItems() {
    return Store.getWrongItems();
  }

  async function updateSettings({ dailyGoal }) {
    await delay(60, 120);
    return { ok: true, settings: Store.saveSettings({ dailyGoal }) };
  }

  async function resetProgress() {
    await delay(100, 200);
    Store.resetProgress();
    return { ok: true };
  }

  async function logout() {
    await delay(60, 100);
    setToken(null);
    clearQuotaCache();
    Store.logout();
    return { ok: true };
  }

  /* ★ 只清登录态（保留本机学习数据），供「退出并保留记录」使用 */
  async function logoutSession() {
    setToken(null);
    clearQuotaCache();
    return { ok: true };
  }

  /* ============================================================
   * ★ 新增：账号体系（当前全部为 mock 实现）
   * ------------------------------------------------------------
   * 与做题接口保持同一风格：async + 固定入参 + 返回 { ok, ... }。
   * 后续对接真实后端时只替换函数体为 fetch 请求，页面调用方无需改动。
   * ============================================================ */

  const ACCOUNT_DB_KEY = 'cishuo:accounts';  // mock 账号库（真实环境应存在服务端）

  /* ============================================================
   * ★ 会员时间判断模块（mock）
   * ------------------------------------------------------------
   * 规则：
   *  - 游客：不赠送会员；
   *  - 邮箱注册：不赠送会员，会员只能通过看广告领取；
   *  - 判断标准：当前时间 < vipExpireTime 才算会员，到期自动回落到免费 SM2。
   * 真实后端：vip / vipExpireTime 应由服务端返回，前端只读不写。
   * ============================================================ */
  /* ★ 广告奖励：每次看广告领 3 天会员，每日最多 3 次（防刷） */
  const VIP_AD_REWARD_DAYS = 3;
  const VIP_AD_DAILY_LIMIT = 3;

  function addDays(ts, days) {
    return ts + days * 86400000;
  }

  /* 统一的会员有效性判断（兼容早期 vip:true 且无到期时间的老 mock 数据）
   * ★ 会员绑定登录账号：游客（loggedIn=false 或 guest=true）一律不算会员。 */
  function isVipActive(user) {
    if (!user || !user.loggedIn || user.guest) return false;
    if (!user.vip) return false;
    if (!user.vipExpireTime) return true;
    return user.vipExpireTime > Date.now();
  }

  function readAccounts() {
    try {
      return JSON.parse(localStorage.getItem(ACCOUNT_DB_KEY) || '{}') || {};
    } catch (err) {
      return {};
    }
  }

  function writeAccounts(accounts) {
    try {
      localStorage.setItem(ACCOUNT_DB_KEY, JSON.stringify(accounts));
    } catch (err) {
      /* 存储不可用时忽略，mock 环境不影响主流程 */
    }
  }

  /* 公开配置：广告平台 / 广告位（未接后端时返回 mock 配置） */
  async function getPublicConfig() {
    if (USE_REMOTE) {
      const res = await apiFetch('/api/config', { auth: false });
      if (res.ok && res.ad) return res.ad;
    }
    return {
      provider: 'mock',
      scriptUrl: '',
      adUnitId: '',
      rewardDays: VIP_AD_REWARD_DAYS,
      dailyLimit: VIP_AD_DAILY_LIMIT,
    };
  }

  /* ★ 发送邮箱验证码：真实后端模式下由服务端发信，未配置后端时直接通过 */
  async function requestEmailCode(email) {
    if (USE_REMOTE) {
      const res = await apiFetch('/api/auth/email-code', {
        method: 'POST',
        body: { email },
        auth: false,
      });
      if (!res.ok) return { ok: false, error: res.error || '验证码发送失败' };
      // 未配置 SMTP 时服务端会回传验证码，方便本地调试
      return { ok: true, devCode: res.code || null };
    }
    await delay(60, 120);
    return { ok: true };
  }

  /* 邮箱验证码登录：新邮箱自动注册，老账号直接登录
   * 真实后端：POST /api/auth/login-by-email { email, code } → { token, user }
   */
  async function loginByEmail(email, code) {
    await delay(200, 400);

    const address = String(email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return { ok: false, error: '请输入正确的邮箱地址' };
    // ★ mock 验证码：任意 6 位数字都算通过（真实后端应校验邮件验证码）
    if (!/^\d{6}$/.test(code)) return { ok: false, error: '请输入 6 位验证码' };

    // ★ 真实后端：邮箱登录（不发会员，会员只通过广告领取）
    if (USE_REMOTE) {
      const res = await apiFetch('/api/auth/login-by-email', {
        method: 'POST',
        body: { email: address, code },
        auth: false,
      });
      if (!res.ok) return { ok: false, error: res.error || '登录失败' };
      setToken(res.token);
      const user = Store.saveUser({ ...res.user, guest: false, loggedIn: true });
      return {
        ok: true,
        isNew: !!res.isNew,
        user,
        vip: !!res.vip,
        vipExpireTime: res.vipExpireTime || null,
      };
    }

    const accounts = readAccounts();
    const existing = accounts[address];
    const isNew = !existing;
    const account = existing || {
      email: address,
      createdAt: Date.now(),
      vipExpireTime: null,
    };
    accounts[address] = account;
    writeAccounts(accounts);

    const vip = isVipActive({ vip: true, loggedIn: true, guest: false, vipExpireTime: account.vipExpireTime });

    const user = Store.saveUser({
      username: account.nickname || address.split('@')[0].slice(0, 12) || '同学',
      email: address,
      guest: false,
      loggedIn: true,
      authMode: 'email',
      vip,
      vipExpireTime: account.vipExpireTime || null,
    });

    return { ok: true, isNew, user, vip, vipExpireTime: account.vipExpireTime || null };
  }

  /* 游客升级：把本机已有做题记录 / 掌握标记 / 定级结果同步到账号下
   * localData = { records, mastery, placement }
   * 真实后端：POST /api/user/sync-records，服务端按 questionId + ts 去重合并
   */
  async function syncLocalRecordToUser(localData) {
    await delay(200, 400);

    const records = (localData && localData.records) || [];
    const mastery = (localData && localData.mastery) || {};
    const placement = (localData && localData.placement) || null;

    // ★ 真实后端：上报本机数据 → 拉回账号全量数据覆盖本地
    if (USE_REMOTE) {
      if (!getToken()) return { ok: false, error: '请先登录' };
      const res = await apiFetch('/api/user/sync-records', {
        method: 'POST',
        body: {
          records,
          mastery,
          sm2: (localData && localData.sm2) || {},
          kcMastery: (localData && localData.kcMastery) || {},
          placement,
        },
      });
      if (!res.ok) return { ok: false, error: res.error || '同步失败' };
      const boot = await apiFetch('/api/user/bootstrap');
      if (boot.ok) applyBootstrap(boot);
      return {
        ok: true,
        syncedRecords: res.syncedRecords || 0,
        syncedMastery: res.syncedMastery || 0,
      };
    }

    // mock：localStorage 同时扮演本地与「云端」，这里做一次去重合并
    const seen = new Set(Store.getRecords().map((r) => `${r.questionId}|${r.ts}`));
    records.forEach((rec) => {
      const key = `${rec.questionId}|${rec.ts}`;
      if (seen.has(key)) return;
      seen.add(key);
      Store.addRecord(rec);
    });

    Object.keys(mastery).forEach((key) => {
      const parts = key.split(':');
      if (!parts[0] || !parts[1]) return;
      Store.setMastery(parts[0], parts[1], mastery[key]);
    });

    if (placement && placement.wordbook) {
      Store.saveUser({
        wordbook: placement.wordbook,
        level: placement.level || null,
        onboarded: !!placement.onboarded,
      });
    }

    // ★ 同步 KC / SM2 学习数据到账号下（游客升级不丢进度）
    //   注意：游客本身不赠送会员，因此这里不再上传 vip 标记。
    Object.keys((localData && localData.kcMastery) || {}).forEach((key) => {
      const parts = key.split(':');
      if (parts.length === 3) Store.setKCMastery(parts[0], parts[1], parts[2], localData.kcMastery[key]);
    });
    Object.keys((localData && localData.sm2) || {}).forEach((key) => {
      const parts = key.split(':');
      if (parts.length === 2) Store.setSM2(parts[0], parts[1], localData.sm2[key]);
    });

    return {
      ok: true,
      // 上报条数按「本机已有数据」计（mock 中本机同时扮演云端，写入前已去重，不影响结果）
      syncedRecords: records.length,
      syncedMastery: Object.keys(mastery).length,
    };
  }

  /* ============================================================
   * ★ 新增：会员权限 + 两套推荐逻辑（全部 mock，后续可替换后端）
   * ------------------------------------------------------------
   * 免费版：calcSM2 —— 只追踪单词整体掌握，按间隔复习，不拆 KC、不打分。
   * 会员版：calcKCAndScore —— 每题绑定 KC，按 KC 掌握度 + 遗忘/疲劳/难度差算收益分。
   * 后端对接建议：getUserVipStatus 换成 fetch；
   *   calcSM2 / calcKCAndScore / updateFatigue 是纯计算，可整体搬到服务端，
   *   前端只拿「排序后的下一题」，避免评分逻辑被篡改。
   * ============================================================ */

  /* 汇总用户状态，供会员打分使用（mock：从本地 Store 读取） */
  function buildUserState(wordbook) {
    const user = Store.getUser() || {};
    const records = Store.getRecords();
    const todayStart = Store.startOfToday();
    const todayRecords = records.filter((r) => r.ts >= todayStart);

    // 从最近一条记录往前数「连续答错」的题数
    let wrongStreak = 0;
    for (const r of records) {
      if (r.isCorrect) break;
      wrongStreak += 1;
    }

    const levelValue = user.level === 'advanced' ? 1 : (user.level === 'zero' ? 0 : 0.5);

    return {
      user,
      wordbook: wordbook || (user.wordbook || 'zk'),
      records,
      todayCount: todayRecords.length,
      wrongStreak,
      fatigue: Store.getFatigue(),
      levelValue,
    };
  }

  /* 单词遗忘概率：距上次答对越久越高（7 天半衰），从未答对给 0.5 */
  function calcForgetProb(bookId, wordId, records) {
    let lastCorrectTs = null;
    for (const r of records) {
      const [b, w] = String(r.questionId || '').split('|');
      if (b === bookId && w === wordId && r.isCorrect) {
        lastCorrectTs = r.ts;
        break;
      }
    }
    if (!lastCorrectTs) return 0.5;
    const days = (Date.now() - lastCorrectTs) / 86400000;
    return Math.max(0, Math.min(1, 1 - Math.exp(-days / 7)));
  }

  /* 单词难度（mock：词书基准 + 在词书中的位置） */
  function wordDifficulty(bookId, wordId) {
    const words = getBookWords(bookId);
    const idx = words.findIndex((w) => w.id === wordId);
    const base = bookId === 'zk' ? 0.2 : (bookId === 'cet4' ? 0.5 : 0.8);
    const frac = idx < 0 ? 0.5 : idx / Math.max(1, words.length);
    return Math.max(0, Math.min(1, base + (frac - 0.5) * 0.3));
  }

  /* ---------- 免费版：SM2 单词级间隔复习 ---------- */
  function calcSM2(wordItem, isCorrect) {
    const s = (wordItem && wordItem.sm2) || { interval: 0, reps: 0, ef: 2.5, dueAt: 0, lastTs: 0 };
    let interval = s.interval;
    let reps = s.reps;
    let ef = s.ef;
    const DAY = 86400000;

    if (isCorrect) {
      reps += 1;
      ef = Math.max(1.3, ef - 0.02); // 简化版 SM2：答对略降 EF
      if (reps === 1) interval = 1;
      else if (reps === 2) interval = 6;
      else interval = Math.max(1, Math.round(interval * ef));
    } else {
      reps = 0;
      interval = 1;
      ef = Math.max(1.3, ef - 0.2);
    }
    return { interval, reps, ef, dueAt: Date.now() + interval * DAY, lastTs: Date.now() };
  }

  /* 取出当前词书里已到复习期的单词（免费版） */
  function pickDueSM2Word(wordbook, excludeWordIds) {
    const now = Date.now();
    const sm2 = Store.getSM2();
    const due = getBookWords(wordbook).filter((w) => {
      if (excludeWordIds.includes(w.id)) return false;
      const s = sm2[`${wordbook}:${w.id}`];
      return s && s.dueAt && s.dueAt <= now;
    });
    return due.length ? pick(due) : null;
  }

  /* ---------- 会员版：KC 掌握度更新 + 收益分排序 ---------- */
  function calcKCAndScore(candidateQuestions, userState) {
    const W = { w1: 0.4, w2: 0.4, w3: 0.1, w4: 0.1 }; // 权重，可调
    const fatigue = (userState && userState.fatigue) || { value: 0 };
    const records = (userState && userState.records) || [];

    const scored = candidateQuestions.map((q) => {
      const [bookId, wordId] = String(q.questionId).split('|');
      const kc = q.kc || KC_BY_TYPE[q.type] || 'kc1';
      const masteryKc = Store.getKCMasteryValue(bookId, wordId, kc);
      const pForget = calcForgetProb(bookId, wordId, records);
      const diffGap = Math.abs(wordDifficulty(bookId, wordId) - (userState.levelValue || 0.5));

      // 收益分 = 遗忘驱动 + KC 薄弱驱动 - 疲劳惩罚 - 难度偏离惩罚
      let score = W.w1 * pForget
                + W.w2 * (1 - masteryKc)
                - W.w3 * fatigue.value
                - W.w4 * diffGap;

      // 疲劳度逻辑：连续答错 3 题 或 当日做题 > 20 题，再压低难题权重
      if (userState.wrongStreak >= 3 || userState.todayCount > 20) {
        score -= W.w4 * diffGap * 0.5;
      }

      return { question: q, score, pForget, masteryKc, fatigue: fatigue.value, diffGap };
    });

    scored.sort((a, b) => b.score - a.score); // 按收益降序
    return scored;
  }

  /* 会员选题：为每个候选词生成一题，打分后取收益最高的一道 */
  function pickNextVipQuestion(wordbook, excludeWordIds) {
    const pool = getBookWords(wordbook);
    if (!pool.length) return null;

    // ★ 三种题型都可能进入候选池（按单词可用题型取一道）
    const candidateQuestions = pool.map((word) => buildQuestion(wordbook, word, pickTypeForWord(word.id)));
    const scored = calcKCAndScore(candidateQuestions, buildUserState(wordbook));
    if (!scored.length) return null;

    const chosen = scored.find((x) => !excludeWordIds.includes(x.question.wordId)) || scored[0];
    return chosen.question;
  }

  /* ---------- 会员状态接口（mock） ---------- */
  async function getUserVipStatus() {
    await delay(60, 120);

    // ★ 真实后端：GET /api/user/vip（以服务端时间与账号为准）
    if (USE_REMOTE) {
      if (!getToken()) {
        Store.saveUser({ guest: true, loggedIn: false, vip: false, vipExpireTime: null });
        return { ok: false, status: 401, vip: false, expireAt: null, expired: false, user: Store.getUser() };
      }
      const res = await apiFetch('/api/user/vip');
      if (res.status === 401) {
        Store.saveUser({ guest: true, loggedIn: false, vip: false, vipExpireTime: null });
        return { ok: false, status: 401, vip: false, expireAt: null, expired: false, user: Store.getUser() };
      }
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          vip: false,
          expireAt: null,
          expired: false,
          user: Store.getUser(),
          error: res.error || '获取会员状态失败',
        };
      }
      const user = Store.saveUser({
        ...res.user,
        guest: false,
        loggedIn: true,
        vip: !!res.vip,
        vipExpireTime: res.expireAt || null,
      });
      return {
        ok: true,
        status: res.status,
        vip: !!res.vip,
        expireAt: res.expireAt || null,
        expired: !!res.expired,
        user,
      };
    }

    // 真实后端：GET /api/user/vip → { vip, expireAt }（以服务端时间为准）
    const user = Store.getUser() || {};
    const active = isVipActive(user);
    const expireAt = user.vipExpireTime || null;

    // ★ 到期自动降级：清理本地会员标记，推荐逻辑自动回落到免费 SM2
    if (user.vip && !active) {
      Store.saveUser({ vip: false });
    }

    return { ok: true, vip: active, expireAt, expired: !!expireAt && expireAt <= Date.now(), user };
  }

  /* ============================================================
   * ★ 广告奖励模块 —— 会员唯一获取方式（看国际广告换会员天数）
   * ------------------------------------------------------------
   * 职责拆分（方便后续接真实广告 SDK）：
   *   前端 app.js：负责「展示广告 + 倒计时」，播放完成后调用本模块发放。
   *   本模块 extendVipByAdReward()：校验每日上限 → 顺延会员到期时间 → 记录次数。
   *
   * 真实对接（国际广告联盟 / 广告适配层，见 js/ads.js）：
   *   1) 前端把 mock 倒计时换成广告脚本的激励回调；
   *   2) 在 onReward 回调里调用 extendVipByAdReward；
   *   3) 后端应校验广告回调凭证（adCallbackToken）后再发放，避免被刷。
   * 防刷：每日领取次数上限 VIP_AD_DAILY_LIMIT（真实环境应以服务端计数为准）。
   * ============================================================ */
  const AD_REWARD_KEY = 'cishuo:ad-reward'; // mock：本机记录每日领取次数

  function adRewardDateKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function readAdRewardLog() {
    try {
      return JSON.parse(localStorage.getItem(AD_REWARD_KEY) || '{}') || {};
    } catch (err) {
      return {};
    }
  }

  function writeAdRewardLog(log) {
    try {
      localStorage.setItem(AD_REWARD_KEY, JSON.stringify(log));
    } catch (err) {
      /* 存储不可用时忽略，mock 环境不阻断主流程 */
    }
  }

  /* 查询今日广告奖励配额（供前端展示「今日剩余 N 次」）
   * 真实后端：配额由服务端计数，refreshRemoteState() 会拉到本机缓存，这里只读缓存 */
  function getAdRewardQuota() {
    if (USE_REMOTE) {
      const cached = readQuotaCache() || {};
      const limit = Number(cached.limit) || VIP_AD_DAILY_LIMIT;
      const used = Number(cached.used) || 0;
      return {
        today: adRewardDateKey(),
        used,
        limit,
        remaining: typeof cached.remaining === 'number' ? cached.remaining : Math.max(0, limit - used),
        rewardDays: Number(cached.rewardDays) || VIP_AD_REWARD_DAYS,
      };
    }
    const log = readAdRewardLog();
    const today = adRewardDateKey();
    const used = Number(log[today]) || 0;
    return {
      today,
      used,
      limit: VIP_AD_DAILY_LIMIT,
      remaining: Math.max(0, VIP_AD_DAILY_LIMIT - used),
      rewardDays: VIP_AD_REWARD_DAYS,
    };
  }

  /* ★ 核心：广告播放完成后发放会员天数（带每日上限校验）
   * 真实后端：POST /api/vip/reward-by-ad { adCallbackToken } → 校验凭证后下发 vipExpireTime
   */
  async function extendVipByAdReward() {
    await delay(120, 240);

    // ★ 真实后端：每日次数由服务端计数，前端只负责播放广告
    if (USE_REMOTE) {
      const current = Store.getUser() || {};
      if (!current.loggedIn || current.guest || !getToken()) {
        return { ok: false, reason: '请先登录后再领取会员', quota: getAdRewardQuota() };
      }
      const res = await apiFetch('/api/vip/reward-by-ad', { method: 'POST', body: {} });
      if (res.quota) saveQuotaCache(res.quota);
      if (!res.ok) {
        return {
          ok: false,
          reason: res.reason || res.error || '领取失败，请稍后再试',
          quota: res.quota || getAdRewardQuota(),
        };
      }
      const user = Store.saveUser({
        ...res.user,
        guest: false,
        loggedIn: true,
        vip: true,
        vipExpireTime: res.vipExpireTime || null,
      });
      return {
        ok: true,
        vip: true,
        vipExpireTime: res.vipExpireTime || null,
        days: res.days || VIP_AD_REWARD_DAYS,
        quota: getAdRewardQuota(),
        user,
      };
    }

    // ★ 会员绑定登录账号：游客不能领取会员奖励
    const current = Store.getUser() || {};
    if (!current.loggedIn || current.guest) {
      return { ok: false, reason: '请先登录后再领取会员', quota: getAdRewardQuota() };
    }

    const quota = getAdRewardQuota();
    if (quota.remaining <= 0) {
      return { ok: false, reason: '今天的广告奖励已领完，明天再来吧', quota };
    }

    // 会员在有效期内 → 从到期时间顺延；已过期/免费 → 从当前时间开始算
    const user = Store.getUser() || {};
    const base = isVipActive(user) && user.vipExpireTime ? user.vipExpireTime : Date.now();
    const vipExpireTime = addDays(base, VIP_AD_REWARD_DAYS);
    Store.saveUser({ vip: true, vipExpireTime, vipLastRewardAt: Date.now() });

    // 记录今日已领次数（mock 本地计数；真实环境应由服务端计数防刷）
    const log = readAdRewardLog();
    log[quota.today] = quota.used + 1;
    writeAdRewardLog(log);

    return {
      ok: true,
      vip: true,
      vipExpireTime,
      days: VIP_AD_REWARD_DAYS,
      quota: getAdRewardQuota(),
    };
  }

  /* ============================================================
   * ★ 真实后端：启动时对账（校验登录态 → 上报本机进度 → 拉广告配额）
   * ------------------------------------------------------------
   * 只在「配置了后端 + 本机有 token」时执行；mock 模式直接跳过。
   * 跨设备恢复：bootstrap 会把服务端的定级 / 进度 / 记录覆盖到本地。
   * ============================================================ */
  async function refreshRemoteState() {
    if (!USE_REMOTE) return { ok: false, skipped: 'mock' };
    if (!getToken()) return { ok: false, skipped: 'no-token' };

    const vipRes = await getUserVipStatus();
    if (vipRes.status === 401) return { ok: false, skipped: 'unauthorized' };

    const user = Store.getUser() || {};
    const local = {
      records: Store.getRecords(),
      mastery: Store.getMastery(),
      sm2: Store.getSM2(),
      kcMastery: Store.getKCMastery(),
      placement: {
        wordbook: user.wordbook || null,
        level: user.level || null,
        onboarded: !!user.onboarded,
      },
    };

    const syncRes = await syncLocalRecordToUser(local);
    const quotaRes = await apiFetch('/api/vip/ad-quota');
    if (quotaRes.ok && quotaRes.quota) saveQuotaCache(quotaRes.quota);

    return {
      ok: !!syncRes.ok,
      vip: vipRes.vip,
      expireAt: vipRes.expireAt,
      syncedRecords: syncRes.syncedRecords || 0,
      quota: quotaRes.quota || getAdRewardQuota(),
      error: syncRes.error,
    };
  }

  /* 更新当日疲劳值（做题数 + 连续错题），mock 本地计算 */
  async function updateFatigue() {
    const st = buildUserState();
    const fromCount = Math.min(1, st.todayCount / 20);
    const fromStreak = Math.min(1, st.wrongStreak / 3);
    const value = Math.max(0, Math.min(1, fromCount * 0.6 + fromStreak * 0.4));
    Store.saveFatigue({ date: st.fatigue.date, todayCount: st.todayCount, wrongStreak: st.wrongStreak, value });
    return { ok: true, value, todayCount: st.todayCount, wrongStreak: st.wrongStreak };
  }

  /* KC 维度掌握汇总，供统计页雷达图展示（会员） */
  async function getKCSummary() {
    const mastery = Store.getKCMastery();
    const agg = { kc1: { sum: 0, n: 0 }, kc2: { sum: 0, n: 0 }, kc3: { sum: 0, n: 0 } };
    Object.keys(mastery).forEach((key) => {
      const parts = key.split(':');
      const kc = parts[2];
      if (!agg[kc]) return;
      agg[kc].sum += mastery[key];
      agg[kc].n += 1;
    });
    const items = KC_LIST.map((kc) => ({
      kc,
      label: KC_META[kc].label,
      mastery: agg[kc].n ? agg[kc].sum / agg[kc].n : 0,
      count: agg[kc].n,
    }));
    return { ok: true, items };
  }

  /* ============================================================
   * ★ 新增：单词详情 / 收藏 / 打卡周报 / 数据导出 / 注销账号
   * ============================================================ */

  /* 单词详情：释义、英文释义、助记、易混 + 当前标记与收藏状态 */
  async function getWordDetail(bookId, wordId) {
    await delay(40, 90);
    const word = findWord(wordId);
    if (!word) return null;
    const bid = word.bookId || bookId;
    return {
      ...word,
      bookId: bid,
      status: Store.getMastery()[Store.masteryKey(bid, wordId)] || null,
      favorite: Store.isFavorite(bid, wordId),
      sm2: Store.getWordSM2(bid, wordId),
    };
  }

  async function toggleFavorite({ bookId, wordId }) {
    await delay(40, 90);
    return { ok: true, favorite: Store.toggleFavorite(bookId, wordId) };
  }

  async function getFavorites() {
    const map = Store.getFavorites();
    return Object.keys(map)
      .map((key) => {
        const [bookId, wordId] = key.split(':');
        const w = findWord(wordId);
        if (!w) return null;
        return {
          bookId,
          wordId,
          word: w.word,
          phonetic: w.phonetic,
          meaning: w.meaning,
          ts: map[key],
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.ts - a.ts);
  }

  /* 近 7 天学习周报：按自然日汇总做题量 / 正确率，附打卡连续天数 */
  async function getWeeklyReport() {
    const records = Store.getRecords();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const week = ['日', '一', '二', '三', '四', '五', '六'];
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const from = start.getTime() - i * 86400000;
      const to = from + 86400000;
      const list = records.filter((r) => r.ts >= from && r.ts < to);
      const correct = list.filter((r) => r.isCorrect).length;
      const d = new Date(from);
      days.push({
        date: Store.dateKey(from),
        label: week[d.getDay()],
        total: list.length,
        correct,
        accuracy: list.length ? Math.round((correct / list.length) * 100) : 0,
      });
    }
    const total = days.reduce((sum, d) => sum + d.total, 0);
    const correct = days.reduce((sum, d) => sum + d.correct, 0);
    const activeDays = days.filter((d) => d.total > 0).length;
    return {
      ok: true,
      days,
      total,
      correct,
      activeDays,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      ...Store.getCheckinSummary(),
    };
  }

  /* 导出学习数据（JSON 文本由前端下载，不经过服务端） */
  async function exportData() {
    return Store.exportAll();
  }

  /* 注销账号：服务端删除用户数据，前端清空登录态与本机数据 */
  async function deleteAccount() {
    if (USE_REMOTE && getToken()) {
      const res = await apiFetch('/api/user', { method: 'DELETE' });
      if (!res.ok && res.status !== 401) {
        return { ok: false, error: res.error || '注销失败，请稍后再试' };
      }
    }
    setToken(null);
    clearQuotaCache();
    try {
      localStorage.removeItem(ACCOUNT_DB_KEY);
      localStorage.removeItem(AD_REWARD_KEY);
    } catch (err) {
      /* 存储不可用时忽略 */
    }
    Store.logout();
    return { ok: true };
  }

  return {
    fetchNextQuestion,
    submitAnswer,
    login,
    completeOnboarding,
    getHomeSummary,
    getWordList,
    markWord,
    getStats,
    getWrongItems,
    updateSettings,
    resetProgress,
    logout,
    /* ★ 新增账号接口 */
    requestEmailCode,
    loginByEmail,
    getPublicConfig,
    syncLocalRecordToUser,
    /* ★ 真实后端：登录态清理与启动对账 */
    logoutSession,
    refreshRemoteState,
    isRemote: () => USE_REMOTE,
    /* ★ 会员接口与推荐算法 */
    getUserVipStatus,
    /* ★ 广告奖励接口（mock，后续替换为真实广告 SDK 回调 + 服务端发放） */
    getAdRewardQuota,
    extendVipByAdReward,
    calcSM2,
    calcKCAndScore,
    updateFatigue,
    getKCSummary,
    /* ★ 新增：单词详情 / 收藏 / 打卡周报 / 导出 / 注销 */
    getWordDetail,
    toggleFavorite,
    getFavorites,
    getWeeklyReport,
    exportData,
    deleteAccount,
  };
})();
