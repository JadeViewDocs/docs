import React, { useState, useEffect } from 'react';
import DocItem from '@theme-original/DocItem';
import Contributors from '../../components/Contributors';
import { getContributors } from '../../utils/getContributors';

export default function DocItemWrapper(props) {
  // 从props中获取当前文档的信息
  const { children, content: { filePath } = {} } = props;
  const [contributors, setContributors] = useState([]);

  useEffect(() => {
    // 异步获取贡献者数据
    const fetchContributors = async () => {
      const data = await getContributors(filePath);
      setContributors(data);
    };

    fetchContributors();
  }, [filePath]);

  return (
    <>
      <DocItem {...props}>
        {children}
        {/* 在文档内容下方添加贡献者组件 */}
        <Contributors contributors={contributors} />
      </DocItem>
    </>
  );
}
