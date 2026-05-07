import { Block } from '../types';

interface WordTable {
  headers: string[];
  rows: string[][];
}

interface WordContent {
  paragraphs: { text: string; style: string }[];
  tables: WordTable[];
}

let idCounter = 2000;
function genId() { return `word-${idCounter++}`; }

export interface WordToBlocksResult {
  blocks: Block[];
  tableChartMap: Record<number, string>;
}

export function wordContentToBlocks(content: WordContent): WordToBlocksResult {
  const blocks: Block[] = [];
  let markdownBuffer: string[] = [];

  const flushMarkdown = () => {
    const text = markdownBuffer.join('\n').trim();
    if (text) {
      blocks.push({ id: genId(), type: 'markdown', content: text });
    }
    markdownBuffer = [];
  };

const codeStarters = ['const ', 'let ', 'var ', 'function ', 'return ', 'import ', 'def ', 'class ', 'from '];

function isCodeLine(text: string): boolean {
  const t = text.trim();
  return codeStarters.some(s => t.startsWith(s))
    || t.startsWith('//') || t.startsWith('#')
    || t.startsWith('console.') || t.startsWith('print(')
    || t.startsWith('sys.') || t.startsWith('Math.')
    || /^[a-zA-Z_]\w*\s*[=({]/.test(t)
    || /^\s*[{}\[\])]/.test(t)
    || t.includes('[📊 无界文档');
}

  for (const p of content.paragraphs) {
    const text = p.text.trim();
    if (!text || isCodeLine(text)) {
      continue;
    }

    const style = p.style?.toLowerCase() || '';
    if (style.includes('heading1') || style.includes('标题 1')) {
      flushMarkdown();
      markdownBuffer.push(`# ${text}`);
    } else if (style.includes('heading2') || style.includes('标题 2')) {
      flushMarkdown();
      markdownBuffer.push(`## ${text}`);
    } else if (style.includes('heading3') || style.includes('标题 3')) {
      flushMarkdown();
      markdownBuffer.push(`### ${text}`);
    } else if (text.startsWith('•') || text.startsWith('-') || text.startsWith('·')) {
      markdownBuffer.push(`- ${text.replace(/^[•\-·]\s*/, '')}`);
    } else {
      markdownBuffer.push(text);
    }
  }

  flushMarkdown();

  const tableChartMap: Record<number, string> = {};

  for (let ti = 0; ti < content.tables.length; ti++) {
    const table = content.tables[ti];
    const isNumeric = (s: string) => !isNaN(parseFloat(s.replace(/[,%¥$万元]/g, '')));
    const numericCols = table.headers.filter((_, i) =>
      i > 0 && table.rows.every(row => isNumeric(row[i] || '0'))
    );

    if (numericCols.length > 0) {
      const labels = table.rows.map(r => r[0]);
      const series = numericCols.map(col => {
        const colIdx = table.headers.indexOf(col);
        return {
          name: col.replace(/\(.*\)/, '').trim(),
          data: table.rows.map(r => parseFloat((r[colIdx] || '0').replace(/[,%¥$万元]/g, ''))),
        };
      });

      const isPie = numericCols.length === 1 && table.rows.length <= 8;
      const chartId = genId();
      blocks.push({
        id: chartId,
        type: 'chart',
        content: '',
        chartType: isPie ? 'pie' : 'bar',
        output: { labels, series },
      });
      tableChartMap[ti] = chartId;
    }
  }

  blocks.push({ id: genId(), type: 'ai', content: '' });

  return { blocks, tableChartMap };
}
