/**
 * 种子数据：社区版预置模板（经典 / 优雅 / 简洁）
 * 运行方式：bun packages/db/src/seeds/templates.ts
 */
import { getDb } from '../client'
import { templates } from '../schema'

const classicPresetConfig = {
  global: {
    themeColor: '#2563eb',
    fontFamily: 'system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif',
    baseFontSize: 'base',
    codeTheme: 'androidstudio',
  },
  variables: {
    brandColor: '#2563eb',
    accentColor: '#f5f7fb',
    textColor: '#1f2937',
  },
  styles: {
    h1: 'table mx-auto px-4 py-0 border-b-2 border-[var(--brandColor)] text-[19px] font-bold text-gray-900 mt-8 mb-4 text-center',
    h2: 'table mx-auto px-1 py-0.5 bg-[var(--brandColor)] text-white text-[19px] font-bold mt-16 mb-8 text-center',
    h3: 'pl-2 border-l-[3px] border-[var(--brandColor)] text-[18px] leading-[1.2] font-bold text-gray-900 mt-8 mb-3',
    h4: 'text-[16px] font-bold text-[var(--brandColor)] mt-8 mb-2',
    h5: 'text-[16px] font-bold text-[var(--brandColor)] mt-6 mb-2',
    h6: 'text-[16px] text-[var(--brandColor)] mt-6 mb-2',
    p: 'mt-0 mb-6 mx-2 leading-8 tracking-[0.1em] text-[16px] text-gray-800',
    blockquote: 'mt-0 mb-4 p-4 border-l-4 border-[var(--brandColor)] rounded-md text-gray-800 bg-gray-100',
    code: 'bg-gray-100 px-1.5 py-0.5 rounded text-sm text-red-600 font-mono',
    'code-inline': 'bg-gray-100 px-1.5 py-0.5 rounded text-sm text-red-600 font-mono',
    pre: 'bg-gray-900 text-gray-100 p-4 rounded mt-0 mb-5 overflow-x-auto',
    ul: 'mt-0 mb-5 pl-[1em] leading-8 text-[16px] text-gray-800',
    ol: 'mt-0 mb-5 pl-[1em] leading-8 text-[16px] text-gray-800',
    li: '',
    strong: 'font-bold text-[var(--brandColor)]',
    em: 'italic text-gray-700',
    del: 'line-through text-gray-500',
    hr: 'border-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent my-8',
    a: 'text-[#576b95] no-underline',
    img: 'max-w-full h-auto my-4 rounded-md',
    table: 'w-full border-collapse my-4 text-[15px] text-gray-800',
    thead: 'bg-[var(--brandColor)] text-white',
    th: 'border border-gray-300 px-4 py-2 text-left font-bold',
    td: 'border border-gray-300 px-4 py-2',
  },
  meta: {
    presetKey: 'classic',
    presetName: '经典',
    description: '平衡的信息密度与阅读舒适度，适合大多数文章场景。',
    locked: true,
  },
}

