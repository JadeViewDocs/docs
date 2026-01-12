// 自定义DocItem组件，用于在所有文档下方添加贡献者信息
import React from 'react';

// 导入原始DocItem组件
import OriginalDocItem from '@theme-original/DocItem';

/**
 * 自定义DocItem组件，保持原样
 * @param {Object} props - 组件属性
 * @returns {JSX.Element} 自定义DocItem组件
 */
export default function DocItem(props) {
  return (
    <div className="doc-item-wrapper">
      {/* 渲染原始DocItem组件 */}
      <OriginalDocItem {...props} />
      
      {/* 贡献者信息由客户端脚本添加，此处不再重复显示 */}
    </div>
  );
}

