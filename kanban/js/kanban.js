// 获取元素
const fullscreenBtn = document.getElementById('fullscreenBtn');
const refreshBtn = document.getElementById('refreshBtn');
const countdownEl = document.getElementById('countdown');
const gotoHome = document.getElementById('gotoHome');
const iContainer = document.getElementById('iframe-container');
const version = document.getElementById('version');
const body = document.body;

const strVersion = '1.0.1'
// 页面ID
let currentIndex = 0;
let currentIframe = null; // 当前iframe
let config = {
    urls: [],
    interval: 10,   // 默认10秒刷新,从URL中获取
    focusSecond: 10000, // 默认多久重新获得焦点
};
const RefreshSwitchSecond = 10; // 剩余秒数<此数为刷新，>为快进到此秒数
const SwitchMode1Count = 5; // 如果小于此数则开多个iframe实现，否则只开2个
let switchModeAllFrame = 0; // 1= 表示一次性创建多个iframe 0=表示最多创建2个iframe切换
// 刷新配置
let countdown = config.interval;
let countdownTimer = null;

// 初始化倒计时
function initCountdown() {
    // 清除现有定时器
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
    countdown = config.interval;
    countdownEl.textContent = countdown;
    if (countdown == 0) {
        // 修改样式 refresh-countdown 的对象，增加 display:none
        const countdownElement = document.querySelector('.refresh-countdown');
        if (countdownElement) {
            countdownElement.style.display = 'none';
        }
        return
    }
    // 启动倒计时
    countdownTimer = setInterval(() => {
        countdown--;
        countdownEl.textContent = countdown;
        // 倒计时结束，刷新页面
        if (countdown <= 0) {
            refreshPage(currentIndex + 1);
        }
    }, 1000);
}

// 刷新页面（仅刷新iframe，不刷新整个页面）
function refreshPage(index) {
    // 停止当前倒计时
    if (isNaN(index)) {
        // 刷新/切换
        if (countdown > RefreshSwitchSecond) {
            // 快进
            countdown = RefreshSwitchSecond
            return
        }
        index = currentIndex
    }
    clearInterval(countdownTimer);
    // 刷新iframe
    switchIframe(index)
    // 重新初始化倒计时
    initCountdown();
}

// 全屏切换函数
function toggleFullscreen() {
    // 判断当前是否处于全屏状态
    if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement) {
        // 进入全屏
        if (body.requestFullscreen) {
            body.requestFullscreen();
        } else if (body.webkitRequestFullscreen) { // 兼容Chrome/Safari
            body.webkitRequestFullscreen();
        } else if (body.mozRequestFullScreen) { // 兼容Firefox
            body.mozRequestFullScreen();
        }
        fullscreenBtn.textContent = '退出全屏';
    } else {
        // 退出全屏
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        }
        fullscreenBtn.textContent = '全屏显示';
    }
}

// 监听全屏状态变化（比如用户按ESC退出全屏）
document.addEventListener('fullscreenchange', updateFullscreenBtnText);
document.addEventListener('webkitfullscreenchange', updateFullscreenBtnText);
document.addEventListener('mozfullscreenchange', updateFullscreenBtnText);

// 更新全屏按钮文字
function updateFullscreenBtnText() {
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
        fullscreenBtn.textContent = '退出全屏';
    } else {
        fullscreenBtn.textContent = '全屏显示';
    }
}
function initPage() {
    version.innerHTML = strVersion
    const getSearchParams = () =>
        Object.fromEntries(new URLSearchParams(location.search));
    // 直接调用使用
    const searchObj = getSearchParams();
    let refresh = Number.parseInt(searchObj['r'])
    // 最小也要大于10秒或者不刷新
    if (!isNaN(refresh) && (refresh > 10 || refresh == 0)) {
        config.interval = refresh
    }
    let page = decodeURIComponent(searchObj['p'])
    config.urls = page.split(',');
    switchModeAllFrame = Number.parseInt(searchObj['s'])
    if(isNaN(switchModeAllFrame)){
        switchModeAllFrame = config.urls.length<SwitchMode1Count?1:0 // 数量少则使用全部载入iframe模式
    }
    //iframe.src = page // +'?hideHeader=1&hideSidebar=1&vc=true'
    switchIframe(0) // 首先显示第一个URL
    initCountdown();
    // 隐藏 iframe中的 dashboard-container-footer
    initKeyNav();
}
// 绑定事件
fullscreenBtn.addEventListener('click', toggleFullscreen);
gotoHome.addEventListener('click', function () { location.href = './index.html' });
refreshBtn.addEventListener('click', refreshPage); // 点击立即刷新
window.addEventListener('load', initPage); // 页面加载完成后启动倒计时

