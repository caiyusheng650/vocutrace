/* ============================================================
 * 本地数据仓库（模拟后端的数据库）
 * 使用 localStorage 持久化，刷新页面不丢失
 * Key: cishuo:v1
 * ============================================================ */

const Store = (() => {
  const KEY = 'cishuo:v1';

  function emptyDB() {
    return {
      user: null,               // { username, wordbook, level, onboarded, createdAt, vip, ... }
      settings: { dailyGoal: 20 },
      records: [],              // 作答记录（最新在前）
      mastery: {},              // 单词级掌握 { 'zk:zk_01': 'known' | 'unknown' }（原有，不动）
      sm2: {},                  // ★ 新增：免费版单词级 SM2 状态 { 'zk:zk_01': {interval,reps,ef,dueAt,lastTs} }
      kcMastery: {},            // ★ 新增：会员版 KC 掌握度 { 'zk:zk_01:kc1': 0~1 }
      fatigue: {},              // ★ 新增：当日疲劳度 { '2026-11-21': {todayCount,wrongStreak,value} }
      checkins: {},             // ★ 新增：每日打卡 { '2026-11-21': { ts, count } }
      favorites: {},            // ★ 新增：单词收藏 { 'zk:zk_01': ts }
    };
  }

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return emptyDB();
      const db = JSON.parse(raw);
      const base = emptyDB();
      return {
        user: db.user || null,
        settings: { ...base.settings, ...(db.settings || {}) },
        records: Array.isArray(db.records) ? db.records : [],
        mastery: db.mastery && typeof db.mastery === 'object' ? db.mastery : {},
        // ★ 新增字段：老数据缺省时给空对象，保证向后兼容
        sm2: db.sm2 && typeof db.sm2 === 'object' ? db.sm2 : {},
        kcMastery: db.kcMastery && typeof db.kcMastery === 'object' ? db.kcMastery : {},
        fatigue: db.fatigue && typeof db.fatigue === 'object' ? db.fatigue : {},
        checkins: db.checkins && typeof db.checkins === 'object' ? db.checkins : {},
        favorites: db.favorites && typeof db.favorites === 'object' ? db.favorites : {},
      };
    } catch (e) {
      return emptyDB();
    }
  }

  function write(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  /* ---------------- 用户 ---------------- */
  function getUser() {
    return read().user;
  }

  function saveUser(patch) {
    const db = read();
    db.user = { ...(db.user || {}), ...patch };
    write(db);
    return db.user;
  }

  /* ---------------- 设置 ---------------- */
  function getSettings() {
    return read().settings;
  }

  function saveSettings(patch) {
    const db = read();
    db.settings = { ...db.settings, ...patch };
    write(db);
    return db.settings;
  }

  /* ---------------- 作答记录 ---------------- */
  function addRecord(record) {
    const db = read();
    db.records.unshift(record);
    // 防止本地存储无限膨胀
    if (db.records.length > 2000) db.records.length = 2000;
    write(db);
    return record;
  }

  function getRecords() {
    return read().records;
  }

  function startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  /* ---------------- 单词掌握状态 ---------------- */
  function masteryKey(bookId, wordId) {
    return `${bookId}:${wordId}`;
  }

  function getMastery() {
    return read().mastery;
  }

  function setMastery(bookId, wordId, status) {
    const db = read();
    db.mastery[masteryKey(bookId, wordId)] = status;
    write(db);
  }

  /* ============================================================
   * ★ 新增：会员体系相关持久化（SM2 / KC / 疲劳度）
   * 原有 mastery 字段保持不动；这里是独立的新表。
   * 真实后端：这些数据应跟随账号存服务端，游客态才落本地。
   * ============================================================ */
  function sm2Key(bookId, wordId) {
    return `${bookId}:${wordId}`;
  }

  function getSM2() {
    return read().sm2;
  }

  function getWordSM2(bookId, wordId) {
    return read().sm2[sm2Key(bookId, wordId)] || null;
  }

  function setSM2(bookId, wordId, sm2) {
    const db = read();
    db.sm2 = db.sm2 || {};
    db.sm2[sm2Key(bookId, wordId)] = sm2;
    write(db);
    return sm2;
  }

  function kcKey(bookId, wordId, kc) {
    return `${bookId}:${wordId}:${kc}`;
  }

  function getKCMastery() {
    return read().kcMastery;
  }

  function getKCMasteryValue(bookId, wordId, kc) {
    const v = read().kcMastery[kcKey(bookId, wordId, kc)];
    return typeof v === 'number' ? v : 0.5; // 默认中等掌握
  }

  function setKCMastery(bookId, wordId, kc, value) {
    const db = read();
    db.kcMastery = db.kcMastery || {};
    const clamped = Math.max(0, Math.min(1, value));
    db.kcMastery[kcKey(bookId, wordId, kc)] = clamped;
    write(db);
    return clamped;
  }

  /* 疲劳度按自然日存储，跨天自动重置 */
  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function getFatigue() {
    const db = read();
    const key = todayKey();
    const f = (db.fatigue || {})[key];
    return f ? { ...f, date: key } : { date: key, todayCount: 0, wrongStreak: 0, value: 0 };
  }

  function saveFatigue(fatigue) {
    const db = read();
    db.fatigue = db.fatigue || {};
    db.fatigue[fatigue.date] = fatigue;
    write(db);
    return fatigue;
  }

  /* ============================================================
   * ★ 每日打卡 & 单词收藏
   * ============================================================ */
  function dateKey(ts) {
    const d = new Date(ts || Date.now());
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function getCheckins() {
    return read().checkins;
  }

  /* 每天首次做题自动打卡；重复做题只累加当日题数 */
  function markCheckin(ts) {
    const db = read();
    const date = dateKey(ts);
    db.checkins = db.checkins || {};
    const isNew = !db.checkins[date];
    if (isNew) db.checkins[date] = { ts: Date.now(), count: 0 };
    db.checkins[date].count = (db.checkins[date].count || 0) + 1;
    write(db);
    return { date, isNew, ...checkinSummary(db.checkins) };
  }

  function checkinSummary(checkins) {
    const map = checkins || read().checkins;
    const today = dateKey();
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    if (!map[today]) cursor.setTime(cursor.getTime() - 86400000);
    let streak = 0;
    while (map[dateKey(cursor.getTime())]) {
      streak += 1;
      cursor.setTime(cursor.getTime() - 86400000);
    }
    return {
      date: today,
      checkedToday: !!map[today],
      todayCount: map[today] ? map[today].count || 0 : 0,
      streak,
      totalDays: Object.keys(map).length,
    };
  }

  function getCheckinSummary() {
    return checkinSummary();
  }

  function favoriteKey(bookId, wordId) {
    return `${bookId}:${wordId}`;
  }

  function getFavorites() {
    return read().favorites;
  }

  function isFavorite(bookId, wordId) {
    return !!read().favorites[favoriteKey(bookId, wordId)];
  }

  function toggleFavorite(bookId, wordId) {
    const db = read();
    db.favorites = db.favorites || {};
    const key = favoriteKey(bookId, wordId);
    const active = !db.favorites[key];
    if (active) db.favorites[key] = Date.now();
    else delete db.favorites[key];
    write(db);
    return active;
  }

  /* ---------------- 错题清单 ----------------
   * 规则：同一个单词只保留最新一次判断。
   * 最新一次答错 → 进入错题清单；之后答对 → 自动移出。
   */
  function getWrongItems() {
    const db = read();
    const seen = new Set();
    const wrong = [];
    for (const rec of db.records) {
      const [bookId, wordId] = String(rec.questionId || '').split('|');
      const key = masteryKey(bookId, wordId);
      if (!wordId || seen.has(key)) continue;
      seen.add(key);
      if (!rec.isCorrect) {
        const w = findWord(wordId);
        if (!w) continue;
        wrong.push({
          bookId,
          wordId,
          word: w.word,
          phonetic: w.phonetic,
          meaning: w.meaning,
          wrongChoice: rec.wrongChoice,
          ts: rec.ts,
          times: db.records.filter((r) => {
            const [b, id] = String(r.questionId || '').split('|');
            return b === bookId && id === wordId && !r.isCorrect;
          }).length,
        });
      }
    }
    return wrong;
  }

  /* ---------------- 统计 ---------------- */
  function getStats() {
    const db = read();
    const total = db.records.length;
    const correct = db.records.filter((r) => r.isCorrect).length;
    const todayRecords = db.records.filter((r) => r.ts >= startOfToday());
    const todayCorrect = todayRecords.filter((r) => r.isCorrect).length;
    const mastered = Object.values(db.mastery).filter((v) => v === 'known').length;
    return {
      total,
      correct,
      wrong: getWrongItems().length,
      mastered,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
      todayTotal: todayRecords.length,
      todayAccuracy: todayRecords.length ? Math.round((todayCorrect / todayRecords.length) * 100) : 0,
    };
  }

  /* ---------------- 重置 / 退出 ---------------- */
  function resetProgress() {
    const db = read();
    db.records = [];
    db.mastery = {};
    // ★ 新增：重置时一并清空 SM2 / KC / 疲劳度（会员身份不清）
    db.sm2 = {};
    db.kcMastery = {};
    db.fatigue = {};
    db.checkins = {};
    write(db);
  }

  function logout() {
    localStorage.removeItem(KEY);
  }

  /* 导出整库数据（账号 + 学习记录 + 打卡 + 收藏），用于「数据导出」 */
  function exportAll() {
    const db = read();
    return {
      app: '词溯',
      version: 1,
      exportedAt: new Date().toISOString(),
      user: db.user,
      settings: db.settings,
      stats: getStats(),
      records: db.records,
      mastery: db.mastery,
      sm2: db.sm2,
      kcMastery: db.kcMastery,
      checkins: db.checkins,
      favorites: db.favorites,
    };
  }

  /* ★ 真实后端：登录 / 启动时把服务端数据整体覆盖到本地
   * （records 由调用方按「最新在前」顺序传入） */
  function replaceRecords(records) {
    const db = read();
    db.records = Array.isArray(records) ? records.slice(0, 2000) : [];
    write(db);
  }

  function replaceProgress(progress) {
    const db = read();
    if (progress && progress.mastery) db.mastery = progress.mastery;
    if (progress && progress.sm2) db.sm2 = progress.sm2;
    if (progress && progress.kcMastery) db.kcMastery = progress.kcMastery;
    write(db);
  }

  return {
    getUser,
    saveUser,
    getSettings,
    saveSettings,
    addRecord,
    getRecords,
    getMastery,
    setMastery,
    masteryKey,
    getWrongItems,
    getStats,
    resetProgress,
    logout,
    startOfToday,
    /* ★ 新增会员体系读写（mock） */
    getSM2,
    getWordSM2,
    setSM2,
    sm2Key,
    getKCMastery,
    getKCMasteryValue,
    setKCMastery,
    kcKey,
    getFatigue,
    saveFatigue,
    /* ★ 每日打卡 & 单词收藏 */
    dateKey,
    getCheckins,
    markCheckin,
    getCheckinSummary,
    getFavorites,
    isFavorite,
    toggleFavorite,
    favoriteKey,
    exportAll,
    /* ★ 真实后端：服务端数据落本地 */
    replaceRecords,
    replaceProgress,
  };
})();
