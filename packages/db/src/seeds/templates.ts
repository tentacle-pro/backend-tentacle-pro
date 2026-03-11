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
]

async function seed() {
  const db = getDb()

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
