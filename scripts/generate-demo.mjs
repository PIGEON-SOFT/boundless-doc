import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, BorderStyle,
  WidthType, ShadingType, TableLayoutType,
} from 'docx';
import * as fs from 'fs';

const ACCENT = '6C63FF';
const GRAY = '8B8D98';
const DARK = '1A1B23';

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({ heading: level, spacing: { before: 300, after: 120 }, children: [new TextRun({ text, bold: true, color: '222222' })] });
}

function body(text) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: 22, color: '444444' })] });
}

function codeBlock(lines) {
  return lines.map(line =>
    new Paragraph({
      spacing: { after: 0 },
      shading: { type: ShadingType.SOLID, color: 'F4F4F8' },
      children: [new TextRun({ text: line, font: 'Courier New', size: 20, color: '333333' })],
    })
  );
}

function createDataTable(headers, rows) {
  const headerCells = headers.map(h =>
    new TableCell({
      shading: { type: ShadingType.SOLID, color: ACCENT },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, color: 'FFFFFF', size: 20 })] })],
      width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
    })
  );

  const dataRows = rows.map(row =>
    new TableRow({
      children: row.map(cell =>
        new TableCell({
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(cell), size: 20 })] })],
        })
      ),
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [new TableRow({ children: headerCells }), ...dataRows],
  });
}

async function generate() {
  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Microsoft YaHei', size: 22 } },
      },
    },
    sections: [{
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600, after: 100 },
          children: [new TextRun({ text: '无界文档 π', size: 56, bold: true, color: ACCENT })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: '「文档的尽头，是没有文档」', size: 28, color: GRAY, italics: true })],
        }),

        // Intro
        heading('项目概述'),
        body('这份文档本身就是"无界文档"的最佳演示。当你在 Microsoft Word 中打开它，它是一份静态的 .docx 文件。但当你将它上传到无界文档平台，下面的表格将变成可交互的动态图表，代码片段将变得可执行，你还可以向AI助手询问关于文档内容的任何问题。'),
        body('一份文档，两种形态。这就是我们对"下一代文档"的定义。'),

        // Data section
        heading('季度销售数据'),
        body('以下是2024年各季度的销售数据。在无界文档平台中，这个表格将自动转化为可交互的柱状图：'),
        new Paragraph({ spacing: { after: 120 }, children: [] }),

        createDataTable(
          ['月份', '销售额(万元)', '成本(万元)', '利润(万元)'],
          [
            ['1月', '856', '412', '444'],
            ['2月', '923', '478', '445'],
            ['3月', '1045', '502', '543'],
            ['4月', '987', '467', '520'],
            ['5月', '1123', '534', '589'],
            ['6月', '1267', '598', '669'],
            ['7月', '1189', '556', '633'],
            ['8月', '1345', '623', '722'],
            ['9月', '1234', '589', '645'],
            ['10月', '1456', '678', '778'],
            ['11月', '1389', '645', '744'],
            ['12月', '1567', '712', '855'],
          ]
        ),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Second data table
        heading('产品分布', HeadingLevel.HEADING_2),
        body('各产品线的营收占比，在平台中将自动生成饼图：'),
        new Paragraph({ spacing: { after: 120 }, children: [] }),

        createDataTable(
          ['产品线', '营收(万元)', '占比'],
          [
            ['智慧教育', '4520', '35.2%'],
            ['企业通信', '3280', '25.6%'],
            ['智能硬件', '2890', '22.5%'],
            ['云服务', '2150', '16.7%'],
          ]
        ),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Code section
        heading('可执行代码'),
        body('以下代码片段在 Word 中只是纯文本，但在无界文档平台中可以直接运行并查看结果：'),
        new Paragraph({ spacing: { after: 120 }, children: [] }),

        new Paragraph({ children: [new TextRun({ text: '▸ JavaScript 数据分析', bold: true, size: 22, color: ACCENT })] }),
        ...codeBlock([
          '// 计算销售数据的统计指标',
          'const sales = [856, 923, 1045, 987, 1123, 1267, 1189, 1345, 1234, 1456, 1389, 1567];',
          'const avg = sales.reduce((a, b) => a + b) / sales.length;',
          'const max = Math.max(...sales);',
          'const min = Math.min(...sales);',
          'const growth = ((sales[11] - sales[0]) / sales[0] * 100).toFixed(1);',
          '',
          'return {',
          '  平均月销售额: avg.toFixed(0) + " 万元",',
          '  最高月份: sales.indexOf(max) + 1 + "月 (" + max + " 万元)",',
          '  最低月份: sales.indexOf(min) + 1 + "月 (" + min + " 万元)",',
          '  年增长率: growth + "%"',
          '};',
        ]),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        new Paragraph({ children: [new TextRun({ text: '▸ Python 趋势预测', bold: true, size: 22, color: ACCENT })] }),
        ...codeBlock([
          'import json, math',
          '',
          'sales = [856,923,1045,987,1123,1267,1189,1345,1234,1456,1389,1567]',
          'n = len(sales)',
          'x_mean = (n - 1) / 2',
          'y_mean = sum(sales) / n',
          '',
          '# 线性回归',
          'numerator = sum((i - x_mean) * (y - y_mean) for i, y in enumerate(sales))',
          'denominator = sum((i - x_mean) ** 2 for i in range(n))',
          'slope = numerator / denominator',
          'intercept = y_mean - slope * x_mean',
          '',
          '# 预测未来3个月',
          'predictions = [round(slope * (n + i) + intercept) for i in range(3)]',
          'print(json.dumps({"预测_1月": predictions[0], "预测_2月": predictions[1], "预测_3月": predictions[2]}))',
        ]),

        new Paragraph({ spacing: { after: 300 }, children: [] }),

        // Vision section
        heading('设计愿景'),
        body('无界文档 π 基于一个核心洞察：文档不应该是信息的终点，而应该是信息的入口。'),
        new Paragraph({ spacing: { after: 80 }, children: [] }),

        heading('核心能力', HeadingLevel.HEADING_2),
        body('• 活数据 — 文档中的表格自动识别为结构化数据，一键转化为可交互图表，数据变更时图表实时更新'),
        body('• 可执行 — 代码片段不再是死文本，支持 JavaScript/Python 在浏览器端直接运行，文档即 Playground'),
        body('• AI原生 — 内置AI助手感知全文档上下文，支持智能问答、自动摘要、内容导航'),
        body('• 无缝兼容 — 基于 .docx 标准格式，在 Word 中正常打开和编辑，在平台中获得增强能力'),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        heading('技术架构', HeadingLevel.HEADING_2),
        body('前端：React + Vite + ECharts + Pyodide'),
        body('文档解析：mammoth.js（.docx → HTML → Blocks）'),
        body('代码执行：JavaScript（Function 构造器）/ Python（Pyodide WebAssembly）'),
        body('AI能力：Claude API（支持文档上下文感知）'),
        body('数据流：Block 间单向数据流，代码输出 → 图表输入'),

        new Paragraph({ spacing: { after: 200 }, children: [] }),

        // Footer
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [
            new TextRun({ text: '— 将此文档上传至无界文档平台，体验"活"的力量 —', color: ACCENT, italics: true, size: 24 }),
          ],
        }),
      ],
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync('public/demo.docx', buffer);
  console.log('✅ demo.docx generated at public/demo.docx');
}

generate().catch(console.error);
