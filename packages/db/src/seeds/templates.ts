/**
 * 种子数据：平台内置排版模板
 * 运行方式：bun packages/db/src/seeds/templates.ts
 */
import { getDb } from '../client'
import { templates } from '../schema'

const overseasDividerClass = `bg-[url(@bg(divider))]`

const defaultConfig = {
  global: {
    themeColor: '#2563eb',
    fontFamily: 'system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif',
    baseFontSize: 'base',
    codeTheme: 'androidstudio',
  },
  variables: {
    brandColor: '#333333',
    accentColor: '#f5f5f5',
    textColor: '#333333',
  },
  styles: {
    h1: 'text-3xl font-bold text-center my-6 pb-2 border-b border-gray-300',
    h2: 'text-2xl font-bold mt-8 mb-4 pb-1 border-l-4 border-gray-800 pl-3',
    h3: 'text-xl font-bold mt-6 mb-3',
    h4: 'text-lg font-bold mt-4 mb-2',
    h5: 'text-base font-bold mt-3 mb-2',
    h6: 'text-sm font-bold mt-2 mb-1',
    p: 'my-4 leading-relaxed text-base',
    blockquote: 'border-l-4 border-gray-400 pl-4 italic text-gray-600 bg-gray-50 py-2 my-4',
    code: 'bg-gray-100 px-2 py-1 rounded text-sm text-red-600 font-mono',
    'code-inline': 'bg-gray-100 px-2 py-1 rounded text-sm text-red-600 font-mono',
    pre: 'bg-gray-900 text-gray-100 p-4 rounded my-4 overflow-x-auto',
    ul: 'my-4 list-disc list-outside pl-10',
    ol: 'my-4 list-decimal list-outside pl-10',
    li: 'my-2',
    strong: 'font-bold',
    em: 'italic',
    del: 'line-through text-gray-500',
    hr: 'border-0 h-px bg-gray-300 my-8',
    a: 'text-blue-600 underline',
    img: 'max-w-full h-auto my-4',
    table: 'w-full border-collapse my-4',
    thead: 'bg-gray-100',
    th: 'border border-gray-300 px-4 py-2 text-left font-bold',
    td: 'border border-gray-300 px-4 py-2',
  },
}

const overseasUnicornConfig = {
  global: {
    themeColor: '#b76e79',
    fontFamily: 'system-ui, -apple-system, PingFang SC, Microsoft YaHei, sans-serif',
    baseFontSize: 'base',
    codeTheme: 'androidstudio',
  },
  variables: {
    brandColor: '#b76e79',
    accentColor: '#f8f5f6',
    textColor: '#1f2937',
  },
  styles: {
    h1: 'text-3xl font-bold text-center mt-6 mb-8 pb-3 border-b border-gray-300 text-gray-900',
    h2: 'text-2xl font-bold mt-10 mb-4 pl-3 border-l-4 border-[var(--brandColor)] text-gray-900',
    h3: 'text-xl font-bold mt-7 mb-3 text-gray-900',
    h4: 'text-lg font-bold mt-6 mb-2 text-gray-900',
    h5: 'text-base font-bold mt-5 mb-2 text-gray-900',
    h6: 'text-sm font-bold mt-4 mb-2 text-gray-900',
    p: 'my-4 leading-8 text-[16px] text-gray-800',
    blockquote: 'my-5 pl-4 py-2 border-l-4 border-[var(--brandColor)] bg-gray-50 text-gray-700 italic',
    code: 'px-1.5 py-0.5 rounded text-sm font-mono bg-gray-100 text-gray-800',
    'code-inline': 'px-1.5 py-0.5 rounded text-sm font-mono bg-gray-100 text-gray-800',
    pre: 'my-5 p-4 rounded-lg overflow-x-auto bg-gray-900 text-gray-100',
    ul: 'my-4 list-disc list-outside pl-10',
    ol: 'my-4 list-decimal list-outside pl-10',
    li: 'my-2 leading-8 text-[16px] text-gray-800',
    strong: 'font-bold text-gray-900',
    em: 'italic text-gray-700',
    del: 'line-through text-gray-500',
    hr: `my-[40px] border-0 h-[24px] w-full ${overseasDividerClass} bg-no-repeat bg-center bg-[length:100%_100%]`,
    a: 'underline text-[var(--brandColor)]',
    img: 'w-full h-auto my-5 rounded-xl shadow-sm',
    table: 'w-full my-5 border-collapse text-[15px]',
    thead: 'bg-gray-100',
    th: 'border border-gray-300 px-3 py-2 text-left font-bold',
    td: 'border border-gray-300 px-3 py-2',
  },
}

const SEED_TEMPLATES = [
  {
    id: 'default-simple',
    name: '默认简约风格',
    config: defaultConfig,
    isDefault: true,
  },
  {
    id: 'overseas-unicorn',
    name: '海外独角兽',
    config: overseasUnicornConfig,
    isDefault: false,
  },
]

async function seed() {
  const db = getDb()

  for (const tpl of SEED_TEMPLATES) {
    await db.insert(templates).values({
      id: tpl.id,
      name: tpl.name,
      config: tpl.config,
      isDefault: tpl.isDefault,
    }).onConflictDoUpdate({
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
