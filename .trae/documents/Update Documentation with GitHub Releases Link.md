# 更新文档中的GitHub Releases下载链接

## 概述
我需要更新JadeView文档，引导用户从GitHub Releases页面（https://github.com/JadeViewDocs/library/releases）下载`jadeview.dll`和SDK文件。

## 需要更新的文件

1. **docs/spec/local-web-resources.mdx**
   - 更新前提条件部分，添加GitHub Releases链接
   - 在使用步骤中添加从GitHub Releases下载`jadeview.dll`和`jadeview.h`的说明

2. **docs/easy-language-sdk/quickstart.mdx**
   - 更新SDK下载说明，指向GitHub Releases
   - 将"官方渠道"替换为GitHub Releases链接

3. **docs/easy-language-sdk/introduction.mdx**
   - 如果有SDK下载相关内容，更新为GitHub Releases链接

## 具体修改内容

### 对每个文件：
- 添加GitHub Releases链接：https://github.com/JadeViewDocs/library/releases
- 明确说明用户应从Releases页面下载`jadeview.dll`和`jadeview.h`
- 更新所有SDK下载相关说明，指向GitHub Releases

## 实施步骤

1. 更新`docs/spec/local-web-resources.mdx`，在前提条件和使用步骤中添加GitHub Releases链接
2. 更新`docs/easy-language-sdk/quickstart.mdx`，修改SDK下载说明
3. 检查并更新`docs/easy-language-sdk/introduction.mdx`（如需要）
4. 验证所有修改是否正确实施
5. 运行构建命令确保无编译错误

## 预期结果
所有文档现在都会正确引导用户从GitHub Releases页面下载`jadeview.dll`和SDK文件，为用户提供清晰一致的下载来源。