// 获取文档贡献者的工具函数
// 从GitHub API获取实际贡献者数据

// GitHub API 配置
const GITHUB_OWNER = 'JadeViewDocs';
const GITHUB_REPO = 'library';
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

// 缓存贡献者数据，提高性能
const contributorsCache = new Map();

/**
 * 从GitHub API获取文件的提交历史
 * @param {string} filePath - 文件路径
 * @returns {Promise<Array>} 提交历史列表
 */
const getFileCommits = async (filePath) => {
  try {
    // 构建GitHub API URL
    const url = `${GITHUB_API_BASE}/commits?path=${encodeURIComponent(filePath)}&per_page=100`;
    
    // 发送请求到GitHub API
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'JadeViewDocs-Contributors-Bot'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('获取文件提交历史失败:', error);
    return [];
  }
};

/**
 * 从GitHub API获取用户信息
 * @param {string} username - GitHub用户名
 * @returns {Promise<Object>} 用户信息
 */
const getUserInfo = async (username) => {
  try {
    const url = `https://api.github.com/users/${username}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'JadeViewDocs-Contributors-Bot'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`获取用户 ${username} 信息失败:`, error);
    // 返回默认用户信息
    return {
      login: username,
      avatar_url: `https://avatars.githubusercontent.com/u/0?v=4`,
      html_url: `https://github.com/${username}`
    };
  }
};

/**
 * 获取指定文件的贡献者列表
 * @param {string} filePath - 文件路径
 * @returns {Promise<Array>} 贡献者列表
 */
export const getContributors = async (filePath) => {
  // 检查缓存
  if (contributorsCache.has(filePath)) {
    return contributorsCache.get(filePath);
  }
  
  try {
    // 获取文件的提交历史
    const commits = await getFileCommits(filePath);
    
    if (commits.length === 0) {
      contributorsCache.set(filePath, []);
      return [];
    }
    
    // 从提交历史中提取唯一的作者
    const uniqueAuthors = new Set();
    commits.forEach(commit => {
      if (commit.author && commit.author.login) {
        uniqueAuthors.add(commit.author.login);
      }
    });
    
    // 获取每个作者的详细信息
    const contributors = await Promise.all(
      Array.from(uniqueAuthors).map(async (username) => {
        const userInfo = await getUserInfo(username);
        return {
          login: userInfo.login,
          avatar_url: userInfo.avatar_url,
          html_url: userInfo.html_url
        };
      })
    );
    
    // 按贡献次数排序（暂时简单排序，后续可优化为按提交次数排序）
    const sortedContributors = contributors.sort((a, b) => a.login.localeCompare(b.login));
    
    // 缓存结果
    contributorsCache.set(filePath, sortedContributors);
    
    return sortedContributors;
  } catch (error) {
    console.error('获取贡献者信息失败:', error);
    return [];
  }
};

/**
 * 获取所有文档的贡献者列表
 * @returns {Promise<Array>} 贡献者列表
 */
export const getAllContributors = async () => {
  try {
    // 从GitHub API获取仓库的所有贡献者
    const url = `${GITHUB_API_BASE}/contributors?per_page=100`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'JadeViewDocs-Contributors-Bot'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }
    
    const contributors = await response.json();
    
    // 格式化贡献者数据
    const formattedContributors = contributors.map(contributor => ({
      login: contributor.login,
      avatar_url: contributor.avatar_url,
      html_url: contributor.html_url
    }));
    
    return formattedContributors;
  } catch (error) {
    console.error('获取所有贡献者信息失败:', error);
    return [];
  }
};

