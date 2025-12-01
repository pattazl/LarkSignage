// 媒体资源数据 - 只需提供URL，自动通过后缀判断类型
let mediaDataOri = []; // 动态载入
let currentTopic; // 当前主体节点信息
let strCurrentTopic; // 当前节点的字符串
let globalConfig = {}
let pathI  // 当前页面序号

// 有效媒体资源列表
let validMedia = [];
// 当前播放索引
let currentIndex = 0;
// 轮播状态
let isPlaying = true;
// 轮播计时器
let carouselTimer = null;
// 图片默认展示时长(ms)
let IMAGE_DURATION = 5000;
// 时间戳，用于防止缓存
let timestamp = ''
let mediaData = []
// DOM元素
const mediaContainer = document.getElementById('mediaContainer');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const refreshBtn = document.getElementById('refreshBtn');
const refreshImg = document.getElementById('refreshImg');
const indicators = document.getElementById('indicators');
const controlPanel = document.getElementById('controlPanel');
const resolutionDisplay = document.getElementById('resolutionDisplay');
const langSwitcher = document.getElementById('langSwitcher');
const allControls = [controlPanel, indicators, resolutionDisplay, langSwitcher];

// 初始化
async function init() {
  // 载入配置文件
  globalConfig = await loadJSON();
  if ((globalConfig.lang ?? '') == '') {
    return
  }
  // 初始化语言
  initLang(globalConfig.lang)
  pathI = parseInt(getUrlParam('i'))
  if (isNaN(pathI) || globalConfig.content[pathI] == null) {
    console.log('未获取有效页面参数')
    return;
  }
  currentTopic = globalConfig.content[pathI];
  // 获取除版本以外其他参数
  let {version,...copy} = currentTopic
  strCurrentTopic = JSON.stringify(copy)
  // 更新轮播间隔
  IMAGE_DURATION = currentTopic.duration *1000;
  // 获取文件列表
  if (currentTopic.resList.length > 0) {
    mediaDataOri = currentTopic.resList
  } else {
    currentTopic.resRange.forEach(x => {
      const regex = /^(\d+)-(\d+)(\.\w+)$/;
      const matches = x.match(regex);

      if (matches) {
        const part1 = parseInt(matches[1]); // "1"
        const part2 = parseInt(matches[2]); // "6"
        const extension = matches[3]; // ".jpg"
        if (isNaN(part1) || isNaN(part2) || part1 > part2) {
          return
        }
        // 生成列表
        for (let i = part1; i <= part2; i++) {
          let fileName = `${i}${extension}`
          // 长度一样，可用 0 补齐
          if (matches[1].length == matches[2].length) {
            fileName = `${String(i).padStart(matches[2].length, '0')}${extension}`
          }
          mediaDataOri.push(fileName)
        }
      }
    })
  }
  // 本地时间戳
  timestamp = localStorage.getItem('timestamp') ?? '';
  if (timestamp == '') {
    timestamp = newTimestamp()
  }
  showVer()
  // 通过 path和 时间戳，形成正式url 
  let path = currentTopic.path ?? currentTopic.topic;
  mediaData = mediaDataOri.map(x => {
    x = `${path}/${x}?${timestamp}`
    return x;
  })
  // 启动定时器
  setInterval(checkUpdate, currentTopic.detectSec * 1000)
  // console.log(currentTopic.detectSec * 1000)
  // 初始化分辨率显示
  updateResolution();
  // 验证所有媒体资源有效性并自动识别类型
  await validateAndClassifyMedia();
  // 检查是否有有效资源
  if (validMedia.length === 0) {
    showErrorMessage(globalLang[globalConfig.lang]['noResFound']);
    return;
  }
  // 加载有效媒体
  loadMediaItems();
  createIndicators();
  setupEventListeners();
  // 开始播放
  startPlayback();
}
function showVer(ver = currentTopic.version){
  document.getElementById('topicName').innerText = currentTopic.topic + ' v' + ver
}
function updateResolution() {
  // 获取屏幕实际显示分辨率（含缩放适配）
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  // 格式化显示（例：1920×1080）
  resolutionValue.textContent = `${screenWidth}×${screenHeight}`;
}
// 验证媒体资源并自动分类（通过URL后缀）
async function validateAndClassifyMedia() {
  for (const media of mediaData) {
    // 自动判断类型：.mp4后缀视为视频，其他视为图片
    const isVideo = media.toLowerCase().endsWith('.mp4');
    const type = isVideo ? 'video' : 'image';

    // 验证资源有效性
    const isValid = await (type === 'image'
      ? validateImage(media)
      : validateVideo(media)
    );

    if (isValid) {
      validMedia.push({
        url: media,
        type: type
      });
    }
  }
}

