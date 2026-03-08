import { test, expect, describe } from 'bun:test'
import { convertMarkdownToHTML } from './convert'
import type { TemplateConfig } from './types'

const testConfig: TemplateConfig = {
  variables: {
    brandColor: '#007aff',
    textColor: '#333333',
  },
  styles: {
    h1: 'text-2xl font-bold text-center',
    h3: 'text-lg font-bold',
    p: 'my-4 leading-relaxed',
    ul: 'my-4 list-disc list-outside',
    ol: 'my-4 list-decimal list-outside',
    li: 'my-2',
    strong: 'font-bold text-[var(--brandColor)]',
    code: 'bg-gray-100 px-2 py-1 rounded',
    hr: 'border-0 h-px bg-gray-300 my-8',
    a: 'text-blue-600 underline',
    img: 'max-w-full h-auto my-4',
    table: 'w-full border-collapse my-4',
    thead: 'bg-gray-100',
    th: 'border border-gray-300 px-4 py-2 text-left font-bold',
    td: 'border border-gray-300 px-4 py-2',
  },
}

describe('packages/render — convertMarkdownToHTML', () => {
  test('基础段落转换', async () => {
    const result = await convertMarkdownToHTML('This is a paragraph.', testConfig)
    expect(result.html).toContain('<p')
    expect(result.html).toContain('style=')
    expect(result.html).toContain('This is a paragraph')
  })

  test('标题转换', async () => {
    const result = await convertMarkdownToHTML('# Hello World', testConfig)
    expect(result.html).toContain('<h1')
    expect(result.html).toContain('style=')
    expect(result.html).toContain('Hello World')
  })

  test('粗体文字转换', async () => {
    const result = await convertMarkdownToHTML('**Bold Text**', testConfig)
    expect(result.html).toContain('<strong')
    expect(result.html).toContain('Bold Text')
  })

  test('行内代码转换', async () => {
    const result = await convertMarkdownToHTML('Use `const x = 1` in your code.', testConfig)
    expect(result.html).toContain('<code')
    expect(result.html).toContain('const x = 1')
  })

  test('CSS 变量替换', async () => {
    const result = await convertMarkdownToHTML('**Brand Color**', testConfig)
    const hasColor =
      result.html.includes('#007aff') ||
      result.html.includes('rgb(0 122 255') ||
      result.html.includes('rgb(0, 122, 255)')
    expect(hasColor).toBe(true)
  })

  test('复杂 Markdown 结构', async () => {
    const md = `# Title\n\nThis is a **paragraph** with \`code\`.\n\n## Subtitle\n\nAnother paragraph.`
    const result = await convertMarkdownToHTML(md, testConfig)
    expect(result.html).toContain('<h1')
    expect(result.html).toContain('<h2')
    expect(result.html).toContain('<p')
    expect(result.html).toContain('<strong')
    expect(result.html).toContain('<code')
  })

  test('素材别名预处理 — 已配置别名', async () => {
    const configWithAssets: TemplateConfig = {
      ...testConfig,
      assets: { divider: 'https://example.com/divider.png' },
    }
    const result = await convertMarkdownToHTML('{{asset:divider}}', configWithAssets)
    expect(result.html).toContain('https://example.com/divider.png')
    expect(result.warnings).toHaveLength(0)
  })

  test('素材别名预处理 — 未配置别名产生警告', async () => {
    const result = await convertMarkdownToHTML('{{asset:unknown}}', testConfig)
    expect(result.warnings.some((w) => w.includes('unknown'))).toBe(true)
  })

  test('外链收集到文末参考链接', async () => {
    const result = await convertMarkdownToHTML(
      '[OpenAI](https://openai.com) 是一家 AI 公司。',
      testConfig
    )
    expect(result.html).toContain('参考链接')
    expect(result.html).toContain('https://openai.com')
  })

  test('返回结构包含 html 和 warnings 字段', async () => {
    const result = await convertMarkdownToHTML('hello', testConfig)
    expect(typeof result.html).toBe('string')
    expect(Array.isArray(result.warnings)).toBe(true)
  })
})
