let globalConfig = {}
window.onload = async function () {
    // 载入配置文件
    globalConfig = await loadJSON();
    if ((globalConfig.lang ?? '') == '') {
        return
    }
    // 初始化语言
    initLang(globalConfig.lang)
    // 修改一行几列
    let colClass = 'md:grid-cols-' + globalConfig.columns
    let objTopic = document.getElementById('topics')
    objTopic.classList.add(colClass);
    // 生成链接
    let html = []
    // 图标样式清单
    let iconList = 'fa-file-text-o fa-image fa-video-camera fa-camera fa-film fa-microphone fa-stop-circle fa-download'.split(' ')
    let colorList = '#4F46E5 #10B981 #F97316 #334155 #E11D48 #0EA5E9 #7C3AED #D97706'.split(' ')
    globalConfig.content.forEach((x,i) => {
        let path = x.path??''
        if(path == '')
        {
            path = x.topic
        }
        let icon = x.icon==''?iconList[i%iconList.length]:x.icon
        let color = x.color==''?colorList[i%colorList.length]:x.color
        html.push(`
<a href="./show.html?i=${i}" class="nav-btn bg-[${color}] shadow-md">
  <i class="fa ${icon} btn-icon"></i>
  <span class="btn-text">${x.topic}</span>
</a>
`)
    })
    // 方式1：追加到现有内容后
    objTopic.innerHTML += html.join('');
}