const gracePresetConfig = {
  global: {
    themeColor: '#b76e79',
    fontFamily: 'Georgia, Times New Roman, Songti SC, serif',
    baseFontSize: 'base',
    codeTheme: 'androidstudio',
  },
  variables: {
    brandColor: '#b76e79',
    accentColor: '#f8f5f6',
    textColor: '#1f2937',
  },
  styles: {
    h1: 'table mx-auto px-4 py-2 border-b-2 border-[var(--brandColor)] text-[22px] font-bold text-gray-900 mt-8 mb-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.10)] text-center',
    h2: 'table mx-auto px-4 py-1 rounded-lg bg-[var(--brandColor)] text-white text-[21px] font-bold mt-16 mb-8 shadow-md text-center',
    h3: 'pl-3 border-l-4 [border-left-style:solid] border-l-[var(--brandColor)] border-b [border-bottom-style:dashed] border-b-[var(--brandColor)] text-[19px] font-bold text-gray-900 mt-8 mb-3',
    h4: 'text-[18px] font-bold text-[var(--brandColor)] mt-7 mb-2',
    h5: 'text-[16px] font-bold text-[var(--brandColor)] mt-6 mb-2',
    h6: 'text-[16px] font-bold text-[var(--brandColor)] mt-6 mb-2',
    p: 'mt-0 mb-6 leading-8 tracking-[0.1em] text-[16px] text-gray-800',
    blockquote: 'mt-0 mb-5 py-4 pr-4 pl-8 border-l-4 border-[var(--brandColor)] rounded-md text-black/60 italic shadow-sm bg-white',
    code: 'px-1.5 py-0.5 rounded text-sm font-mono bg-gray-100 text-gray-800',
    'code-inline': 'px-1.5 py-0.5 rounded text-sm font-mono bg-gray-100 text-gray-800',
    pre: 'mt-0 mb-5 p-4 rounded-lg overflow-x-auto bg-gray-900 text-gray-100 shadow-inner',
    ul: 'mt-0 mb-5 pl-[1em] leading-8 text-[16px] text-gray-800',
    ol: 'mt-0 mb-5 pl-[1em] leading-8 text-[16px] text-gray-800',
    li: '',
    strong: 'font-bold text-gray-900',
    em: 'italic text-gray-700',
    del: 'line-through text-gray-500',
    hr: 'my-8 border-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent',
    a: 'text-[#576b95] no-underline',
    img: 'w-full h-auto my-5 rounded-lg shadow-md',
    table: 'w-full my-5 border-separate border-spacing-0 text-[15px] rounded-lg shadow-md overflow-hidden text-gray-800',
    thead: 'bg-[var(--brandColor)] text-white',
    th: 'border border-gray-300 px-3 py-2 text-left font-bold',
    td: 'border border-gray-300 px-4 py-2',
  },
  meta: {
    presetKey: 'grace',
    presetName: '优雅',
    description: '更柔和的色彩与节奏，适合观点表达和品牌调性内容。',
    locked: true,
  },
}

const simplePresetConfig = {
  global: {
    themeColor: '#111827',
    fontFamily: 'system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif',
    baseFontSize: 'base',
    codeTheme: 'light',
  },
  variables: {
    brandColor: '#111827',
    accentColor: '#f9fafb',
    textColor: '#111827',
  },
  styles: {
    h1: 'table mx-auto px-4 py-2 border-b-2 border-[var(--brandColor)] text-[22px] font-bold text-gray-900 mt-8 mb-5 text-center drop-shadow-[1px_1px_3px_rgba(0,0,0,0.05)]',
    h2: 'table mx-auto px-5 py-1 rounded-[8px_24px_8px_24px] text-[21px] font-bold mt-12 mb-8 text-white bg-[var(--brandColor)] shadow-sm text-center',
    h3: 'pl-3 pr-2 py-1 border-l-4 border-l-[var(--brandColor)] border-r border-b border-t border-black/10 rounded-md text-[19px] leading-[2.2] font-semibold text-gray-900 mt-8 mb-3 bg-[color-mix(in_srgb,var(--brandColor)_8%,transparent)]',
    h4: 'text-[18px] font-semibold text-gray-900 mt-7 mb-2',
    h5: 'text-[16px] font-semibold text-gray-900 mt-6 mb-2',
    h6: 'text-[16px] font-semibold text-gray-900 mt-6 mb-2',
    p: 'mt-0 mb-5 mx-2 leading-8 tracking-[0.08em] text-[16px] text-gray-800',
    blockquote: 'mt-0 mb-5 py-4 pr-4 pl-8 text-black/60 italic border-y border-r border-black/10 border-l-4 border-[var(--brandColor)] bg-white',
    code: 'font-mono text-sm bg-gray-100 px-1.5 py-0.5 rounded text-gray-700',
    'code-inline': 'font-mono text-sm bg-gray-100 px-1.5 py-0.5 rounded text-gray-700',
    pre: 'mt-0 mb-4 p-4 rounded border border-black/10 bg-gray-100 text-gray-800 overflow-x-auto',
    ul: 'mt-0 mb-4 pl-[1em] leading-8 text-[16px] text-gray-800',
    ol: 'mt-0 mb-4 pl-[1em] leading-8 text-[16px] text-gray-800',
    li: '',
    strong: 'font-semibold text-gray-900',
    em: 'italic text-gray-700',
    del: 'line-through text-gray-500',
    hr: 'my-8 border-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent',
    a: 'text-[#576b95] no-underline',
    img: 'max-w-full h-auto my-4 rounded-lg border border-black/10',
    table: 'w-full my-4 border-collapse text-[15px] text-gray-800',
    thead: 'bg-[var(--brandColor)] text-white',
    th: 'border border-gray-200 px-3 py-2 text-left font-semibold',
    td: 'border border-gray-200 px-3 py-2',
  },
  meta: {
    presetKey: 'simple',
    presetName: '简洁',
    description: '弱化装饰，保留核心排版关系，适合知识密集型内容。',
    locked: true,
  },
}

