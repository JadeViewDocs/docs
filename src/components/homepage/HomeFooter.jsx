import React from 'react';
import Link from '@docusaurus/Link';
import { Github } from '@styled-icons/boxicons-logos';
import ThemedImage from '@theme/ThemedImage';

// 友情链接
const products = [
  {
    name: '镜芯API',
    href: 'https://api2.wer.plus',
  },
  {
    name: '小维API',
    href: 'https://openapi.52vmy.cn',
  },
  {
    name: '科利特尔网',
    href: 'https://www.colithel.com',
  },
];

// 开发者链接
const developers = [
  {
    name: '文档',
    href: '/guides',
  },
  {
    name: 'API 参考',
    href: '/guides/reference/c-api',
  },
  {
    name: '快速开始',
    href: '/guides/quickstart',
  },
  {
    name: '社区包',
    href: '/community-packages',
  },
  {
    name: '更新日志',
    href: '/changelog',
  },
];

// 社群链接
const company = [
  {
    title: '社群',
    items: [
      {
        label: 'QQ群: 703623743',
        href: 'https://qm.qq.com/q/MVsl5VWokC',
      },
      {
        label: 'issues',
        href: 'https://github.com/JadeViewDocs/library/issues',
      },
      {
        label: '邮箱',
        href: 'ihanlong@qq.com',
      },
    ],
  },
];

function Links({ name, links }) {
  return (
    <div>
      <h3 className="font-jakarta text-base font-semibold uppercase text-gray-400 dark:text-[#fff]">
        {name}
      </h3>
      <div className="flex flex-col gap-3">
        {links.map(({ name, href }) => (
          <Link
            key={name}
            href={href}
            className="text-base text-gray-700 hover:text-primary hover:no-underline dark:text-[#f9f9f9]"
          >
            {name}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#F4F7FF] dark:bg-[#191919]">
      <div className="mx-auto flex w-full max-w-[1080px] flex-col px-6 py-12">
        <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <ThemedImage
            alt="JadeView"
            className="h-9 w-fit lg:h-12"
            sources={{
              light: '/logo/light.svg',
              dark: '/logo/dark.svg',
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-6 gap-y-12 md:grid-cols-3 lg:grid-cols-3">
          <Links name="友情链接" links={products} />
          <Links name="开发者" links={developers} />
          <Links name="社群" links={company} />
        </div>

        <hr className="my-12 !bg-gray-300 dark:!bg-[#999]" />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
          <div className="flex flex-wrap gap-2 text-sm text-gray-500">
            <span className="text-inherit dark:text-[#999]">
              &copy; {new Date().getFullYear()} JadeView. 保留所有权利。
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/JadeViewDocs/docs"
              aria-label="JadeView's GitHub Repository"
            >
              <Github className="h-7 w-7 text-zinc-400 hover:text-primary" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
