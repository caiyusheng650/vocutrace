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

  /* ★ 硬编码广告配置：使用 B 站公开视频作为激励视频，前端直接播放。
   * 不依赖任何广告联盟 SDK，也不会出现联盟报错（如 [object Object]）。
   * 服务端 /api/config 只用于奖励天数与每日次数，不再覆盖播放源。 */
  const BILIBILI_VIDEO =
    'https://player.bilibili.com/player.html?isOutside=true'
    + '&aid=116933202545130&bvid=BV1syKE62E6A&cid=40026702878&p=1&autoplay=1';

  const DEFAULT_CONFIG = {
    provider: 'bilibili',
    scriptUrl: '',
    adUnitId: '',
    rewardDays: 3,
    dailyLimit: 3,
    rewardSeconds: 7,   // 只播放视频前 7 秒
    videoUrl: BILIBILI_VIDEO,
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
        // ★ 播放源固定为 B 站视频，服务端只影响奖励规则，不再切换 provider
        if (fromServer) {
          if (Number(fromServer.rewardDays) > 0) config.rewardDays = Number(fromServer.rewardDays);
          if (Number(fromServer.dailyLimit) > 0) config.dailyLimit = Number(fromServer.dailyLimit);
        }
      } catch (err) {
        /* 配置拉取失败不影响本地视频广告 */
      }
      config.provider = 'bilibili';
      console.info('[词溯广告] provider = bilibili | 时长 =', config.rewardSeconds, 's');

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

  /* 只清计时器：playMock 每次启动前调用，不能清掉刚插入的视频 */
  function clearTimer() {
    if (activeTimer) {
      clearInterval(activeTimer);
      activeTimer = null;
    }
  }

  function stop() {
    clearTimer();
    // 移除 B 站 iframe，关闭弹层或播放结束后立即停止视频与声音
    const slot = document.getElementById(AD_SLOT_ID);
    if (slot) {
      slot.innerHTML = '';
      slot.classList.add('hidden');
      slot.classList.remove('flex');
    }
  }

  /* mock 广告：仅本地开发 / 未配置广告位时使用 */
  function playMock(onProgress, onReward) {
    let left = Number(config.rewardSeconds) || DEFAULT_CONFIG.rewardSeconds;
    if (onProgress) onProgress(left);
    clearTimer();
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

  /* B 站视频广告：内嵌播放器，pointer-events 禁用保证无法点击/拖动/暂停。
   * 只计时前 7 秒，无论视频是否成功自动播放，到时都正常发放奖励，
   * 因此断网、B 站加载失败也不会卡死流程。 */
  function playBilibili(onProgress, onReward) {
    const slot = document.getElementById(AD_SLOT_ID);
    if (slot) {
      slot.classList.remove('hidden');
      slot.classList.add('flex');
      slot.innerHTML = '';
      const frame = document.createElement('iframe');
      frame.src = config.videoUrl;
      frame.setAttribute('scrolling', 'no');
      frame.setAttribute('frameborder', 'no');
      frame.setAttribute('framespacing', '0');
      frame.setAttribute('allowfullscreen', 'false');
      // 关键：iframe 不接收任何鼠标/触摸事件，B 站播放器内部按钮全部点不动
      frame.style.cssText = 'width:100%;height:100%;border:0;pointer-events:none;';
      slot.appendChild(frame);
    }
    playMock(onProgress, onReward);
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

    if (config.provider === 'bilibili') {
      playBilibili(onProgress, onReward);
      return;
    }

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
