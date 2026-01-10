// 自定义DocItem组件，用于在所有文档下方添加贡献者信息
import React from 'react';

// 导入原始DocItem组件
import OriginalDocItem from '@theme-original/DocItem';

// 导入静态贡献者数据
import contributorsMap from '../../data/contributors.json';

// 导入Contributors组件（使用直接接受contributors数组的版本）
import Contributors from '../../components/Contributors';

/**
 * 自定义DocItem组件，在文档内容下方添加贡献者信息
 * @param {Object} props - 组件属性
 * @returns {JSX.Element} 自定义DocItem组件
 */
export default function DocItem(props) {
  // 从props中获取当前文档的内容信息，包括filePath
  const { content: { filePath } = {} } = props;
  
  // 从静态数据中获取贡献者
  const contributors = filePath ? contributorsMap[filePath] || [] : [];
  
  return (
    <div className="doc-item-wrapper">
      {/* 渲染原始DocItem组件 */}
      <OriginalDocItem {...props} />
      
      {/* 在文档内容下方添加贡献者组件，传递contributors数组 */}
      {contributors.length > 0 && <Contributors contributors={contributors} />}
    </div>
  );
}

