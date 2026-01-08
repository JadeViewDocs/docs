// 确保脚本在浏览器环境中运行
if (typeof window !== 'undefined') {
  console.log('Changelog badge script is running');
  
  // 等待整个页面完全加载
  window.addEventListener('load', async () => {

    try {
      // 从GitHub API获取最新版本
      const response = await fetch('https://api.github.com/repos/JadeViewDocs/library/releases/latest', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      
      const release = await response.json();
      const latestVersion = release.tag_name;
      
      // 查找导航菜单
      const navbar = document.querySelector('.navbar');
      // 查找所有导航链接
      const navLinks = document.querySelectorAll('.navbar a');
      
      // 查找更新日志链接
      let changelogLink = null;
      navLinks.forEach(link => {
        console.log('Checking link:', link.textContent, link.href);
        if (link.textContent.includes('更新日志') || link.href.includes('changelog')) {
          changelogLink = link;
        }
      });
      
      if (changelogLink) {
        // 创建版本号角标
        const badge = document.createElement('span');
        badge.className = 'changelog-badge';
        badge.textContent = latestVersion;
        
        // 添加样式
        badge.style.cssText = `
          margin-left: 8px;
          padding: 2px 6px;
          background-color: #1a90ff;
          color: white;
          font-size: 10px;
          font-weight: 600;
          border-radius: 10px;
          vertical-align: middle;
        `;
        
        // 添加到更新日志链接后面
        changelogLink.parentNode.insertBefore(badge, changelogLink.nextSibling);

      } else {

      }
    } catch (error) {
      console.error('Error in changelog badge script:', error);
    }
  });
}