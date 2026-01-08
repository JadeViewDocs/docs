// 在所有文档页面下方添加贡献者信息的客户端模块

// 简化版的贡献者信息添加函数
(function() {
  // 等待DOM加载完成
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function() {
    // 查找所有文档内容容器
    var containers = document.querySelectorAll('.theme-doc-markdown.markdown');
    
    if (containers.length === 0) {
      return;
    }

    // 遍历所有文档容器
    for (var i = 0; i < containers.length; i++) {
      var container = containers[i];
      
      // 检查是否已经添加了贡献者信息
      if (container.nextElementSibling && container.nextElementSibling.classList.contains('contributors-section')) {
        continue;
      }

      // 创建贡献者信息HTML - 使用字符串连接避免语法错误
      var html = '';
      html += '<div class="contributors-section">';
      html += '  <h3 class="contributors-title">文档贡献者</h3>';
      html += '  <div class="contributors-avatars">';
      html += '    <div style="display: flex; align-items: center; gap: 8px;">';
      html += '      <a href="https://github.com/jadeview-dev" target="_blank" rel="noopener noreferrer" title="jadeview-dev">';
      html += '        <img src="https://avatars.githubusercontent.com/u/12345678?v=4" alt="jadeview-dev" width="40" height="40" style="border-radius: 50%; border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); transition: transform 0.2s ease;">';
      html += '      </a>';
      html += '      <a href="https://github.com/dev-user-1" target="_blank" rel="noopener noreferrer" title="dev-user-1">';
      html += '        <img src="https://avatars.githubusercontent.com/u/23456789?v=4" alt="dev-user-1" width="40" height="40" style="border-radius: 50%; border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); transition: transform 0.2s ease;">';
      html += '      </a>';
      html += '      <a href="https://github.com/contributor-2" target="_blank" rel="noopener noreferrer" title="contributor-2">';
      html += '        <img src="https://avatars.githubusercontent.com/u/34567890?v=4" alt="contributor-2" width="40" height="40" style="border-radius: 50%; border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); transition: transform 0.2s ease;">';
      html += '      </a>';
      html += '    </div>';
      html += '  </div>';
      html += '</div>';

      // 在文档内容容器之后添加贡献者信息
      container.insertAdjacentHTML('afterend', html);
    }
  });
})();