// 验证图片有效性
function validateImage(url) {
  return new Promise(resolve => {
    const img = new Image();
    const timeout = setTimeout(() => resolve(false), 5000);

    img.onload = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      console.log(`图片加载失败，将被跳过: ${url}`);
      resolve(false);
    };

    img.src = url;
  });
}

// 验证视频有效性
function validateVideo(url) {
  return new Promise(resolve => {
    const video = document.createElement('video');
    const timeout = setTimeout(() => resolve(false), 8000);

    // 只需加载元数据即可验证
    video.addEventListener('loadedmetadata', () => {
      clearTimeout(timeout);
      resolve(true);
    });

    video.addEventListener('error', () => {
      clearTimeout(timeout);
      console.log(`视频加载失败，将被跳过: ${url}`);
      resolve(false);
    });

    video.src = url;
    video.load();
  });
}

// 加载媒体元素
function loadMediaItems() {
  validMedia.forEach((media, index) => {
    const item = document.createElement('div');
    item.className = `media-item ${index === 0 ? 'active' : ''}`;
    item.dataset.index = index;

    if (media.type === 'image') {
      item.innerHTML = `<img src="${media.url}" alt="${media.url}">`;
    } else {
      // 视频添加循环属性，但只在单视频时生效
      item.innerHTML = `
          <video 
            src="${media.url}" 
            ${validMedia.length === 1 ? 'loop' : ''} 
            playsinline
          ></video>
        `;

      // 视频结束时触发下一个播放
      const video = item.querySelector('video');
      video.addEventListener('ended', () => {
        if (validMedia.length > 1 && isPlaying) {
          nextMedia();
        }
      });
    }

    mediaContainer.appendChild(item);
  });
}

// 创建指示器
function createIndicators() {
  validMedia.forEach((_, index) => {
    const indicator = document.createElement('div');
    indicator.className = `slide-indicator ${index === 0 ? 'active' : ''}`;
    indicator.dataset.index = index;
    indicator.addEventListener('click', () => {
      goToIndex(index);
    });
    indicators.appendChild(indicator);
  });
}

// 设置事件监听
function setupEventListeners() {
  // 播放/暂停控制
  playPauseBtn.addEventListener('click', togglePlayback);

  // 前后切换
  prevBtn.addEventListener('click', prevMedia);
  nextBtn.addEventListener('click', nextMedia);

  // 全屏控制
  fullscreenBtn.addEventListener('click', toggleFullscreen);
  // 强制刷新
  refreshBtn.addEventListener('click', function () { location.reload(true); });
  refreshImg.addEventListener('click', refreshAllImg);

  // 点击空白处切换到下一个（非全屏状态）
  mediaContainer.addEventListener('click', (e) => {
    if (e.target === mediaContainer && !document.fullscreenElement) {
      nextMedia();
    }
  });

  // 键盘控制
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowRight':
        nextMedia();
        break;
      case 'ArrowLeft':
        prevMedia();
        break;
      case ' ': // 空格键播放/暂停
        togglePlayback();
        break;
      case 'Escape': // ESC键退出全屏
        if (document.fullscreenElement) {
          exitFullscreen();
        }
        break;
    }
  });

  // 全屏状态变化
  document.addEventListener('fullscreenchange', handleFullscreenChange);
}

// 开始播放
function startPlayback() {
  isPlaying = true;
  playPauseBtn.innerHTML = `<i class="fa fa-pause"></i><span id="pauseTxt">${globalLang[globalConfig.lang]['pauseTxt']}</span>`;

  // 播放当前媒体
  const currentMedia = getCurrentMediaElement();
  if (currentMedia.tagName === 'VIDEO') {
    currentMedia.play();
  }

  // 如果是图片或者多视频场景，设置计时器
  if (validMedia[currentIndex].type === 'image' || validMedia.length > 1) {
    resetTimer();
  }
}

// 暂停播放
function pausePlayback() {
  isPlaying = false;
  playPauseBtn.innerHTML = `<i class="fa fa-play"></i><span id="playTxt">${globalLang[globalConfig.lang]['playTxt']}</span>`;

  // 清除计时器
  if (carouselTimer) {
    clearTimeout(carouselTimer);
    carouselTimer = null;
  }

  // 暂停当前视频
  const currentMedia = getCurrentMediaElement();
  if (currentMedia.tagName === 'VIDEO') {
    currentMedia.pause();
  }
}

