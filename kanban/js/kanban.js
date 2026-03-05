// 获取元素
const fullscreenBtn = document.getElementById('fullscreenBtn');
const refreshBtn = document.getElementById('refreshBtn');
const countdownEl = document.getElementById('countdown');
const iframe = document.getElementById('dashboardIframe');
const gotoHome = document.getElementById('gotoHome');
const body = document.body;

// 刷新配置
let REFRESH_INTERVAL = 10; // 默认10秒刷新
let countdown = REFRESH_INTERVAL;
let countdownTimer = null;

// 初始化倒计时
function initCountdown() {
    // 清除现有定时器
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }
    countdown = REFRESH_INTERVAL;
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
            refreshPage();
        }
    }, 1000);
}

// 刷新页面（仅刷新iframe，不刷新整个页面）
function refreshPage() {
    // 停止当前倒计时
    clearInterval(countdownTimer);
    // 刷新iframe
    iframe.src = iframe.src;
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
    const getSearchParams = () =>
        Object.fromEntries(new URLSearchParams(location.search));
    // 直接调用使用
    const searchObj = getSearchParams();
    let refresh = Number.parseInt(searchObj['r'])
    // 最小也要大于10秒或者不刷新
    if (!isNaN(refresh) && (refresh > 10 || refresh == 0)) {
        REFRESH_INTERVAL = refresh
    }
    let page = decodeURIComponent(searchObj['p'])
    iframe.src = page // +'?hideHeader=1&hideSidebar=1&vc=true'
    initCountdown();
    // 隐藏 iframe中的 dashboard-container-footer
    initKeyNav();
}
// 绑定事件
fullscreenBtn.addEventListener('click', toggleFullscreen);
gotoHome.addEventListener('click', function () { location.href = './index.html' });
refreshBtn.addEventListener('click', refreshPage); // 点击立即刷新
window.addEventListener('load', initPage); // 页面加载完成后启动倒计时

// 处理iframe加载错误（可选）
iframe.addEventListener('error', function () {
    alert('仪表盘页面加载失败，请检查网络或链接是否有效！');
    // 加载失败后重置倒计时
    initCountdown();
});
iframe.addEventListener('load', function () {
    try {
        // 获取iframe内部的document对象
        //const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        // 控制台输出iframe的document对象
        //console.log('iframe的document对象：', iframeDocument);

        // 可选：验证是否能访问到iframe内部的DOM（比如输出body内容）
        //console.log('iframe的body内容：', iframeDocument.body);
    } catch (error) {
        // 捕获跨域错误（最常见的问题）
        console.error('无法访问iframe的document，原因：', error.message);
        console.warn('提示：跨域的iframe无法访问其内部DOM，这是浏览器的安全限制');
    }
});

let currentFocusIndex = -1; // 当前聚焦的button索引
let buttons = [];
// 设置指定索引的button为焦点
const setFocus = (index) => {
    let btnLen = buttons.length;
    index = (index + btnLen)%btnLen
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
                const prevIndex = --currentFocusIndex ;
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
                iframe.focus(); // 让内容获得焦点以便于滚动
                break;

            // 下方向键：向下滚动
            case 'ArrowDown':
                e.preventDefault();
                iframe.focus();
                break;

            // 可选：按Enter键触发当前焦点button的点击
            case 'Enter':
                if (currentFocusIndex >= 0) {
                    buttons[currentFocusIndex].click();
                }
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
    setInterval(function(){ setFocus(currentFocusIndex)},10000); // 10秒后重新焦点
}
