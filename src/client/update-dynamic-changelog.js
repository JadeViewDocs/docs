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

    // 查找markdown内容区域
    const markdownContainer = document.querySelector('.theme-doc-markdown');
    if (!markdownContainer) {
      return;
    }
    
    // 查找版本历史标题
    let versionHistorySection = null;
    const sectionTitles = markdownContainer.querySelectorAll('h2');
    sectionTitles.forEach(title => {
      if (title.textContent.includes('版本历史')) {
        versionHistorySection = title;
      }
    });
    
    if (!versionHistorySection) {
      return;
    }
    
    // 查找第一个版本条目（版本历史标题之后的第一个h3）
    let nextSibling = versionHistorySection.nextElementSibling;
    let firstVersionElement = null;
    
    while (nextSibling) {
      if (nextSibling.tagName === 'H3') {
        firstVersionElement = nextSibling;
        break;
      }
      nextSibling = nextSibling.nextElementSibling;
    }
    
    if (!firstVersionElement) {
      return;
    }
    
    // 检查是否需要更新
    if (firstVersionElement.textContent.includes(latestVersion)) {
      return;
    }
    
    // 处理发布说明，转换为HTML列表
    let formattedReleaseNotes = releaseNotes;
    if (releaseNotes) {
      // 将GitHub发布说明转换为HTML列表，处理换行符
      formattedReleaseNotes = releaseNotes
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => `<li>${line.replace(/^-\s*/, '').replace(/\r/g, '')}</li>`)
        .join('\n');
      
      if (formattedReleaseNotes) {
        formattedReleaseNotes = `<ul class="list-disc ml-6">${formattedReleaseNotes}</ul>`;
      } else {
        formattedReleaseNotes = '<p>- 暂无详细说明</p>';
      }
    } else {
      formattedReleaseNotes = '<p>- 暂无详细说明</p>';
    }
    
    // 创建新的版本内容
    const versionContent = `
      <h3>${latestVersion} (${releaseDate})</h3>
      <p>
        <a href="${releaseUrl}" target="_blank" rel="noopener noreferrer">查看发布页面</a>
      </p>
      <div>
        ${formattedReleaseNotes}
      </div>
    `;
    
    // 创建新的版本元素
    const newVersionElement = document.createElement('div');
    newVersionElement.innerHTML = versionContent;
    
    // 获取版本历史标题
    const historyTitle = versionHistorySection;
    
    // 获取版本历史标题的下一个兄弟元素
    const nextHistorySibling = historyTitle.nextElementSibling;
    
    // 如果有下一个兄弟元素，在它之前插入
    if (nextHistorySibling) {
      historyTitle.parentNode.insertBefore(newVersionElement, nextHistorySibling);
    } else {
      // 否则，在版本历史标题后追加
      historyTitle.parentNode.appendChild(newVersionElement);
    }
    
    // 移除旧版本（保留最新的3个版本）
    const allVersionHeadings = document.querySelectorAll('.theme-doc-markdown h3');
    
    // 如果版本数量超过3个，移除最旧的版本
    if (allVersionHeadings.length > 3) {
      // 从第4个版本开始移除（索引从0开始）
      for (let i = 3; i < allVersionHeadings.length; i++) {
        const heading = allVersionHeadings[i];
        
        // 移除这个版本的所有内容
        let currentElement = heading;
        
        // 移除当前元素及其所有后续兄弟元素，直到下一个h2或文档末尾
        while (currentElement) {
          const nextElement = currentElement.nextElementSibling;
          
          // 如果下一个元素是h2，停止移除
          if (nextElement && nextElement.tagName === 'H2') {
            break;
          }
          
          // 移除当前元素
          currentElement.remove();
          
          // 如果没有下一个元素，停止循环
          if (!nextElement) {
            break;
          }
          
          currentElement = nextElement;
        }
      }
    }
  } catch (error) {
    // 失败时不影响现有内容
  }
};

// 页面加载完成后执行
if (typeof window !== 'undefined') {
  // 使用setTimeout确保DOM完全加载
  setTimeout(updateChangelog, 1000);
}