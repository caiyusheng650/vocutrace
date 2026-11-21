/* ============================================================
 * 广告适配层（国际广告联盟通用 + AppLixir 激励视频）
 * ------------------------------------------------------------
 * 服务端通过 GET /api/config 下发广告配置：
 *   { provider, scriptUrl, adUnitId, rewardDays, dailyLimit }
 *
 * 已内置支持：
 *   1) applixir：加载 AppLixir v6 SDK，adUnitId 即 API Key
 *      只有 status.type === 'complete' 才发放会员
 *   2) mock：本地倒计时，仅开发调试
 *   3) custom：任意联盟脚本，暴露以下任一全局方法即可
 *      - window.CishuoAds.showRewarded({ adUnitId, onReward, onError })
 *      - window.showRewardedAd(onReward, onError)
 * ============================================================ */

const Ads = (() => {
  const APPLIXIR_SDK = 'https://cdn.applixir.com/applixir.app.v6.1.0.js';
  const AD_SLOT_ID = 'ad-slot';

  const DEFAULT_CONFIG = {
    provider: 'mock',
    scriptUrl: '',
    adUnitId: '',
    rewardDays: 3,
    dailyLimit: 3,
    rewardSeconds: 5,
  };

  let config = { ...DEFAULT_CONFIG };
  let initPromise = null;
  let scriptPromise = null;
  let activeTimer = null;

  function loadScript(src) {
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = src;
      el.async = true;
      el.onload = () => resolve(true);
      el.onerror = () => {
        scriptPromise = null;
        reject(new Error('广告脚本加载失败，请检查广告位配置或网络'));
      };
      document.head.appendChild(el);
    });
    return scriptPromise;
  }

  async function init() {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      try {
        const fromServer = await MockAPI.getPublicConfig();
        config = { ...DEFAULT_CONFIG, ...(fromServer || {}) };
      } catch (err) {
        config = { ...DEFAULT_CONFIG };
      }
      config.provider = String(config.provider || 'mock').toLowerCase();
      console.info('[词溯广告] provider =', config.provider, '| adUnitId =', config.adUnitId || '(空)');

      if (config.provider === 'applixir' && !config.scriptUrl) {
        config.scriptUrl = APPLIXIR_SDK;
      }
      if (config.provider !== 'mock' && config.scriptUrl) {
        try {
          await loadScript(config.scriptUrl);
        } catch (err) {
          // 加载失败不回退 mock，避免用户阻断广告脚本后白领会员
          config.loadError = err.message;
        }
      }
      return config;
    })();
    return initPromise;
  }

  function stop() {
    if (activeTimer) {
      clearInterval(activeTimer);
      activeTimer = null;
    }
  }

  /* mock 广告：仅本地开发 / 未配置广告位时使用 */
  function playMock(onProgress, onReward) {
    let left = Number(config.rewardSeconds) || DEFAULT_CONFIG.rewardSeconds;
    if (onProgress) onProgress(left);
    stop();
    activeTimer = setInterval(() => {
      left -= 1;
      if (left > 0) {
        if (onProgress) onProgress(left);
        return;
      }
      stop();
      if (onProgress) onProgress(0);
      if (onReward) onReward();
    }, 1000);
  }

  /* AppLixir v6：initializeAndOpenPlayer + adStatusCallbackFn */
  function playAppLixir({ onReward, onError }) {
    if (typeof window.initializeAndOpenPlayer !== 'function') {
      if (onError) onError(new Error('广告 SDK 未加载成功，请检查网络后重试'));
      return;
    }

    let settled = false;
    const fail = (message) => {
      if (settled) return;
      settled = true;
      if (onError) onError(new Error(message));
    };

    window.initializeAndOpenPlayer({
      apiKey: config.adUnitId,
      injectionElementId: AD_SLOT_ID,
      adStatusCallbackFn: (status) => {
        const type = status && status.type;
        if (type === 'complete') {
          if (settled) return;
          settled = true;
          if (onReward) onReward();
          return;
        }
        if (type === 'skipped') fail('广告被跳过，看完才能领取会员');
        else if (type === 'manuallyEnded') fail('广告未看完，请重新观看');
        else if (type === 'consentDeclined') fail('需要同意广告隐私授权才能观看');
        else if (type === 'allAdsCompleted') fail('暂无可用广告，请稍后再试');
      },
      adErrorCallbackFn: (error) => {
        let message = '广告加载失败，请稍后再试';
        try {
          const detail = error.getError && error.getError();
          if (detail && detail.data) message = String(detail.data);
        } catch (err) {
          /* 保持默认提示 */
        }
        fail(message);
      },
    });
  }

  /* 播放激励广告：onReward 只在广告完成后触发 */
  async function play({ onProgress, onReward, onError } = {}) {
    await init();

    if (config.provider === 'mock') {
      playMock(onProgress, onReward);
      return;
    }

    if (config.provider === 'applixir') {
      if (config.loadError) {
        if (onError) onError(new Error(config.loadError));
        return;
      }
      playAppLixir({ onReward, onError });
      return;
    }

    const customHandler =
      (window.CishuoAds && typeof window.CishuoAds.showRewarded === 'function')
      || typeof window.showRewardedAd === 'function';

    if (!customHandler) {
      if (onError) onError(new Error('广告脚本未正确加载，请检查广告联盟配置'));
      return;
    }

    try {
      if (window.CishuoAds && typeof window.CishuoAds.showRewarded === 'function') {
        window.CishuoAds.showRewarded({
          adUnitId: config.adUnitId,
          onReward: () => onReward && onReward(),
          onError: (err) => onError && onError(err || new Error('广告未完成')),
        });
      } else {
        window.showRewardedAd(
          () => onReward && onReward(),
          (err) => onError && onError(err || new Error('广告未完成')),
        );
      }
    } catch (err) {
      if (onError) onError(err);
    }
  }

  return {
    init,
    play,
    stop,
    getConfig: () => ({ ...config }),
  };
})();
