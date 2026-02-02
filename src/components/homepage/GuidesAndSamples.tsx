import React from 'react';
import Link from '@docusaurus/Link';
import {
  ArrowRightFilled,
  DocumentRegular,
  WindowRegular,
  CodeRegular,
  ChevronRightRegular,
} from '@fluentui/react-icons';
import clsx from 'clsx';

interface Guide {
  title: string;
  icon: any;
  text: string;
  link: string;
}

const guides: Guide[] = [
  {
    title: '快速开始',
    icon: DocumentRegular,
    text: '了解如何快速集成 JadeView 到你的项目中。',
    link: '/spec/quickstart',
  },
  {
    title: '窗口管理指南',
    icon: WindowRegular,
    text: '学习如何创建和管理 WebView 窗口。',
    link: '/guides/window-api',
  },
  {
    title: '事件处理指南',
    icon: CodeRegular,
    text: '掌握事件系统，实现灵活的交互控制。',
    link: '/guides/event-types',
  },
];

interface Sample {
  title: string;
  platform?: string;
  source?: string;
  blog?: string;
}

const samples: Sample[] = [
  {
    title: 'Web SDK 示例',
    platform: 'JavaScript',
    source: 'https://github.com/JadeViewDocs/library',
    blog: '/web-sdk',
  },
  {
    title: 'Python SDK 示例',
    platform: 'Python',
    source: 'https://github.com/JadeViewDocs/library',
    blog: '/python-sdk',
  },
  {
    title: '易语言 SDK 示例',
    platform: '易语言',
    source: 'https://github.com/JadeViewDocs/library',
    blog: '/easy-language-sdk',
  },
];

function Guide({ title, text, icon: Icon, link }: (typeof guides)[0]) {
  return (
    <Link
      to={link}
      className="group flex cursor-pointer items-start gap-2 rounded-lg border border-transparent p-3 text-inherit transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
    >
      <Icon className="h-6 w-6" />

      <div className="flex flex-col">
        <h4 className="mb-1 font-semibold">{title}</h4>
        <p className="mb-0 text-sm text-text-400">{text}</p>
      </div>

      <ChevronRightRegular className="ml-auto h-5 w-5 self-center opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

function Sample({ title, platform, blog, source }: Sample) {
  return (
    <div className="group flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-3 text-text-400/60 transition-all hover:border-primary hover:bg-primary/10 hover:text-primary">
      <div className="flex flex-col">
        <h4 className="mb-1 text-black group-hover:text-primary dark:text-white">
          {title}
        </h4>
        <div className="text-sm text-text-400">{platform}</div>
      </div>

      <div className="flex items-center gap-2.5">
        {blog && (
          <Link to={blog} className="text-inherit transition-colors hover:text-primary">
            <DocumentRegular className="h-5 w-5" />
          </Link>
        )}

        {source && (
          <Link
            to={source}
            className="flex items-center gap-1 rounded-lg py-1 px-3 text-inherit transition-colors hover:bg-primary hover:text-white"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="font-semibold">源码</span>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function GuidesAndSamples() {
  return (
    <section className="no-underline-links my-40 mx-auto flex w-full max-w-5xl flex-col gap-10 p-4 py-0 md:flex-row md:gap-0">
      <div className="flex-1">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="m-0">热门指南</h3>

          <Link to="/guides" className="font-jakarta text-sm font-semibold transition-colors hover:text-primary">
            查看更多指南 <ArrowRightFilled className="ml-1" />
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          {guides.map((guide) => (
            <Guide {...guide} key={guide.title} />
          ))}
        </div>
      </div>

      <div
        className={clsx(
          'mx-8 block flex-shrink-0 bg-gradient-to-b from-transparent via-secondary-700 to-transparent',
          'hidden w-px md:block',
        )}
      />

      <div className="w-full md:max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="m-0">示例项目</h3>

          <Link
            to="https://github.com/JadeViewDocs/library"
            className="font-jakarta text-sm font-semibold transition-colors hover:text-primary"
          >
            所有示例 <ArrowRightFilled className="ml-1" />
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          {samples.map((sample) => (
            <Sample {...sample} key={sample.title} />
          ))}
        </div>
      </div>
    </section>
  );
}
