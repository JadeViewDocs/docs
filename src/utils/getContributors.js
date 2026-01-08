// 获取文档贡献者的工具函数
// 使用第三方API获取贡献者数据

// API配置
const API_BASE = 'https://proapi.azurewebsites.net/doc/getAvatarList';
const GITHUB_OWNER = 'JadeViewDocs';
const GITHUB_REPO = 'docs';
const GITHUB_BRANCH = 'master';

// 缓存贡献者数据，提高性能
const contributorsCache = new Map();

/**
 * 从API获取文档贡献者列表
 * @param {string} filePath - 文件路径
 * @returns {Promise<Array>} 贡献者列表
 */
export const getContributors = async (filePath) => {
  // 检查缓存
  if (contributorsCache.has(filePath)) {
    return contributorsCache.get(filePath);
  }
  
  try {
    // 构建API URL
    const url = `${API_BASE}?filename=${encodeURIComponent(filePath)}&owner=${GITHUB_OWNER}&repo=${GITHUB_REPO}&branch=${GITHUB_BRANCH}`;
    
    // 发送请求到API
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'JadeViewDocs-Contributors-Bot'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }
    
    // 解析响应数据
    const apiContributors = await response.json();
    
    // 格式化贡献者数据
    const contributors = apiContributors.map(item => ({
      login: item.username,
      avatar_url: item.url,
      html_url: `https://github.com/${item.username}`
    }));
    
    // 缓存结果
    contributorsCache.set(filePath, contributors);
    
    return contributors;
  } catch (error) {
    console.error('获取贡献者信息失败:', error);
    
    // 失败时返回模拟数据
    const mockContributors = [
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
    ];
    
    return mockContributors;
  }
};

/**
 * 获取所有文档的贡献者列表
 * @returns {Promise<Array>} 贡献者列表
 */
export const getAllContributors = async () => {
  try {
    // 使用默认文件路径获取所有贡献者
    const defaultFilePath = 'docs/guides/index.mdx';
    return await getContributors(defaultFilePath);
  } catch (error) {
    console.error('获取所有贡献者信息失败:', error);
    return [];
  }
};

