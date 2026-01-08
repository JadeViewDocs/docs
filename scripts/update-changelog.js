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
        try {
          const releases = JSON.parse(data);
          resolve(releases);
        } catch (error) {
          reject(new Error(`Failed to parse GitHub API response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Failed to fetch releases: ${error.message}`));
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

  // 遍历所有发布版本
  for (const release of releases) {
    // 解析发布日期
    const releaseDate = new Date(release.published_at).toISOString().split('T')[0];
    
    // 生成版本部分
    content += `### ${release.tag_name} (${releaseDate})

`;
    
    // 添加发布说明
    if (release.body) {
      content += `${release.body}\n\n`;
    } else {
      content += `**发布说明：**
- 暂无详细说明\n\n`;
    }
  }

  // 添加未来计划部分
  content += "## 即将推出\n\n### 未来计划\n\n- [ ] 支持 macOS 平台\n- [ ] 支持 Linux 平台\n- [ ] 增强主题系统\n- [ ] 支持自定义窗口样式\n- [ ] 增强事件系统\n- [ ] 支持多窗口管理\n- [ ] 支持窗口拖放\n- [ ] 支持窗口透明度调整\n- [ ] 支持窗口动画效果\n- [ ] 增强本地服务器功能\n\n## 已知问题\n\n### 当前版本\n\n- `execute_javascript` 函数尚未实现\n- 某些高级功能可能需要进一步测试\n\n## 反馈与建议\n\n如果您有任何问题或建议，欢迎通过以下方式反馈：\n\n- 提交 Issue\n- 发送邮件\n- 加入社区讨论\n\n## 版权信息\n\n© 2025 JadeView. 保留所有权利。\n";

  return content;
}

/**
 * 更新更新日志文件
 */
async function updateChangelog() {
  try {
    console.log('正在从 GitHub 获取发布信息...');
    const releases = await fetchReleases();
    
    if (releases.length === 0) {
      console.log('未找到任何发布信息');
      return;
    }
    
    console.log(`成功获取 ${releases.length} 个发布版本`);
    
    // 生成更新日志内容
    const content = generateChangelogContent(releases);
    
    // 更新文件
    fs.writeFileSync(CHANGELOG_PATH, content, 'utf-8');
    
    console.log(`更新日志已成功更新到 ${CHANGELOG_PATH}`);
    
  } catch (error) {
    console.error('更新更新日志失败:', error.message);
    process.exit(1);
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