// 切换播放/暂停状态
function togglePlayback() {
  if (isPlaying) {
    pausePlayback();
  } else {
    startPlayback();
  }
}

// 播放下一个媒体
function nextMedia() {
  currentIndex = (currentIndex + 1) % validMedia.length;
  updateMediaDisplay();
}

// 播放上一个媒体
function prevMedia() {
  currentIndex = (currentIndex - 1 + validMedia.length) % validMedia.length;
  updateMediaDisplay();
}

// 跳转到指定索引
function goToIndex(index) {
  currentIndex = index;
  updateMediaDisplay();
}

// 更新媒体显示
function updateMediaDisplay() {
  // 暂停当前媒体
  const currentMedia = getCurrentMediaElement();
  if (currentMedia.tagName === 'VIDEO') {
    currentMedia.pause();
  }

  // 隐藏所有媒体，显示当前媒体
  document.querySelectorAll('.media-item').forEach((item, index) => {
    item.classList.toggle('active', index === currentIndex);
  });

  // 更新指示器
  document.querySelectorAll('.slide-indicator').forEach((indicator, index) => {
    indicator.classList.toggle('active', index === currentIndex);
  });

  // 如果处于播放状态，启动当前媒体
  if (isPlaying) {
    const newMedia = getCurrentMediaElement();
    if (newMedia.tagName === 'VIDEO') {
      newMedia.play();
      // 多视频场景需要清除计时器，由视频结束事件控制切换
      if (validMedia.length > 1 && carouselTimer) {
        clearTimeout(carouselTimer);
        carouselTimer = null;
      }
    } else {
      // 图片启动计时器
      resetTimer();
    }
  }
}

// 获取当前激活的媒体元素
function getCurrentMediaElement() {
  const activeItem = document.querySelector(`.media-item.active`);
  return activeItem.querySelector('img, video');
}

// 重置计时器
function resetTimer() {
  if (carouselTimer) {
    clearTimeout(carouselTimer);
  }

  carouselTimer = setTimeout(() => {
    // 只有在播放状态且不是单视频时才自动切换
    if (isPlaying && !(validMedia.length === 1 && validMedia[0].type === 'video')) {
      nextMedia();
    }
  }, IMAGE_DURATION);
}

// 处理全屏状态变化
function handleFullscreenChange() {
  if (document.fullscreenElement) {
    allControls.forEach(el => el.classList.add('fullscreen-hidden'));
  } else {
    allControls.forEach(el => el.classList.remove('fullscreen-hidden'));
    fullscreenBtn.innerHTML = '<i class="fa fa-expand"></i><span id="fullscreenTxt">进入全屏</span>';
  }
}

// 切换全屏模式
function toggleFullscreen() {
  if (document.fullscreenElement) {
    exitFullscreen();
  } else {
    enterFullscreen();
  }
}

// 进入全屏
function enterFullscreen() {
  const container = document.documentElement;
  if (container.requestFullscreen) {
    container.requestFullscreen().catch(err => {
      console.log(`进入全屏失败: ${err.message}`);
    });
  }
}

// 退出全屏
function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

// 显示错误信息
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.id = 'noResFound'
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  mediaContainer.appendChild(errorDiv);
  //allControls.forEach(el => el.classList.add('fullscreen-hidden'));
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);

function refreshAllImg() {
  // 强制刷新页面内所有图片
  const images = document.querySelectorAll('img'); // 获取所有图片元素
  const videos = document.querySelectorAll('video'); // 获取所有图片元素
  let media = [...images, ...videos]
  timestamp = newTimestamp()
  media.forEach(img => {
    const originalSrc = img.src.split('?')[0]; // 去除已有参数
    // 添加时间戳作为随机参数（确保URL唯一）
    img.src = `${originalSrc}?t=${timestamp}`;
  });
}
function newTimestamp() {
  let ts = new Date().getTime() // 生成新的时间戳
  localStorage.setItem('timestamp', ts);
  return ts;
}
// 定时载入 json检查是否更新
async function checkUpdate() {
  let tempConfig = await loadJSON()
  if ((tempConfig.lang ?? '') == '') {
    return
  }
  let tempCurr = tempConfig.content[pathI];
  let {version,...copy} = tempCurr
  // 排除version 节点对比，如果有差异全部重载
  if (JSON.stringify(copy) != strCurrentTopic) {
    newTimestamp()
    location.reload(true)
  }else if(version != currentTopic.version){
    showVer(version)
    refreshAllImg() // 强制刷新资源
  }
}