const sportsPresetConfig = {
  global: {
    themeColor: '#00A968',
    fontFamily: 'system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif',
    baseFontSize: 'base',
    codeTheme: 'light',
  },
  variables: {
    brandColor: '#00A968',
    accentColor: '#f0faf5',
    textColor: '#2c2c2c',
  },
  styles: {
    // 全宽 pill 渐变背景，白字居中
    h1: 'block px-6 py-3 rounded-[50px] bg-gradient-to-r from-[#00A968] via-[#008A56] to-[#00A968] text-white text-[22px] font-bold mt-9 mb-5 text-center tracking-[0.12em] leading-[1.4] shadow-[0_8px_20px_rgba(0,169,104,0.3)] uppercase',
    // 左实线（品牌绿）+ 右侧圆角 + 预计算微背景色（避免 rgba 逗号问题）
    // rgba(0,169,104,0.05)→#F2FBF7  rgba(56,198,244,0.05)→#F5FCFE
    h2: 'pl-4 pr-4 py-[0.4em] border-l-4 [border-left-style:solid] border-l-[var(--brandColor)] bg-gradient-to-r from-[#F2FBF7] to-[#F5FCFE] text-[20px] font-semibold text-[var(--brandColor)] mt-10 mb-4 rounded-[0_12px_12px_0] tracking-[0.06em] leading-[1.4] shadow-[0_3px_8px_rgba(0,169,104,0.12)] uppercase',
    // rgba(255,102,0,0.05)→#FFFAF7  rgba(0,169,104,0.05)→#F2FBF7
    h3: 'pl-5 pr-4 py-[0.4em] border-l-4 [border-left-style:solid] border-l-[#FF6600] bg-gradient-to-r from-[#FFFAF7] to-[#F2FBF7] text-[18px] font-semibold text-[var(--brandColor)] mt-8 mb-3 rounded-[0_25px_25px_0] tracking-[0.08em] leading-[1.4]',
    h4: 'text-[17px] font-semibold text-[var(--brandColor)] mt-7 mb-2 tracking-[0.04em]',
    h5: 'text-[16px] font-semibold text-[var(--brandColor)] mt-6 mb-2',
    h6: 'text-[15px] font-semibold text-[var(--brandColor)] mt-5 mb-2',
    p: 'mt-0 mb-5 mx-1 leading-[1.8] tracking-[0.02em] text-[15px] text-[#2c2c2c] text-justify',
    // 左实线橙色（渐变顶端色），浅灰背景，右圆角（border-image 微信不支持，改用实色）
    blockquote: 'mt-0 mb-6 py-5 pr-6 pl-6 border-l-[5px] [border-left-style:solid] border-l-[#FF6600] bg-[#f8f8f8] rounded-[0_8px_8px_0] text-[#3c3c3e]',
    // 行内代码：预计算绿蓝渐变背景（rgba→hex 避免逗号解析问题）
    // rgba(0,169,104,0.1)→#E6F6F0  rgba(56,198,244,0.1)→#EBF9FE
    code: 'font-mono text-[90%] text-[var(--brandColor)] bg-gradient-to-br from-[#E6F6F0] to-[#EBF9FE] px-1.5 py-0.5 rounded',
    'code-inline': 'font-mono text-[90%] text-[var(--brandColor)] bg-gradient-to-br from-[#E6F6F0] to-[#EBF9FE] px-1.5 py-0.5 rounded',
    // 白底代码块，顶部品牌绿实线（border-image 改为 solid，避免微信不支持）
    pre: 'mt-0 mb-6 p-5 rounded-lg bg-white shadow-xl overflow-x-auto text-gray-800 border-t-[3px] [border-top-style:solid] border-t-[var(--brandColor)]',
    ul: 'mt-0 mb-5 list-none p-0 leading-[1.8] text-[15px] text-[#2c2c2c]',
    ol: 'mt-0 mb-5 list-none p-0 leading-[1.8] text-[15px] text-[#2c2c2c]',
    li: 'my-[0.6em] leading-[1.8]',
    // 微信不支持 background-clip: text，改用实色（避免 color:transparent 导致不可见）
    strong: 'font-bold text-[var(--brandColor)]',
    em: 'italic font-medium text-[var(--brandColor)]',
    del: 'line-through text-gray-400',
    // 三色彩虹分割线（实色渐变，渐变位置变量已在 TW_INTERNAL_DEFAULTS 中补全）
    hr: 'my-12 border-0 h-[3px] bg-gradient-to-r from-[#FF6600] via-[#00A968] to-[#38C6F4]',
    a: 'text-[#576b95] no-underline',
    img: 'max-w-full h-auto my-4 rounded-xl shadow-lg',
    // 去掉 gradient border-box（微信不支持 background-clip: border-box），改用实色边框
    table: 'w-full my-6 border-collapse rounded-xl overflow-hidden border-2 border-[var(--brandColor)] shadow-lg text-[15px] text-[#2c2c2c]',
    // 橙-绿预计算渐变表头（rgba→hex）
    thead: 'bg-gradient-to-r from-[#FFF0E6] to-[#E6F6F0]',
    // border-[rgba(255,102,0,0.2)]→#FFE0CC
    th: 'px-4 py-3 text-left font-bold text-[var(--brandColor)] border-b-2 border-[#FFE0CC] uppercase tracking-[0.04em] text-[13px]',
    // border-black/[0.08]→#EBEBEB
    td: 'px-4 py-2.5 border-b border-[#EBEBEB] text-[#2c2c2c]',
  },
  meta: {
    presetKey: 'sports',
    presetName: '运动风',
    description: '活力动感风格，橙绿双色渐变点缀，充满能量与运动感。',
    locked: true,
  },
}

