import React from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';

export default function HelpSection({ className = '' }) {
  return (
    <section className="px-4 pt-16">
      <div
        className={clsx(
          'mx-auto max-w-7xl rounded-3xl bg-white p-4 py-10 text-black dark:bg-black dark:text-white lg:p-24 lg:py-20',
          className,
        )}
      >
        <h2 className="mb-12 text-center lg:text-3xl">
          我们如何为您提供帮助？
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg bg-zinc-100 p-6 dark:bg-zinc-900">
            <img
              src="/static/landing-page/calendar.svg"
              alt="预约演示"
              width="48"
              height="48"
            />
            <h3 className="my-3">预约演示</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              联系我们获取演示。我们期待与您交流。
            </p>
            <Link
              href="#"
              className="text-primary dark:text-primary-100"
            >
              预约演示 &rarr;
            </Link>
          </div>

          <div className="rounded-lg bg-zinc-100 p-6 dark:bg-zinc-900">
            <img
              src="/static/landing-page/customer.svg"
              alt="技术支持"
              width="48"
              height="48"
            />
            <h3 className="my-3">技术支持</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              JadeView 的专业支持团队随时为您提供帮助。
              联系我们获取一对一支持！
            </p>
            <Link
              href="#"
              className="text-primary dark:text-primary-100"
            >
              联系我们 &rarr;
            </Link>
          </div>

          <div className="rounded-lg bg-zinc-100 p-6 dark:bg-zinc-900">
            <img
              src="/static/landing-page/chat.svg"
              alt="常见问题"
              width="48"
              height="48"
            />
            <h3 className="my-3">常见问题</h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              浏览我们的常见问题，查找您需要的答案。
            </p>
            <Link href="/faq" className="text-primary dark:text-primary-100">
              查看常见问题 &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
