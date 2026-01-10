// 在所有文档页面下方添加贡献者信息的客户端模块
// 使用静态贡献者数据，不再动态获取

// 从生成的JSON文件导入静态贡献者数据
import contributorsMap from '../data/contributors.json';

// 确保只在浏览器环境中执行
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // 等待DOM加载完成
  document.addEventListener('DOMContentLoaded', () => {
    // 查找所有文档内容容器 - 适配所有文档部分
    const docContentContainers = document.querySelectorAll(
      '.theme-doc-markdown.markdown, .markdown' // 匹配所有文档页面的内容容器
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
      
      // 通用路径匹配逻辑：从URL中提取文档路径并尝试多种匹配方式
      const cleanPath = pathname.replace(/^\//, '').replace(/\/$/, '');
      
      // 尝试多种可能的文档路径格式，按优先级排序
      const possiblePaths = [];
      
      // 1. 直接格式：docs/[pathname].mdx
      if (cleanPath) {
        possiblePaths.push(`docs/${cleanPath}.mdx`);
      }
      
      // 2. 带index格式：docs/[pathname]/index.mdx
      if (cleanPath) {
        possiblePaths.push(`docs/${cleanPath}/index.mdx`);
      }
      
      // 3. 处理根路径情况
      possiblePaths.push('docs/guides/index.mdx');
      
      // 4. 尝试移除文件扩展名（如果有）
      if (cleanPath && cleanPath.endsWith('.mdx')) {
        const noExtPath = cleanPath.replace('.mdx', '');
        possiblePaths.push(`docs/${noExtPath}.mdx`);
        possiblePaths.push(`docs/${noExtPath}/index.mdx`);
      }
      
      // 5. 尝试移除最后一个路径段，添加index
      if (cleanPath && cleanPath.includes('/')) {
        const lastSlashIndex = cleanPath.lastIndexOf('/');
        const parentPath = cleanPath.substring(0, lastSlashIndex);
        possiblePaths.push(`docs/${parentPath}.mdx`);
        possiblePaths.push(`docs/${parentPath}/index.mdx`);
      }
      
      // 遍历所有可能的路径，找到匹配的贡献者数据
      let matchedPath = null;
      for (const possiblePath of possiblePaths) {
        if (contributorsMap[possiblePath]) {
          matchedPath = possiblePath;
          break;
        }
      }
      
      // 如果找到匹配的路径，使用它
      if (matchedPath) {
        docPath = matchedPath;
      } else {
        // 如果没有找到匹配，输出调试信息
        console.log(`未找到贡献者数据的路径：${pathname}，尝试过的路径：`, possiblePaths);
      }
      
      // 移除末尾的斜杠
      docPath = docPath.replace(/\/$/, '');
      // 替换连续的斜杠
      docPath = docPath.replace(/\/+\//g, '/');
      
      // 处理特殊情况：如果直接匹配失败，尝试多种可能的路径格式
      if (!contributorsMap[docPath]) {
        // 1. 尝试移除/index
        const noIndexPath = docPath.replace(/\/index\.mdx$/, '.mdx');
        if (contributorsMap[noIndexPath]) {
          docPath = noIndexPath;
        } 
        // 2. 尝试添加/index
        else {
          const withIndexPath = docPath.replace(/\.mdx$/, '/index.mdx');
          if (contributorsMap[withIndexPath]) {
            docPath = withIndexPath;
          }
        }
      }
      
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