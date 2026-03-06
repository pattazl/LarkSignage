let globalConfig = {}
let currentPage = 1
let totalPages = 1
window.onload = async function () {
    // 载入配置文件
    globalConfig = await loadJSON();
    if ((globalConfig.lang ?? '') == '') {
        return
    }
    // 初始化语言
    initLang(globalConfig.lang)
    let objTopic = document.getElementById('topics')
    let colClass = 'md:grid-cols-' + globalConfig.columns
    objTopic.classList.add(colClass);
    totalPages = Math.ceil(globalConfig.content.length / globalConfig.pageSize);
    document.getElementById('prevBtn').onclick = () => { gotoPage(-1); };
    document.getElementById('nextBtn').onclick = () => { gotoPage(1); };
    // 初始化分页
    gotoPage()

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowRight':
                // 分页切换
                e.preventDefault(); // 关闭浏览器默认行为
                gotoPage(1)
                break
            case 'ArrowLeft':
                e.preventDefault(); // 关闭浏览器默认行为
                gotoPage(-1)
                break;
            case 'ArrowUp':
                // 单页选择
                e.preventDefault(); // 关闭浏览器默认行为
                e.stopPropagation(); // 阻止事件冒泡（可选，根据需求）
                selectTopic(-1)
                break;
            case 'ArrowDown':
                e.preventDefault(); // 关闭浏览器默认行为
                e.stopPropagation(); // 阻止事件冒泡（可选，根据需求）
                selectTopic(1)
                break;
        }
    });
}
// 3. 渲染内容 + 更新分页（合并逻辑，减少函数）
const render = () => {
    // 更新分页按钮状态
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    document.getElementById('pageInfo').textContent = ` ${currentPage}  /  ${totalPages} `;
    // 渲染页码数字按钮
    renderPageNumbers();
};

// 4. 渲染页码数字按钮（精简创建逻辑）
const renderPageNumbers = () => {
    const container = document.getElementById('pageNumberContainer');
    container.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `px-4 py-2 border rounded ${i === currentPage
                ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:border-blue-600' // 激活态hover
                : 'border-gray-200 hover:bg-gray-50' // 非激活态hover
            }`;
        btn.textContent = i;
        btn.onclick = () => { currentPage = i; gotoPage(); render(); };
        container.appendChild(btn);
    }
};
function gotoPage( delta ) {
    // currentPage 页数增减
    if( !isNaN(delta)){
        let pageNum = currentPage + delta
        if(pageNum <1 || pageNum > totalPages){
            return;
        }
        currentPage = pageNum
    }
    let objTopic = document.getElementById('topics')
    objTopic.innerHTML = ''
    // 修改一行几列
    // 生成链接
    let html = []
    // 图标样式清单
    let iconList = 'fa-file-text-o fa-image fa-video-camera fa-camera fa-film fa-microphone fa-stop-circle fa-download'.split(' ')
    let colorList = '#4F46E5 #10B981 #F97316 #334155 #E11D48 #0EA5E9 #7C3AED #D97706'.split(' ')

    // 计算起始和结束索引
    const startIndex = (currentPage - 1) * globalConfig.pageSize;
    const endIndex = startIndex + globalConfig.pageSize;

    // 截取目标页内容（超出数组长度自动返回剩余部分）
    let arr = globalConfig.content.slice(startIndex, endIndex);
    arr.forEach((x, i) => {
        let path = x.path ?? ''
        if (path == '') {
            path = x.topic
        }
        let refresh = x.refresh ?? '120'
        let icon = x.icon == '' ? iconList[i % iconList.length] : x.icon
        let color = x.color == '' ? colorList[i % colorList.length] : x.color
        html.push(`
<a href="./kanban.html?r=${refresh}&p=${encodeURIComponent(path)}" class="nav-btn bg-[${color}] shadow-md">
  <i class="fa ${icon} btn-icon"></i>
  <span class="btn-text">${x.topic}</span>
</a>
`)
    })
    // 方式1：追加到现有内容后
    objTopic.innerHTML = html.join('');
    render();
}
// 选择上一个按钮或下一个
function selectTopic(delta){
    let btns = document.querySelectorAll('a.nav-btn');
    let btnArr = [...btns]
    btnArr.push( document.getElementById('lang-btn') ); // 非 control-btn 在最后
    switchActBtn(btnArr,delta)
}