const warmPresetConfig = {
  global: {
    themeColor: '#C86442',
    fontFamily: "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei', Arial, sans-serif",
    baseFontSize: 'base',
    codeTheme: 'light',
  },
  variables: {
    brandColor: '#C86442',
    accentColor: '#fdf4ef',
    textColor: '#222222',
  },
  styles: {
    // 全宽砖红背景，白字居中，圆角，暖阴影
    h1: 'block mx-2 px-[1.5em] py-[0.8em] bg-[var(--brandColor)] text-white text-[22px] font-bold mt-9 mb-5 text-center rounded-[8px] shadow-[0_2px_8px_rgba(200,100,66,0.2)] leading-[1.2]',
    // 左实线 + 底虚线，均为 brandColor
    h2: 'mt-10 mb-3 mx-2 pl-3 pb-[0.5em] border-l-4 [border-left-style:solid] border-l-[var(--brandColor)] border-b [border-bottom-style:dashed] border-b-[var(--brandColor)] text-[20px] font-bold text-[#3f3f3f] leading-[1.2]',
    h3: 'mt-8 mb-2 mx-2 pl-3 pb-[0.4em] border-l-4 [border-left-style:solid] border-l-[var(--brandColor)] border-b [border-bottom-style:dashed] border-b-[var(--brandColor)] text-[18px] font-bold text-[#3f3f3f] leading-[1.2]',
    h4: 'text-[17px] font-bold text-[var(--brandColor)] mt-7 mb-2 leading-[1.3]',
    h5: 'text-[16px] font-bold text-[var(--brandColor)] mt-6 mb-2',
    h6: 'text-[15px] font-bold text-[var(--brandColor)] mt-6 mb-2',
    // 中文横排最优设置：两端对齐，1.75 行高，字间距
    p: 'mt-0 mb-5 mx-2 leading-[1.75] tracking-[0.1em] text-[15px] text-[#222222] text-justify break-words',
    // 左边框，暖灰背景，斜体，轻阴影
    blockquote: 'mt-0 mb-6 py-4 pr-4 pl-8 border-l-4 [border-left-style:solid] border-l-[var(--brandColor)] rounded-[6px] bg-[#f7f7f7] text-[rgba(0,0,0,0.6)] italic shadow-[0_4px_6px_rgba(0,0,0,0.05)]',
    // 行内代码：品牌色文字 + 10% 品牌色背景（#FAF0EC = rgba(200,100,66,0.1) on white）
    code: 'font-mono text-[90%] text-[var(--brandColor)] bg-[#FAF0EC] px-1.5 py-0.5 rounded',
    'code-inline': 'font-mono text-[90%] text-[var(--brandColor)] bg-[#FAF0EC] px-1.5 py-0.5 rounded',
    // 代码块：暖白底，顶部品牌色实线，轻阴影
    pre: 'mt-0 mb-5 mx-2 p-[1.2em] bg-[#fafaf9] rounded-[8px] overflow-x-auto text-[14px] leading-[1.5] border-t-[3px] [border-top-style:solid] border-t-[var(--brandColor)] shadow-[0_2px_8px_rgba(200,100,66,0.1)]',
    ul: 'mt-0 mb-5 mx-2 pl-[1.2em] leading-[1.75] text-[15px] text-[#3f3f3f]',
    ol: 'mt-0 mb-5 mx-2 pl-[1.2em] leading-[1.75] text-[15px] text-[#3f3f3f]',
    li: 'my-[0.5em]',
    strong: 'font-bold text-[var(--brandColor)]',
    em: 'italic text-[#666666]',
    del: 'line-through text-gray-400',
    // 渐变淡入淡出分割线：from/to 用 transparent，via 用 hex+alpha 表示 60% 品牌色
    hr: 'my-8 border-0 h-px bg-gradient-to-r from-transparent via-[#C8644299] to-transparent',
    a: 'text-[#576b95] no-underline',
    img: 'max-w-full h-auto my-4 rounded',
    table: 'w-full my-4 border-collapse text-[15px]',
    // 暖白灰表头
    thead: 'bg-[#f6f6f4]',
    th: 'border border-[#e5e5e5] px-3 py-2 text-left font-bold',
    td: 'border border-[#e5e5e5] px-3 py-2',
  },
  meta: {
    presetKey: 'warm',
    presetName: '温暖',
    description: '微信经典温暖风格，砖红色调，舒适易读，贴近原生公众号体验。',
    locked: true,
  },
}

