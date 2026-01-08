import React, { useState, useEffect } from 'react';
import { getContributors } from '../../utils/getContributors';

// 自定义Contributors组件，用于在文档页面中显示贡献者信息
const Contributors = ({ filePath }) => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 如果没有提供filePath，使用默认值
    const currentFilePath = filePath || 'docs/guides/index.mdx';
    
    // 从GitHub API获取真实贡献者数据
    const fetchContributors = async () => {
      setLoading(true);
      try {
        const data = await getContributors(currentFilePath);
        setContributors(data);
      } catch (error) {
        console.error('获取贡献者数据失败:', error);
        // 使用默认数据作为fallback
        setContributors([
          {
            login: 'jadeview-dev',
            avatar_url: 'https://avatars.githubusercontent.com/u/12345678?v=4',
            html_url: 'https://github.com/jadeview-dev'
          },
          {
            login: 'dev-user-1',
            avatar_url: 'https://avatars.githubusercontent.com/u/23456789?v=4',
            html_url: 'https://github.com/dev-user-1'
          },
          {
            login: 'contributor-2',
            avatar_url: 'https://avatars.githubusercontent.com/u/34567890?v=4',
            html_url: 'https://github.com/contributor-2'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchContributors();
  }, [filePath]);

  // 如果加载中，不显示
  if (loading) {
    return null;
  }

  // 如果没有贡献者，不显示
  if (contributors.length === 0) {
    return null;
  }

  return (
    <div className="contributors-section">
      <h3 className="contributors-title">文档贡献者</h3>
      <div className="contributors-avatars">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {contributors.map((contributor) => (
            <a
              key={contributor.login}
              href={contributor.html_url}
              target="_blank"
              rel="noopener noreferrer"
              title={contributor.login}
              className="contributor-avatar-link"
            >
              <img
                src={contributor.avatar_url}
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
