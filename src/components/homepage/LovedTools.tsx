import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';
import Link from '@docusaurus/Link';

interface ToolItem {
  name: string;
  iconUrl: string;
  color: string;
}

function Tool({ iconUrl, name, color }: ToolItem) {
  const { colorMode } = useColorMode();
  
  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <div 
        className="w-16 h-16 flex items-center justify-center rounded-full"
        style={{ 
          backgroundColor: colorMode === 'dark' && (name === 'Next.js' || name === 'Three.js') 
            ? '#ffffffd0' 
            : `${color}20` 
        }}
      >
        <img src={iconUrl} alt={name} className="w-10 h-10 object-contain" style={{ borderRadius: 0 }} />
      </div>
      <span className="text-sm font-medium">{name}</span>
    </div>
  );
}

export default function LovedTools() {
  const tools: ToolItem[] = [
    {
      name: 'HTML5',
      iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
      color: '#E34F26',
    },
    {
      name: 'React',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
      color: '#61DAFB',
    },
    {
      name: 'Vue.js',
      iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
      color: '#4FC08D',
    },
    {
      name: 'TypeScript',
      iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg',
      color: '#3178C6',
    },
    {
      name: 'Tailwind CSS',
      iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg',
      color: '#06B6D4',
    },
    {
      name: 'Next.js',
      iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
      color: '#000000',
    },
    {
      name: 'Three.js',
      iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/threejs/threejs-original.svg',
      color: '#FFFFFF',
    },
    {
      name: 'Webpack',
      iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/webpack/webpack-original.svg',
      color: '#8DD6F9',
    },
    {
      name: 'Sass',
      iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg',
      color: '#CC6699',
    },
    {
      name: 'Bootstrap',
      iconUrl: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg',
      color: '#7952B3',
    },
    {
      name: 'Angular',
      iconUrl: 'https://angular.io/assets/images/logos/angular/angular.png',
      color: '#DD0031',
    },
    {
      name: 'Playwright',
      iconUrl: 'https://playwright.dev/img/playwright-logo.svg',
      color: '#52B0E8',
    },
    {
      name: 'Testing Library',
      iconUrl: 'https://testing-library.com/img/octopus-64x64.png',
      color: '#E33323',
    },
  ];

  return (
    <section className="jv-home-section" aria-labelledby="jv-home-tools-heading">
      <header className="jv-home-section__header text-center">
        <h2 id="jv-home-tools-heading" className="jv-home-section__title text-4xl font-bold">
          使用你喜欢的工具
        </h2>
        <p className="jv-home-section__lead max-w-2xl mx-auto">
          JadeView 让你可以使用任何你熟悉的前端技术栈，从 React、Vue 到原生 HTML，构建你想要的桌面应用
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-4 mt-10">
        {tools.map((tool) => (
          <Tool key={tool.name} {...tool} />
        ))}
      </div>
    </section>
  );
}
