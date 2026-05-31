import { useState } from "react";

// Inline SVG icons
function ArrowRightIcon() {
  return <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/></svg>;
}
function CheckIcon() {
  return <svg className="w-4 h-4 text-foreground mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
}

const plans = [
  {
    name: "DLL 动态库", description: "运行时动态加载，适合快速集成",
    price: { monthly: 0, annual: 0 },
    features: ["WebView2 窗口创建","事件系统支持","自定义标题栏","IPC 双向通信","完整 C API","全功能免费"],
    cta: "下载 DLL", popular: false,
  },
  {
    name: "Lib 静态库", description: "编译时静态链接，独立部署无依赖",
    price: { monthly: 0, annual: 0 },
    features: ["WebView2 窗口创建","事件系统支持","自定义标题栏","IPC 双向通信","完整 C API","全功能免费","编译进 EXE"],
    cta: "下载 Lib", popular: true,
  },
  {
    name: "企业定制", description: "专属技术支持和定制开发",
    price: { monthly: null, annual: null },
    features: ["以上所有功能","源码级定制","专属技术支持","定制功能开发","性能优化咨询","长期版本维护","安全审计支持","合同保障"],
    cta: "联系我们", popular: false,
  },
];

export function DistributionSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="pricing" className="relative py-32 lg:py-40 border-t border-foreground/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="max-w-3xl mb-20">
          <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase block mb-6">选择版本</span>
          <h2 className="font-display text-5xl md:text-6xl lg:text-7xl tracking-tight text-foreground mb-6">
            全功能<br /><span className="text-stroke">永久免费</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl">
            DLL 和 Lib 提供完全相同的 C API。全功能免费，无需商业授权。
          </p>
        </div>

        <div className="flex items-center gap-4 mb-16">
          <span className={`text-sm transition-colors ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>DLL</span>
          <button onClick={() => setIsAnnual(!isAnnual)} className="relative w-14 h-7 bg-foreground/10 rounded-full p-1 transition-colors hover:bg-foreground/20">
            <div className={`w-5 h-5 bg-foreground rounded-full transition-transform duration-300 ${isAnnual ? "translate-x-7" : "translate-x-0"}`} />
          </button>
          <span className={`text-sm transition-colors ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>Lib</span>
          {isAnnual && <span className="ml-2 px-2 py-1 bg-foreground text-white text-xs font-mono">推荐</span>}
        </div>

        <div className="grid md:grid-cols-3 gap-px bg-foreground/10">
          {plans.map((plan, idx) => (
            <div key={plan.name} className={`relative p-8 lg:p-12 bg-background ${plan.popular ? "md:-my-4 md:py-12 lg:py-16 border-2 border-foreground" : ""}`}>
              {plan.popular && <span className="absolute -top-3 left-8 px-3 py-1 bg-foreground text-white text-xs font-mono uppercase tracking-widest">推荐版本</span>}
              <div className="mb-8">
                <span className="font-mono text-xs text-muted-foreground">{String(idx + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-3xl text-foreground mt-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>
              <div className="mb-8 pb-8 border-b border-foreground/10">
                {plan.price.monthly !== null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-5xl lg:text-6xl text-foreground">免费</span>
                  </div>
                ) : (
                  <span className="font-display text-4xl text-foreground">定制</span>
                )}
              </div>
              <ul className="space-y-4 mb-10">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <CheckIcon />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => {
                if (plan.cta === "联系我们") {
                  window.open("mailto:tuyang@jade.run", "_self");
                } else {
                  window.open("/spec/changelog", "_blank");
                }
              }} className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${plan.popular ? "bg-foreground text-white hover:bg-foreground/90" : "border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5"}`}>
                {plan.cta}
                <ArrowRightIcon />
              </button>
            </div>
          ))}
        </div>
        <p className="mt-12 text-center text-sm text-muted-foreground">
          DLL 和 Lib 的 C API 完全一致，仅在链接方式上有区别。{" "}
          <a href="/v2api" className="underline underline-offset-4 hover:text-foreground transition-colors">查看 API 文档</a>
        </p>
      </div>
    </section>
  );
}