let currentFocusIndex = -1; // 当前聚焦的button索引
let buttons = [];
// 设置指定索引的button为焦点
const setFocus = (index) => {
    let btnLen = buttons.length;
    index = (index + btnLen) % btnLen
    if (index < 0 || index >= buttons.length) return;
    const targetBtn = buttons[index];
    targetBtn.focus({ preventScroll: true }); // 聚焦但不滚动页面
    currentFocusIndex = index;
};
function initKeyNav() {
    buttonSelector = '.control-btn'

    // 2. 获取目标button元素（兼容选择器/数组）
    if (typeof buttonSelector === 'string') {
        buttons = Array.from(document.querySelectorAll(buttonSelector));
    } else if (Array.isArray(buttonSelector)) {
        buttons = buttonSelector.filter(el => el.tagName === 'BUTTON');
    }
    // 无button时直接返回
    if (buttons.length === 0) return;
    // 4. 键盘事件监听
    const handleKeyDown = (e) => {
        // mytext.innerHTML = e.key;
        // 忽略输入框/文本域中的按键（避免干扰输入）
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
        switch (e.key) {
            // 左方向键：切换上一个button
            case 'ArrowLeft':
                e.preventDefault(); // 阻止默认行为（如页面左滑）
                const prevIndex = --currentFocusIndex;
                setFocus(prevIndex);
                break;

            // 右方向键：切换下一个button
            case 'ArrowRight':
                e.preventDefault();
                const nextIndex = ++currentFocusIndex;
                setFocus(nextIndex);
                break;

            // 上方向键：向上滚动
            case 'ArrowUp':
                e.preventDefault();
                currentIframe.focus(); // 让内容获得焦点以便于滚动
                break;

            // 下方向键：向下滚动
            case 'ArrowDown':
                e.preventDefault();
                currentIframe.focus();
                break;

            default:
                break;
        }
    };
    // 5. 初始化：给第一个button添加焦点（可选）
    setFocus(0);
    // 6. 绑定事件（支持移除）
    document.addEventListener('keydown', handleKeyDown);
    // 
    setInterval(function () { setFocus(currentFocusIndex) }, config.focusSecond); // 10秒后重新焦点
}
// 支持多个页面前后
// 新增预加载 iframe（隐藏）
// 修改 switchIframe 函数，先预加载再切换
function switchIframe(index) {
    if (index >= config.urls.length) index = 0;
    if (index < 0) index = config.urls.length - 1;

    const nextIndex = (index + 1) % config.urls.length;
    let currUrl = config.urls[index]
    // 切换当前页
    // 相同页面，直接刷新
    if (currentIndex == index && currentIframe != null) {
        currentIframe.src = currUrl
    } else {
        // 第一次载入
        if (iContainer.children.length == 0) {
            if (switchModeAllFrame == 0) {
                let f1 = createFrame(iContainer)
                showDom(f1)
                f1.src = currUrl;
                currentIframe = f1
                let f2 = createFrame(iContainer)
                hideDom(f2)
                f2.src = config.urls[nextIndex];
            } else {
                config.urls.forEach((url, i) => {
                    let f = createFrame(iContainer)
                    f.src = url
                    if (i == 0) {
                        // 显示第一个
                        showDom(f)
                        currentIframe = f
                    } else {
                        showDom(f) // 根据顺序覆盖，不要隐藏，否则可能无法载入数据
                    }
                })

            }
        } else {
            if (switchModeAllFrame == 0) {
                // 移除第一个
                let firstChild = iContainer.firstElementChild;
                iContainer.removeChild(firstChild);
                firstChild = iContainer.firstElementChild;
                currentIframe = firstChild
                showDom(firstChild)
                // 插入1个
                let f2 = createFrame(iContainer)
                f2.src = config.urls[nextIndex];
                hideDom(f2)
            } else {
                for(let i=0;i<iContainer.children.length;i++)
                {
                    let el = iContainer.children[i]
                    if(i == index){
                        showDom(el)
                    }else{
                        hideDom(el)
                    }
                }
            }

        }
    }
    currentIndex = index;
}

function hideDom(dom) {
    if(switchModeAllFrame == 1){
        dom.style.display = 'none'
    }else{
        // 通过移除和插入实现
    }
}
function showDom(dom) {
    if(switchModeAllFrame == 1){
        dom.style.display = ''
    }else{
        // 通过移除和插入实现
    }
}
function createFrame(targetDiv) {
    // 2. 创建iframe元素并配置属性
    const newIframe = document.createElement('iframe');
    // 配置iframe的核心属性（与你提供的HTML结构一致）
    newIframe.src = 'about:blank';
    newIframe.setAttribute('allowfullscreen', ''); // 布尔属性直接设为空字符串即可
    newIframe.setAttribute('allow', 'fullscreen; autoplay');
    newIframe.style.width = '100%';
    newIframe.style.height = '100%';
    // 3. 将新iframe添加到div的最后一位子元素
    targetDiv.appendChild(newIframe);
    newIframe.addEventListener('error', function () {
        setTimeout(() => {
            // 核心修正：先设为空白页（改变src值），再立即还原目标URL，强制触发重新加载
            const currentUrl = newIframe.src; // 先保存当前要重试的URL
            newIframe.src = 'about:blank';   // 临时修改src（触发状态重置）
            setTimeout(() => {
                newIframe.src = currentUrl;  // 还原URL，触发重新请求
            }, 100); // 100ms延迟确保状态重置完成
        }, 500);
    });
    return newIframe
}
