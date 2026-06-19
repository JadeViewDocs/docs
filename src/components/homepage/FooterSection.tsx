import { AnimatedWave } from "./animated-wave";

function ArrowUpRightIcon() {
  return (
    <svg className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
    </svg>
  );
}

const footerLinks = {
  文档: [
    { name: "快速开始", href: "/spec/quickstart" },
    { name: "API 参考", href: "/v2api" },
    { name: "更新日志", href: "/releases/" },
    { name: "IPC 通信", href: "/spec/ipc-communication" },
  ],
  社区: [
    { name: "QQ群", href: "https://qm.qq.com/q/MVsl5VWokC" },
    { name: "GitHub", href: "https://github.com/JadeViewDocs/JadeView", badge: "Issues" as const },
    { name: "Gitee", href: "https://gitee.com/ilinxuan/JadeView_library" },
    { name: "邮箱", href: "mailto:tuyang@jade.run" },
  ],
  相关: [
    { name: "镜芯API", href: "https://api2.wer.plus/" },
    { name: "小维API", href: "https://openapi.52vmy.cn/" },
    { name: "科利特尔网", href: "https://www.colithel.com/" },
  ],
};

const socialLinks:{name:string,href:string}[] = [
  { name: "蜀ICP备2022000695号-9", href: "https://beian.miit.gov.cn/" },
] 

interface FooterSectionProps {
  forceLight?: boolean;
}

export function FooterSection({ forceLight = false }: FooterSectionProps) {
  return (
    <footer className="relative border-t border-foreground/10" {...(forceLight ? { "data-theme": "light" } : {})}>
      {/* Animated wave background */}
      <div className="absolute inset-0 h-64 opacity-20 pointer-events-none overflow-hidden">
        <AnimatedWave forceLight={forceLight} />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Main Footer */}
        <div className="py-16 lg:py-12">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-12 lg:gap-8">
            {/* Brand Column */}
            <div className="col-span-3">
              <a href="/" className="inline-flex items-center gap-2 mb-6">
                <span className="text-2xl font-display">JadeView</span>
              </a>

              <p className="text-muted-foreground leading-relaxed mb-8 max-w-xs">
                面向 Windows 的通用 WebView 宿主库。Rust 核心 + WebView2 渲染 + C 语言 API。
              </p>

              {/* Social Links */}
              <div className="flex gap-6">
                {socialLinks.map((link) => (
                  <a
                    key={link?.name}
                    href={link?.href}
                    target={link?.href?.startsWith("http") ? "_blank" : undefined}
                    rel={link?.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 group"
                  >
                    {link?.name}
                    <ArrowUpRightIcon />
                  </a>
                ))}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-sm font-medium mb-6">{title}</h3>
                <ul className="space-y-4">
                  {links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
                      >
                        {link.name}
                        {"badge" in link && link.badge && (
                          <span className="text-xs px-2 py-0.5 bg-foreground text-background rounded-full">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-8 border-t border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            2025 JadeView. 保留所有权利。
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              欢迎使用 JadeView！
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
