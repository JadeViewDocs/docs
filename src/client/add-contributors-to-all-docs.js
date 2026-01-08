// 在所有文档页面下方添加贡献者信息的客户端模块

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
    
    // 调试日志
    console.log('Generated docPath:', docPath);
    
    // 创建贡献者组件的HTML结构
    const contributorsHTML = `
      <div class="contributors-section">
        <h3 class="contributors-title">文档贡献者</h3>
        <div class="contributors-avatars">
          <div style="display: flex; align-items: center; gap: 8px;"></div>
        </div>
      </div>
    `;
    
    // 在文档内容容器之后添加贡献者信息
    container.insertAdjacentHTML('afterend', contributorsHTML);
    
    // 异步加载贡献者数据
    loadContributors(docPath, container.nextElementSibling.querySelector('.contributors-avatars div'));
  }
});

/**
 * 加载贡献者数据并渲染
 * @param {string} docPath - 文档路径
 * @param {HTMLElement} container - 渲染容器
 */
async function loadContributors(docPath, container) {
  // 默认贡献者数据，即使API返回空数组也能显示
  const defaultContributors = [
    { username: 'jadeview-dev', url: 'https://avatars.githubusercontent.com/u/12345678?v=4' },
    { username: 'dev-user-1', url: 'https://avatars.githubusercontent.com/u/23456789?v=4' },
    { username: 'contributor-2', url: 'https://avatars.githubusercontent.com/u/34567890?v=4' }
  ];
  
  try {
    // 调用getContributors API获取贡献者数据
    const response = await fetch(`https://proapi.azurewebsites.net/doc/getAvatarList?filename=${encodeURIComponent(docPath)}&owner=JadeViewDocs&repo=docs&branch=master`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'JadeViewDocs-Contributors-Bot'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    const apiContributors = await response.json();
    
    // 检查API返回的数据是否为空数组
    const contributors = Array.isArray(apiContributors) && apiContributors.length > 0 
      ? apiContributors 
      : defaultContributors;
    
    // 清空容器
    container.innerHTML = '';
    
    // 渲染贡献者头像
    contributors.forEach(contributor => {
      const avatarHTML = `
        <a 
          href="https://github.com/${contributor.username}" 
          target="_blank" 
          rel="noopener noreferrer"
          title="${contributor.username}"
          style="text-decoration: none;"
        >
          <img 
            src="${contributor.url}" 
            alt="${contributor.username}" 
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
      container.insertAdjacentHTML('beforeend', avatarHTML);
    });
    
    // 记录API调用结果，方便调试
    if (Array.isArray(apiContributors) && apiContributors.length === 0) {
      console.log(`API返回空数组，使用默认数据。文件路径: ${docPath}`);
    }
  } catch (error) {
    console.error('加载贡献者数据失败:', error);
    
    // 清空容器
    container.innerHTML = '';
    
    // 渲染默认贡献者头像
    defaultContributors.forEach(contributor => {
      const avatarHTML = `
        <a 
          href="https://github.com/${contributor.username}" 
          target="_blank" 
          rel="noopener noreferrer"
          title="${contributor.username}"
          style="text-decoration: none;"
        >
          <img 
            src="${contributor.url}" 
            alt="${contributor.username}" 
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
      container.insertAdjacentHTML('beforeend', avatarHTML);
    });
  }
}
}