const elegantGreenPresetConfig = {
  global: {
    themeColor: '#2BAE85',
    fontFamily: 'system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif',
    baseFontSize: 'base',
    codeTheme: 'androidstudio',
  },
  variables: {
    brandColor: '#2BAE85',
    accentColor: '#F4FBF9',
    textColor: '#2c2c2c',
  },
  styles: {
    // H1: 左粗实线（5px）+ 底细实线，品牌翡翠绿
    h1: 'pl-2 pb-1 text-[26px] font-bold text-[var(--brandColor)] mt-0 mb-7 leading-[1.4] tracking-[0.5px] border-l-[5px] [border-left-style:solid] border-l-[var(--brandColor)] border-b [border-bottom-style:solid] border-b-[var(--brandColor)]',
    // H2: 左双实线（4px double），品牌绿
    h2: 'pl-[10px] text-[22px] font-semibold text-[var(--brandColor)] mt-9 mb-6 leading-[1.4] border-l-4 [border-left-style:double] border-l-[var(--brandColor)]',
    // H3: 左细实线（3px），品牌绿
    h3: 'pl-[10px] text-[19px] font-semibold text-[var(--brandColor)] mt-7 mb-5 leading-[1.4] border-l-[3px] [border-left-style:solid] border-l-[var(--brandColor)]',
    h4: 'pl-2 text-[17px] font-semibold text-[var(--brandColor)] mt-6 mb-2',
    h5: 'text-[16px] font-semibold text-[var(--brandColor)] mt-5 mb-2',
    h6: 'text-[15px] font-medium text-[var(--brandColor)] mt-4 mb-2',
    p: 'mt-0 mb-5 leading-[1.75] text-[16px] text-[#2c2c2c]',
    // 右圆角，淡绿渐变背景（rgba预计算hex），左实线
    // rgba(43,174,133,0.05)→#F4FBF9，rgba(43,174,133,0.02)→#FBFDFD
    blockquote: 'my-1 pt-4 pb-1 px-2 text-[15px] text-[#555555] bg-gradient-to-br from-[#F4FBF9] to-[#FBFDFD] border-l-[3px] [border-left-style:solid] border-l-[var(--brandColor)] rounded-[0_8px_8px_0] leading-[1.8]',
    // 行内代码：品牌绿文字 + 淡绿背景
    code: 'font-mono text-[90%] text-[var(--brandColor)] bg-[#F4FBF9] px-1.5 py-0.5 rounded',
    'code-inline': 'font-mono text-[90%] text-[var(--brandColor)] bg-[#F4FBF9] px-1.5 py-0.5 rounded',
    // 代码块：深色背景（#282c34），轻阴影
    pre: 'mt-5 mb-5 p-5 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.15)] bg-[#282c34] overflow-x-auto text-gray-100',
    ul: 'mt-2 mb-5 list-none p-0 leading-[1.75] text-[16px] text-[#2c2c2c]',
    ol: 'mt-2 mb-5 list-none p-0 leading-[1.75] text-[16px] text-[#2c2c2c]',
    li: 'my-2 leading-[1.8]',
    strong: 'font-semibold text-[var(--brandColor)]',
    em: 'italic text-[#444444]',
    del: 'line-through text-gray-500',
    // 居中渐变分割线，宽50%，翡翠绿淡入淡出（rgba(43,174,133,0.3)→#BFE7DA）
    hr: 'my-10 border-0 h-px w-1/2 mx-auto bg-gradient-to-r from-transparent via-[#BFE7DA] to-transparent',
    a: 'text-[#576b95] no-underline',
    img: 'max-w-full h-auto my-4 rounded-lg shadow-md',
    table: 'w-full my-9 border-collapse text-[15px] shadow-sm',
    // 渐变表头（rgba预计算hex）：rgba(43,174,133,0.15)→#DFF3ED，rgba(43,174,133,0.08)→#EEF9F5
    thead: 'bg-gradient-to-b from-[#DFF3ED] to-[#EEF9F5]',
    // 顶部3px品牌色实线 + 全边框（rgba(43,174,133,0.2)→#D5EFE7）
    th: 'px-7 py-5 text-left font-semibold text-[12px] tracking-[1.2px] uppercase text-[var(--brandColor)] border border-[#D5EFE7] border-t-[3px] [border-top-style:solid] border-t-[var(--brandColor)]',
    // 单元格边框：rgba(43,174,133,0.12)→#E6F5F0
    td: 'px-7 py-5 text-[15px] leading-[1.75] bg-white text-[#3a3a3a] border border-[#E6F5F0]',
  },
  meta: {
    presetKey: 'elegant-green',
    presetName: '精致·翡翠绿',
    description: '层次丰富，左边框递减 + 渐变背景，适合品牌内容与知识型文章。',
    locked: true,
  },
}

