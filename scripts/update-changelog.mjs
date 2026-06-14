#!/usr/bin/env node

/**
 * 自动从 GitHub Releases 获取发布信息并生成 JSON 数据
 * 使用方法：node scripts/update-changelog.mjs
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// GitHub API 配置
const OWNER = 'JadeViewDocs';
const REPO = 'JadeView';
const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/releases`;

// 获取当前文件的目录路径（ES模块方式）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 输出路径
const OUTPUT_PATH = path.join(__dirname, '../static/releases/data.json');

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
      const chunks = [];

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        const data = Buffer.concat(chunks).toString('utf-8');
        if (res.statusCode !== 200) {
          reject(new Error(`GitHub API 返回错误状态码: ${res.statusCode}。仓库可能不存在、是私有的，或遇到了 API 限制。`));
          return;
        }

        try {
          const releases = JSON.parse(data);
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
 * 处理 Release body 中的 Issue 引用
 */
function processReleaseBody(body) {
  if (!body) return body;

  let processedBody = body.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '');
  processedBody = processedBody.replace(/\r\n/g, '\n');
  processedBody = processedBody.replace(/\r/g, '\n');

  // 将 #123 转换为 GitHub Issue 链接
  processedBody = processedBody.replace(/(^|[^:])#(\d+)(?![\d])/g, '$1[#$2](https://github.com/JadeViewDocs/JadeView/issues/$2)');

  return processedBody;
}

/**
 * 生成 JSON 数据
 */
function generateReleasesData(releases) {
  const result = {
    updated_at: new Date().toISOString(),
    releases: releases.map((release) => ({
      tag_name: release.tag_name,
      name: release.name || release.tag_name,
      published_at: release.published_at,
      prerelease: release.prerelease,
      html_url: release.html_url,
      gitee_url: `https://gitee.com/ilinxuan/JadeView_library/releases/tag/${release.tag_name}`,
      body: processReleaseBody(release.body) || '',
    })),
  };

  return JSON.stringify(result, null, 2);
}

/**
 * 更新发布数据
 */
async function updateChangelog() {
  try {
    console.log('正在从 GitHub 获取发布信息...');
    const releases = await fetchReleases();

    if (!Array.isArray(releases) || releases.length === 0) {
      console.log('未找到任何发布信息，跳过更新');
      return;
    }

    console.log(`成功获取 ${releases.length} 个发布版本（含 prerelease）`);

    // 确保 static/releases 目录存在
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // 生成 JSON 数据
    const content = generateReleasesData(releases);
    fs.writeFileSync(OUTPUT_PATH, content, 'utf-8');
    console.log(`发布数据已成功更新到 ${OUTPUT_PATH}`);

  } catch (error) {
    console.warn('⚠️ 更新发布数据失败:', error.message);
    console.warn('跳过更新，继续构建...');
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