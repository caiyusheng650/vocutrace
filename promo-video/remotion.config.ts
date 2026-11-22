import {Config} from '@remotion/cli/config';

// 使用本机 Chrome 渲染（避免联网下载 chrome-headless-shell）
Config.setBrowserExecutable('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setAudioBitrate('192k');