const liguanPresetConfig = {
  global: {
    themeColor: '#994324',
    fontFamily: "'PingFang SC', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Hiragino Sans GB', 'Microsoft YaHei UI', 'Microsoft YaHei', Arial, sans-serif",
    baseFontSize: 'base',
    codeTheme: 'light',
  },
  variables: {
    brandColor: '#994324',
    accentColor: '#f8f5f2',
    textColor: '#2f2f2f',
  },
  styles: {
    // H1: 居中，底部实线，砖红色
    h1: 'table mx-auto px-4 py-1 border-b-2 border-[var(--brandColor)] text-[22px] font-bold text-gray-900 mt-8 mb-5 text-center',
    // H2 容器：为带序号结构提供左缩进和下内边距；不带序号时退化为普通左边框样式
    h2: 'block pl-[19px] pb-[11px] mt-14 mb-6',
    // h2-num: 大号锈红序号，单独占一行
    'h2-num': 'block text-[40px] text-[var(--brandColor)] font-bold leading-[1.05]',
    // h2-title: 铜金底边框的标题文字
    'h2-title': 'inline text-[18px] pt-[6px] text-[#2F2F2F] font-bold leading-[25px] border-b [border-bottom-style:solid] border-b-[#B08564]',
    // H3: 左边框
    h3: 'pl-2 border-l-[3px] [border-left-style:solid] border-l-[var(--brandColor)] text-[18px] leading-[1.3] font-bold text-gray-900 mt-8 mb-3',
    h4: 'text-[16px] font-bold text-[var(--brandColor)] mt-7 mb-2',
    h5: 'text-[16px] font-bold text-[var(--brandColor)] mt-6 mb-2',
    h6: 'text-[15px] font-bold text-[var(--brandColor)] mt-6 mb-2',
    p: 'mt-0 mb-5 mx-2 leading-[1.9] tracking-[0.04em] text-[15px] text-[#2f2f2f]',
    blockquote: 'mt-0 mb-5 py-3 pr-4 pl-5 border-l-4 [border-left-style:solid] border-l-[var(--brandColor)] rounded text-[#2f2f2f] bg-[#f8f5f2]',
    code: 'font-mono text-[90%] text-[var(--brandColor)] bg-[#FAF0EC] px-1.5 py-0.5 rounded',
    'code-inline': 'font-mono text-[90%] text-[var(--brandColor)] bg-[#FAF0EC] px-1.5 py-0.5 rounded',
    pre: 'mt-0 mb-5 mx-2 p-[1.2em] bg-[#fafaf9] rounded-[8px] overflow-x-auto text-[14px] leading-[1.5]',
    ul: 'mt-0 mb-5 mx-2 pl-[1.2em] leading-[1.9] text-[15px] text-[#2f2f2f]',
    ol: 'mt-0 mb-5 mx-2 pl-[1.2em] leading-[1.9] text-[15px] text-[#2f2f2f]',
    li: 'my-1',
    strong: 'font-bold text-[var(--brandColor)]',
    em: 'italic text-[#666666]',
    del: 'line-through text-gray-400',
    // 铜金渐变分割线
    hr: 'my-8 border-0 h-px bg-gradient-to-r from-transparent via-[#B08564] to-transparent',
    a: 'text-[#576b95] no-underline',
    img: 'max-w-full h-auto my-4 rounded',
    table: 'w-full my-4 border-collapse text-[15px]',
    thead: 'bg-[#f8f5f2]',
    th: 'border border-[#e5e5e5] px-3 py-2 text-left font-bold text-[var(--brandColor)]',
    td: 'border border-[#e5e5e5] px-3 py-2',
  },
  meta: {
    presetKey: 'liguan',
    presetName: '理观',
    description: '锈红铜金配色，大号序号二级标题（## 01 标题），适合地理、自然、人文类深度长文。',
    locked: true,
    numberedH2: true,
  },
}

