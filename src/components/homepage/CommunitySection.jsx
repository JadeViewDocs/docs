import React from 'react';
import Link from '@docusaurus/Link';
import { ChatRegular, CodeRegular } from '@fluentui/react-icons';

const contributors = [
  'ilinxuan',
];

export default function CommunitySection() {
  return (
    <section className="no-underline-links">
      <div className="mx-auto flex w-full flex-col items-center justify-center bg-gradient-to-b from-[#262626] to-black px-4 py-16 pt-64 text-white dark:from-zinc-200/90 dark:to-white dark:text-zinc-700">
        <h2 className="text-3xl">
          加入 <span className="text-primary-100">社区</span>
        </h2>
        <p className="mb-10 text-zinc-500">
          与开发者社区互动，获取最新更新、产品支持和更多资源。
        </p>
        <div className="mx-auto mb-16 flex flex-wrap -space-x-1.5">
          {contributors.map((username) => (
            <img
              key={username}
              src={`https://github.com/${username}.png?size=72`}
              alt={`User ${username}`}
              loading="lazy"
              className="h-6 w-6 rounded-full border-2 border-solid border-white transition hover:-translate-y-2 hover:scale-150 lg:h-12 lg:w-12"
            />
          ))}
        </div>
        <div className="flex w-full flex-col items-center justify-center gap-2 text-sm font-semibold lg:flex-row lg:gap-8">
          <Link
            className="flex w-full items-center justify-center gap-2 rounded-sm border border-solid border-primary-100 bg-primary-100/10 px-2 py-2 text-primary-100 lg:w-auto"
            href="https://qm.qq.com/q/MVsl5VWokC"
          >
            <ChatRegular className="h-5 w-5" /> QQ 群 &rarr;
          </Link>
          <Link
            className="flex w-full items-center justify-center gap-2 rounded-sm border border-solid border-primary-100 bg-primary-100/10 px-2 py-2 text-primary-100 lg:w-auto"
            href="https://github.com/JadeViewDocs/library"
          >
            <CodeRegular className="h-5 w-5" /> GitHub &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
