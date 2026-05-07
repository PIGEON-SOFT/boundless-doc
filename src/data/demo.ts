import { DocumentData } from '../types';

const demoDocument: DocumentData = {
  id: 'demo-doc-1',
  title: '无界文档 π — 活文档演示',
  blocks: [
    {
      id: 'block-1',
      type: 'markdown',
      content: `# 欢迎来到无界文档 π

这不是一份普通的文档。在这里，**文字、代码、数据和AI**融为一体。

## 核心理念

- 📝 **富文本** — 所见即所得的编辑体验
- ⚡ **可执行代码** — 在文档中直接运行 JavaScript / Python
- 📊 **活数据图表** — 代码输出自动驱动可视化
- 🤖 **AI 原生** — 内置AI助手，理解文档上下文

> 文档的尽头，是没有文档。

---

下面是一个可执行的代码块，试试点击 **运行** 按钮 👇`,
    },
    {
      id: 'block-2',
      type: 'code',
      language: 'javascript',
      content: `// 生成销售数据 — 运行后数据将流入下方图表
const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const sales = months.map(() => Math.floor(Math.random() * 1000 + 500));
const costs = sales.map(s => Math.floor(s * (0.4 + Math.random() * 0.3)));
const profit = sales.map((s, i) => s - costs[i]);

// 输出结构化数据（会被图表块读取）
return {
  labels: months,
  series: [
    { name: '销售额', data: sales },
    { name: '成本', data: costs },
    { name: '利润', data: profit }
  ]
};`,
    },
    {
      id: 'block-3',
      type: 'chart',
      content: '',
      chartType: 'bar',
      dataSourceBlockId: 'block-2',
    },
    {
      id: 'block-4',
      type: 'markdown',
      content: `## Python 也可以运行

无界文档内置了 **Pyodide** 引擎，可以直接在浏览器中运行 Python 代码。
试试下面的 Python 代码块：`,
    },
    {
      id: 'block-5',
      type: 'code',
      language: 'python',
      content: `import json
import math

# 生成正弦波数据
data_points = []
for i in range(50):
    x = i * 0.2
    data_points.append({
        "x": round(x, 2),
        "sin": round(math.sin(x), 4),
        "cos": round(math.cos(x), 4)
    })

# 输出JSON（可被图表块读取）
result = {
    "labels": [p["x"] for p in data_points],
    "series": [
        {"name": "sin(x)", "data": [p["sin"] for p in data_points]},
        {"name": "cos(x)", "data": [p["cos"] for p in data_points]}
    ]
}
print(json.dumps(result))`,
    },
    {
      id: 'block-6',
      type: 'chart',
      content: '',
      chartType: 'line',
      dataSourceBlockId: 'block-5',
    },
    {
      id: 'block-7',
      type: 'markdown',
      content: `## AI 助手

下方的 AI 块可以理解整份文档的内容。你可以问它关于文档中代码、数据或内容的任何问题。`,
    },
    {
      id: 'block-8',
      type: 'ai',
      content: '',
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

export default demoDocument;
