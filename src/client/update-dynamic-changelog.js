// 客户端脚本：动态更新更新日志

const updateChangelog = async () => {
  try {
    // 获取最新发布信息
    const response = await fetch('https://api.github.com/repos/JadeViewDocs/library/releases/latest', {
      headers: {
        'User-Agent': 'JadeViewDocs',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('HTTP error! status: ' + response.status);
    }

    const release = await response.json();
    const latestVersion = release.tag_name;
    const releaseDate = new Date(release.published_at).toISOString().split('T')[0];
    const releaseUrl = release.html_url;
    const releaseNotes = release.body || '- 暂无详细说明';

    // 查找更新日志页面的版本历史部分
    const changelogContainer = document.querySelector('.theme-doc-markdown');
    if (!changelogContainer) {
      console.error('Could not find changelog container');
      return;
    }

    // 查找第一个版本条目
    const firstVersionHeading = changelogContainer.querySelector('h3');
    if (!firstVersionHeading) {
      console.error('Could not find version heading');
      return;
    }

    // 检查是否需要更新
    if (firstVersionHeading.textContent.includes(latestVersion)) {
      console.log('Changelog is already up to date');
      return;
    }

    // 创建新的版本内容
    const versionContent = `
      <h3 class="text-xl font-semibold mb-2">${latestVersion} (${releaseDate})</h3>
      <div class="mb-4">
        <a href="${releaseUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">
          查看发布页面
        </a>
      </div>
      <div class="release-body">${releaseNotes}</div>
    `;

    // 替换旧版本内容
    const parentElement = firstVersionHeading.parentElement;
    if (parentElement) {
      // 找到当前版本部分的所有元素
      const elementsToRemove = [];
      let nextElement = firstVersionHeading;
      
      while (nextElement && !nextElement.tagName.match(/^H[2-6]$/) && !nextElement.textContent.includes('版权信息')) {
        elementsToRemove.push(nextElement);
        nextElement = nextElement.nextElementSibling;
      }
      
      // 移除旧元素
      elementsToRemove.forEach(el => el.remove());
      
      // 添加新内容
      parentElement.innerHTML = versionContent;
    }
  } catch (error) {
    console.error('Failed to update changelog:', error);
    // 失败时不影响现有内容
  }
};

// 页面加载完成后执行
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', updateChangelog);
}