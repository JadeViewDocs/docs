#!/usr/bin/env node

/**
 * GitHub GraphQL API v4 客户端
 * 用于获取仓库和贡献者信息
 */

/**
 * 创建 GitHub GraphQL 客户端
 * @param {string} token - GitHub 个人访问令牌
 * @returns {Object} 客户端对象，包含 request 方法
 */
export function createGithubGraphQLClient(token) {
  const endpoint = 'https://api.github.com/graphql';

  /**
   * 发送 GraphQL 请求
   * @param {string} query - GraphQL 查询字符串
   * @param {Object} variables - 查询变量
   * @returns {Promise<Object>} 查询结果
   */
  async function request(query, variables = {}) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'JadeViewDocs-Contributors-Generator'
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL Errors: ${JSON.stringify(data.errors, null, 2)}`);
    }

    return data.data;
  }

  return { request };
}