// 封装为异步函数
async function loadJSON() {
    try {
        const response = await fetch('config.txt?' + new Date().getTime()); // 防止缓存
        if (!response.ok) {
            throw new Error(`状态码：${response.status}`);
        }
        let text = await response.text(); // txt 可能不会指定为json需要强制
        let config = JSON5.parse(text);
        // 需要对 config 的参数进行格式检查和默认参数设置
        if ((config.lang ?? '') == '') {
            config.lang = "zh-CN"
        }
        let col = parseInt(config.columns)
        if (isNaN(col) || col < 1 || col > 12) {
            config.columns = 2
        }
        config.pageSize = isNaN(config.pageSize) ? 8 : config.pageSize // 默认2列
        let temp = []
        config.content.forEach((x, i) => {
            if ((x.topic ?? '') != '') {
                x.duration = isNaN(x.duration) ? 5 : x.duration
                x.icon = x.icon ?? ''
                x.color = x.color ?? ''
                x.path = ((x.path ?? '') == '') ? x.topic : x.path
                x.resList = x.resList ?? []
                x.resRange = x.resRange ?? ["1-6.jpg", "1-2.mp4"]
                x.detectSec = x.detectSec ?? 60;
                x.version = x.version ?? 1;
                x.rotate = x.rotate ?? 0;
                x.videoRoate = x.videoRoate ?? x.rotate; // 默认和 x.rotate一致
                x.syncPlayTime = x.syncPlayTime ?? '';
                x.syncPlayTime = strToDateArr(x.syncPlayTime)
                temp.push(x)
            }
        })
        config.content = temp
        return config
    } catch (error) {
        console.log('error:' + error.message)
    }
}

function initLang(lang) {
    // 绑定语言切换事件
    document.getElementById('lang-btn').addEventListener('click', () => switchLanguage()); // 'zh-CN'
    // document.getElementById('lang-en-US').addEventListener('click', () => switchLanguage('en-US'));
    switchLanguage(lang)
}
// 语言切换函数
function switchLanguage(lang) {
    if (lang == null) {
        // 进行自动切换
        if (document.documentElement.lang == 'zh-CN') {
            lang = 'en-US'
        } else {
            lang = 'zh-CN'
        }
    }
    // 进行翻译
    for (let x in globalLang[lang]) {
        let object = document.getElementById(x)
        let val = globalLang[lang][x]
        if (object != null) {
            object.innerText = val
        }
    }
    // 更新HTML lang属性
    document.documentElement.lang = lang;
    globalConfig.lang = lang
}
// 获取URL的地址参数
function getUrlParam(name) {
    // 检查是否支持URLSearchParams
    if ('URLSearchParams' in window) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }
    // 降级使用正则表达式
    else {
        const regex = new RegExp(`[?&]${name}=([^&]*)`);
        const results = regex.exec(window.location.search);
        return results ? decodeURIComponent(results[1]) : null;
    }
}
// 转换时间
function strToDateArr(timeStr) {
    let strArr = timeStr.split(/\s+/);
    let timArr = []
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 月份从0开始，无需+1（Date构造器直接用）
    const day = today.getDate();
    try {
        strArr.forEach(x => {
            let t = x.split(':').map(Number);
            const dt = new Date(year, month, day, t[0], t[1], t[2] ?? 0);
            timArr.push(dt)
        })
        return timArr
    } catch (e) {
        return []
    }
}