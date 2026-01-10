// 在所有文档页面下方添加贡献者信息的客户端模块
// 使用静态贡献者数据，不再动态获取

// 静态贡献者数据 - 从JSON文件生成
const contributorsMap = {
  "docs/guides/index.mdx": [
    { "login": "JadeViewDev", "avatar": "https://avatars.githubusercontent.com/u/12345678?v=4" },
    { "login": "contributor1", "avatar": "https://avatars.githubusercontent.com/u/23456789?v=4" }
  ],
  "docs/spec/index.mdx": [
    { "login": "JadeViewDev", "avatar": "https://avatars.githubusercontent.com/u/12345678?v=4" }
  ],
  "docs/web-sdk/index.mdx": [
    { "login": "JadeViewDev", "avatar": "https://avatars.githubusercontent.com/u/12345678?v=4" },
    { "login": "webdev1", "avatar": "https://avatars.githubusercontent.com/u/34567890?v=4" }
  ]
};

// 确保只在浏览器环境中执行
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // 等待DOM加载完成
  document.addEventListener('DOMContentLoaded', () => {
    // 查找所有文档内容容器 - 适配所有文档部分
    const docContentContainers = document.querySelectorAll(
      '.theme-doc-markdown.markdown' // 匹配所有文档页面的内容容器
    );
    
    if (docContentContainers.length === 0) {
      console.log('未找到文档内容容器');
      return;
    }
    
    // 遍历所有文档容器
    for (let i = 0; i < docContentContainers.length; i++) {
      const container = docContentContainers[i];
      
      // 检查是否已经添加了贡献者信息
      if (container.nextElementSibling && container.nextElementSibling.classList.contains('contributors-section')) {
        continue;
      }
      
      // 从URL中提取更准确的文档路径
      const pathname = window.location.pathname;
      let docPath = 'docs/guides/index.mdx'; // 默认路径
      
      // 根据URL路径生成更准确的文档路径
      if (pathname.startsWith('/web-sdk')) {
        // 处理web-sdk部分的路径
        const relativePath = pathname.replace('/web-sdk', '');
        docPath = `docs/web-sdk${relativePath || '/index'}.mdx`;
      } else if (pathname.startsWith('/easy-language-sdk')) {
        // 处理easy-language-sdk部分的路径
        const relativePath = pathname.replace('/easy-language-sdk', '');
        docPath = `docs/easy-language-sdk${relativePath || '/index'}.mdx`;
      } else if (pathname.startsWith('/changelog')) {
        // 处理changelog部分的路径
        const relativePath = pathname.replace('/changelog', '');
        docPath = `docs/changelog${relativePath || '/index'}.mdx`;
      } else if (pathname.startsWith('/spec')) {
        // 处理spec部分的路径
        const relativePath = pathname.replace('/spec', '');
        docPath = `docs/spec${relativePath || '/index'}.mdx`;
      } else if (pathname.startsWith('/guides')) {
        // 处理guides部分的路径
        const relativePath = pathname.replace('/guides', '');
        docPath = `docs/guides${relativePath || '/index'}.mdx`;
      }
      
      // 移除末尾的斜杠
      docPath = docPath.replace(/\/$/, '');
      // 替换连续的斜杠
      docPath = docPath.replace(/\/+/g, '/');
      
      // 获取该文档的贡献者
      const contributors = contributorsMap[docPath] || [];
      
      // 如果没有贡献者，跳过
      if (contributors.length === 0) {
        continue;
      }
      
      // 构建贡献者HTML
      let avatarsHTML = '';
      contributors.forEach(contributor => {
        avatarsHTML += `
          <a 
            href="https://github.com/${contributor.login}" 
            target="_blank" 
            rel="noopener noreferrer"
            title="${contributor.login}"
            style="text-decoration: none;"
          >
            <img 
              src="${contributor.avatar}" 
              alt="${contributor.login}" 
              width="40" 
              height="40"
              style="
                border-radius: 50%;
                border: 2px solid var(--docs-color-background);
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                transition: transform 0.2s ease;
              "
              onmouseenter="this.style.transform = 'translateY(-2px)'"
              onmouseleave="this.style.transform = 'translateY(0)'"
            />
          </a>
        `;
      });
      
      // 创建贡献者组件的HTML结构
      const contributorsHTML = `
        <div class="contributors-section">
          <h3 class="contributors-title">文档贡献者</h3>
          <div class="contributors-avatars">
            <div style="display: flex; align-items: center; gap: 8px;">${avatarsHTML}</div>
          </div>
        </div>
      `;
      
      // 在文档内容容器之后添加贡献者信息
      container.insertAdjacentHTML('afterend', contributorsHTML);
    }
  });
}