import React from 'react';
import { Avatar } from 'antd';

const Contributors = ({ contributors }) => {
  if (!contributors || contributors.length === 0) {
    return null;
  }

  return (
    <div className="contributors-section">
      <h3 className="contributors-title">文档贡献者</h3>
      <div className="contributors-avatars">
        <Avatar.Group maxCount={10}>
          {contributors.map(contributor => (
            <a 
              key={contributor.login} 
              href={contributor.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="contributor-avatar-link"
              title={contributor.login}
            >
              <Avatar 
                src={contributor.avatar_url} 
                alt={contributor.login} 
                size={40}
              />
            </a>
          ))}
        </Avatar.Group>
      </div>
    </div>
  );
};

export default Contributors;
