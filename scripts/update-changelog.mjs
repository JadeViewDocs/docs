#!/usr/bin/env node

/**
 * 自动从 GitHub Releases 获取发布信息并更新更新日志
 * 使用方法：node scripts/update-changelog.js
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// GitHub API 配置
const OWNER = 'JadeViewDocs';
const REPO = 'library';
const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/releases`;

// 获取当前文件的目录路径（ES模块方式）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHANGELOG_PATH = path.join(__dirname, '../docs/changelog/index.mdx');

/**
 * 从 GitHub API 获取发布信息
 */
function fetchReleases() {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'JadeViewDocs',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(API_URL, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        // 检查 HTTP 状态码
        if (res.statusCode !== 200) {
          reject(new Error(`GitHub API 返回错误状态码: ${res.statusCode}。仓库可能不存在、是私有的，或遇到了 API 限制。`));
          return;
        }

        try {
          const releases = JSON.parse(data);
          // 检查是否返回了错误对象
          if (releases.message) {
            reject(new Error(`GitHub API 错误: ${releases.message}`));
            return;
          }
          resolve(releases);
        } catch (error) {
          reject(new Error(`无法解析 GitHub API 响应: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`获取发布信息失败: ${error.message}`));
    });
  });
}

/**
 * 生成更新日志的 Markdown 内容
 */
function generateChangelogContent(releases) {
  let content = `---
title: 更新日志
sidebar_position: 1
---

# 更新日志

## 版本历史

`;

  /**
   * 处理Release body中的Issue引用和内部标题
   */
  function processReleaseBody(body) {
    if (!body) return body;
    
    // 将#123转换为GitHub Issue链接，避免被解析为标题
    // 匹配#后面跟数字，前面不是:，避免匹配URL中的#片段
    let processedBody = body.replace(/(^|[^:])#(\d+)(?![\d])/g, '$1[#$2](https://github.com/JadeViewDocs/library/issues/$2)');
    
    // 将内部标题转换为粗体文本，避免出现在目录中
    processedBody = processedBody.replace(/^##\s+(.*)$/gm, '**$1**');
    processedBody = processedBody.replace(/^###\s+(.*)$/gm, '**$1**');
    
    return processedBody;
  }

  // 遍历所有发布版本
  for (const release of releases) {
    // 解析发布日期
    const releaseDate = new Date(release.published_at).toISOString().split('T')[0];
    
    // 生成版本部分，使用容器包裹，防止内部标题污染全局目录
    content += `### ${release.tag_name} (${releaseDate})\n\n`;
    
    // 添加 GitHub 发布链接
    content += `[查看发布页面](${release.html_url})\n\n`;
    
    // 添加发布说明，使用容器包裹
    content += `<div className="changelog-version-container">

`;
    
    if (release.body) {
      const processedBody = processReleaseBody(release.body);
      content += `${processedBody}\n\n`;
    } else {
      content += `**发布说明：**\n- 暂无详细说明\n\n`;
    }
    
    // 关闭容器
    content += `</div>\n\n`;
  }

  // 添加未来计划部分
  content += "## 版权信息\n\n© 2025 JadeView. 保留所有权利。\n";

  return content;
}

/**
 * 更新更新日志文件
 */
async function updateChangelog() {
  try {
    console.log('正在从 GitHub 获取发布信息...');
    const releases = await fetchReleases();
    
    if (!Array.isArray(releases) || releases.length === 0) {
      console.log('未找到任何发布信息，跳过更新');
      return;
    }
    
    console.log(`成功获取 ${releases.length} 个发布版本`);
    
    // 生成更新日志内容
    const content = generateChangelogContent(releases);
    
    // 更新文件
    fs.writeFileSync(CHANGELOG_PATH, content, 'utf-8');
    
    console.log(`更新日志已成功更新到 ${CHANGELOG_PATH}`);
    
  } catch (error) {
    console.warn('⚠️ 更新更新日志失败:', error.message);
    console.warn('跳过更新日志更新，继续构建...');
    // 不退出，让构建继续
  }
}

// 执行更新
export default updateChangelog;

// 如果直接运行该脚本 (ES模块方式)
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  const scriptPath = process.argv[1];
  if (modulePath === scriptPath) {
    updateChangelog();
  }
}