const SEED_TEMPLATES = [
  {
    id: 'preset-classic',
    name: '预置 · 经典',
    config: classicPresetConfig,
    isDefault: true,
  },
  {
    id: 'preset-grace',
    name: '预置 · 优雅',
    config: gracePresetConfig,
    isDefault: false,
  },
  {
    id: 'preset-simple',
    name: '预置 · 简洁',
    config: simplePresetConfig,
    isDefault: false,
  },
  {
    id: 'preset-sports',
    name: '预置 · 运动风',
    config: sportsPresetConfig,
    isDefault: false,
  },
  {
    id: 'preset-warm',
    name: '预置 · 温暖',
    config: warmPresetConfig,
    isDefault: false,
  },
  {
    id: 'preset-elegant-green',
    name: '预置 · 精致翡翠绿',
    config: elegantGreenPresetConfig,
    isDefault: false,
  },
  {
    id: 'preset-liguan',
    name: '预置 · 理观',
    config: liguanPresetConfig,
    isDefault: false,
  },
]

async function seed() {
  const db = getDb()

  await db.delete(templates)
  console.log('[reset] 已清空模板表')

  for (const tpl of SEED_TEMPLATES) {
    await db
      .insert(templates)
      .values({
        id: tpl.id,
        name: tpl.name,
        config: tpl.config,
        isDefault: tpl.isDefault,
      })
      .onConflictDoUpdate({
        target: templates.id,
        set: {
          name: tpl.name,
          config: tpl.config,
          isDefault: tpl.isDefault,
        },
      })
    console.log(`[upsert] 模板已同步：${tpl.id}`)
  }

  console.log('✅ 模板种子数据完成')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ 种子数据失败:', err)
  process.exit(1)
})
