import mammoth from 'mammoth';
import { Block } from '../types';

let blockIdCounter = 1000;
function genId() { return `parsed-${blockIdCounter++}`; }

interface ParsedTable {
  headers: string[];
  rows: string[][];
}

function parseHtmlTables(html: string): { tables: ParsedTable[]; htmlWithoutTables: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables: ParsedTable[] = [];

  doc.querySelectorAll('table').forEach(table => {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) return;

    const headers = Array.from(rows[0].querySelectorAll('th, td')).map(c => c.textContent?.trim() || '');
    const dataRows = rows.slice(1).map(row =>
      Array.from(row.querySelectorAll('td')).map(c => c.textContent?.trim() || '')
    );

    if (headers.length > 0 && dataRows.length > 0) {
      tables.push({ headers, rows: dataRows });
      table.replaceWith(doc.createElement('hr'));
    }
  });

  return { tables, htmlWithoutTables: doc.body.innerHTML };
}

function tableToChartBlocks(table: ParsedTable): Block[] {
  const blocks: Block[] = [];
  const isNumeric = (s: string) => !isNaN(parseFloat(s.replace(/[,%¥$]/g, '')));
  const numericCols = table.headers.filter((_, i) =>
    i > 0 && table.rows.every(row => isNumeric(row[i] || '0'))
  );

  if (numericCols.length > 0) {
    const labels = table.rows.map(r => r[0]);
    const series = numericCols.map(col => {
      const colIdx = table.headers.indexOf(col);
      return {
        name: col,
        data: table.rows.map(r => parseFloat((r[colIdx] || '0').replace(/[,%¥$]/g, ''))),
      };
    });

    const isPie = numericCols.length === 1 && table.rows.length <= 8;
    blocks.push({
      id: genId(),
      type: 'chart',
      content: '',
      chartType: isPie ? 'pie' : 'bar',
      output: { labels, series },
    });
  }

  return blocks;
}

function htmlToMarkdown(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const codePatterns = [
  /^(const|let|var|function|return|import|def|class|for|if|while)\s/m,
  /^(\/\/|#)\s/m,
  /^\s*(console\.log|print\(|sys\.|Math\.|json\.)/m,
  /[{}\[\]];?\s*$/m,
];

function looksLikeCode(text: string): boolean {
  if (text.includes('[📊 无界文档')) return true;
  let codeLines = 0;
  const lines = text.split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (codePatterns.some(p => p.test(t))) codeLines++;
  }
  return codeLines >= Math.max(2, lines.filter(l => l.trim()).length * 0.4);
}

export async function parseDocx(arrayBuffer: ArrayBuffer): Promise<Block[]> {
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const rawHtml = result.value;

  const { tables, htmlWithoutTables } = parseHtmlTables(rawHtml);
  const markdown = htmlToMarkdown(htmlWithoutTables);
  const blocks: Block[] = [];

  const sections = markdown.split(/\n(?=# )/);
  for (const section of sections) {
    if (!section.trim()) continue;
    if (looksLikeCode(section)) continue;
    blocks.push({ id: genId(), type: 'markdown', content: section.trim() });
  }

  for (const table of tables) {
    const chartBlocks = tableToChartBlocks(table);
    blocks.push(...chartBlocks);
  }

  blocks.push({ id: genId(), type: 'ai', content: '' });
  return blocks;
}
