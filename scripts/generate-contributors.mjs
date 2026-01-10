#!/usr/bin/env node

/**
 * 生成文档贡献者静态JSON数据
 * 使用GitHub GraphQL API v4获取贡献者信息
 * 生成格式：contributorsMap["docs/path/to/file.md"] = [{ login: "user1", avatar: "..." }]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createGithubGraphQLClient } from './github-graphql-client.mjs';

// 获取当前文件的目录路径（ES模块方式）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const REPO_OWNER = 'JadeViewDocs';
const REPO_NAME = 'docs';
const BRANCH_NAME = 'main';
const DOCS_DIR = path.join(__dirname, '../docs');
const OUTPUT_FILE = path.join(__dirname, '../src/data/contributors.json');

// 确保输出目录存在
fs.mkdirSync(path.join(__dirname, '../src/data'), { recursive: true });

/**
 * 获取指定文件的贡献者
 * @param {Object} client - GitHub GraphQL客户端
 * @param {string} filePath - 文件路径
 * @returns {Promise<Array>} 贡献者列表
 */
async function getFileContributors(client, filePath) {
  // GitHub GraphQL 查询
  const query = `
    query GetFileContributors($owner: String!, $repo: String!, $path: String!, $ref: String!) {
      repository(owner: $owner, name: $repo) {
        object(expression: $ref) {
          ... on Commit {
            history(first: 100, path: $path) {
              nodes {
                author {
                  user {
                    login
                    avatarUrl(size: 100)
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await client.request(query, {
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
      ref: BRANCH_NAME
    });

    const commits = result.repository.object.history.nodes;
    const contributorsMap = new Map();

    // 提取并去重贡献者
    commits.forEach(commit => {
      if (commit?.author?.user) {
        const { login, avatarUrl } = commit.author.user;
        if (!contributorsMap.has(login)) {
          contributorsMap.set(login, {
            login,
            avatar: avatarUrl
          });
        }
      }
    });

    return Array.from(contributorsMap.values());
  } catch (error) {
    console.error(`获取文件贡献者失败 (${filePath}):`, error.message);
    return [];
  }
}

/**
 * 遍历所有文档文件
 * @param {string} dir - 目录路径
 * @returns {Array} 文件路径列表
 */
function getAllDocFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllDocFiles(fullPath));
    } else if (/(md|mdx)$/.test(entry.name)) {
      // 只处理 Markdown 文件
        const relativePath = path.relative(path.join(__dirname, '..'), fullPath)
          .replace(/\\/g, '/');
        files.push(relativePath);
    }
  }

  return files;
}

/**
 * 主函数
 */
async function main() {
  console.log('开始生成贡献者数据...');
  console.log(`仓库: ${REPO_OWNER}/${REPO_NAME}`);
  console.log(`分支: ${BRANCH_NAME}`);
  console.log(`文档目录: ${DOCS_DIR}`);

  // 检查是否设置了 GitHub 令牌
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.error('错误: 请设置 GITHUB_TOKEN 环境变量');
    process.exit(1);
  }

  // 创建 GitHub GraphQL 客户端
  const client = createGithubGraphQLClient(githubToken);

  // 获取所有文档文件
  const docFiles = getAllDocFiles(DOCS_DIR);
  console.log(`找到 ${docFiles.length} 个文档文件`);

  // 生成贡献者映射
  const contributorsMap = {};
  
  for (const filePath of docFiles) {
    console.log(`处理文件: ${filePath}`);
    const contributors = await getFileContributors(client, filePath);
    if (contributors.length > 0) {
      contributorsMap[filePath] = contributors;
    }
  }

  // 写入输出文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(contributorsMap, null, 2), 'utf-8');
  console.log(`贡献者数据已生成: ${OUTPUT_FILE}`);
  console.log(`共生成 ${Object.keys(contributorsMap).length} 个文件的贡献者数据`);
}

// 执行主函数
// 添加模拟模式支持，用于测试
const args = process.argv.slice(2);
const isMockMode = args.includes('--mock');

if (isMockMode) {
  // 模拟生成贡献者数据
  console.log('使用模拟模式生成贡献者数据...');
  
  // 获取所有文档文件
  const docFiles = getAllDocFiles(DOCS_DIR);
  console.log(`找到 ${docFiles.length} 个文档文件`);
  
  // 生成模拟贡献者映射
  const contributorsMap = {};
  
  for (const filePath of docFiles) {
    console.log(`处理文件: ${filePath}`);
    // 为每个文档文件生成模拟贡献者数据
    contributorsMap[filePath] = [
      {
        login: "JadeViewDev",
        avatar: "https://avatars.githubusercontent.com/u/12345678?v=4"
      }
    ];
  }
  
  // 写入输出文件
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(contributorsMap, null, 2), 'utf-8');
  console.log(`贡献者数据已生成: ${OUTPUT_FILE}`);
  console.log(`共生成 ${Object.keys(contributorsMap).length} 个文件的贡献者数据`);
} else {
  main().catch(error => {
    console.error('生成贡献者数据失败:', error);
    process.exit(1);
  });
}