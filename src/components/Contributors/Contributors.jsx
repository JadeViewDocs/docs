import React from 'react';
// 导入静态贡献者数据
import contributorsMap from '../../data/contributors.json';

// 自定义Contributors组件，用于在文档页面中显示贡献者信息
const Contributors = ({ filePath }) => {
  // 调试：查看组件是如何被调用的
  console.log('Contributors组件被调用，filePath:', filePath);
  
  // 如果没有提供filePath，不显示贡献者信息
  if (!filePath) {
    console.log('没有提供filePath，不显示贡献者信息');
    return null;
  }
  
  // 直接从静态数据中获取贡献者
  const contributors = contributorsMap[filePath] || [];

  // 如果没有贡献者，不显示
  if (contributors.length === 0) {
    console.log('没有找到贡献者数据，filePath:', filePath);
    return null;
  }

  console.log('找到贡献者数据，filePath:', filePath, '贡献者:', contributors.length);

  return (
    <div className="contributors-section" style={{ margin: '0 auto', maxWidth: '1080px', padding: '0 20px' }}>
      <h3 className="contributors-title">文档贡献者</h3>
      <div className="contributors-avatars">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {contributors.map((contributor) => (
            <a
              key={contributor.login}
              href={`https://github.com/${contributor.login}`}
              target="_blank"
              rel="noopener noreferrer"
              title={contributor.login}
              className="contributor-avatar-link"
            >
              <img
                src={contributor.avatar}
                alt={contributor.login}
                width="40"
                height="40"
                style={{
                  borderRadius: '50%',
                  border: '2px solid var(--docs-color-background)',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => (e.target.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
              />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contributors;
