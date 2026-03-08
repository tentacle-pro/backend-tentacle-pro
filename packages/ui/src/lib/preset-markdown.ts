export interface PresetMarkdown {
  id: string
  label: string
  content: string
}

const DEFAULT_TEST_MARKDOWN = `# WOA-Layout 排版引擎测试

这是一段普通的段落文本，用于测试基础段落样式。段落应该包含合适的行高、字体大小和颜色配置。这里有一些**粗体文字**和*斜体文字*，以及~~删除线文字~~。

## 功能特性介绍

通过 **API 驱动 + 模板化配置** 的方式，实现 Markdown 到微信公众号样式 HTML 的工业化转换。

### 样式配置能力

支持对所有 Markdown 标签进行精细化样式控制，包括但不限于标题、段落、列表、引用等元素。

---

## 列表元素测试

### 无序列表

- 第一项：核心转换引擎
- 第二项：实时预览功能
- 第三项：素材库管理
  - 嵌套子项 1：支持图片上传
  - 嵌套子项 2：生成永久 URL

### 有序列表

1. 第一步：创建模板
2. 第二步：配置样式
3. 第三步：上传素材
4. 第四步：实时预览
5. 第五步：保存并获取 templateId

---

## 引用块测试

> 这是一段引用文字，通常用于展示重要的提示信息或引用他人的观点。
>
> **引用中也可以使用粗体**和*斜体*等强调样式。

---

## 代码测试

### 行内代码

使用 \`const result = await fetch('/api/convert')\` 调用转换接口。

### 代码块

\`\`\`typescript
interface Template {
  id: string;
  name: string;
  styles: Record<string, string>;
}
\`\`\`

---

## 链接和图片

访问 [Bun 官方文档](https://bun.sh) 了解更多。

---

## 结语

**加粗强调**：请确保所有样式都能正确转换为内联样式！
`

const OVERSEAS_UNICORN_SKELETON = `# 当人读不懂 AI 代码，Traversal 如何做企业运维的 AI 医生？

作者：Haozhen  
编辑：Cage

导语第一段：用 2~3 句概括这家公司解决了什么痛点，以及为什么是现在。

---

## 01. 为什么看好 Traversal？

### • 行业痛点明确

说明传统方案的局限，以及 AI Coding 带来的复杂度提升。

### • 技术壁垒较高，商业落地效果显著

补充 1~2 个案例和量化结果，强化结论。

---

## 02. 代码运维是长期存在的明确痛点

1. 数据分散在多个系统，排障链路长。
2. 数据量巨大，人工分析成本高。
3. 事故响应依赖高协同，效率低。

---

## 结论

1. 今天的判断（短期）
2. 中期验证指标（1~3 个）
3. 风险与反证条件
`

export const PRESET_MARKDOWNS: PresetMarkdown[] = [
  { id: 'default-test', label: '默认测试文档', content: DEFAULT_TEST_MARKDOWN },
  { id: 'overseas-unicorn-skeleton', label: '海外独角兽：7章骨架', content: OVERSEAS_UNICORN_SKELETON },
]

export const DEFAULT_MARKDOWN = PRESET_MARKDOWNS[0]?.content ?? ''
