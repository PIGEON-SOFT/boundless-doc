declare const Office: any;
declare const Word: any;

interface WordTable {
  headers: string[];
  rows: string[][];
}

interface WordContent {
  paragraphs: { text: string; style: string; font?: any }[];
  tables: WordTable[];
}

export function isOfficeEnvironment(): boolean {
  return new URLSearchParams(window.location.search).get('mode') === 'addin' &&
    typeof Office !== 'undefined' && typeof Word !== 'undefined';
}

export async function initOffice(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof Office !== 'undefined') {
      Office.onReady(() => resolve());
    } else {
      resolve();
    }
  });
}

export function watchTableSelection(
  callback: (tableIndex: number | null) => void
): () => void {
  if (typeof Office === 'undefined') return () => {};

  const handler = () => {
    Office.context.document.getSelectedDataAsync(
      Office.CoercionType.Table,
      (asyncResult: any) => {
        if (asyncResult.status !== 'succeeded' || !asyncResult.value) {
          callback(null);
          return;
        }
        const tableData = asyncResult.value;
        const firstCell = tableData.rows?.[0]?.[0] || '';
        if (!firstCell && !tableData.headers?.[0]) {
          callback(null);
          return;
        }
        // 遍历所有表格，通过第一行第一列内容匹配
        Word.run(async (context: any) => {
          try {
            const tables = context.document.body.tables;
            context.load(tables, 'items');
            await context.sync();

            const marker = (tableData.headers?.[0] || firstCell).trim();
            for (let i = 0; i < tables.items.length; i++) {
              const cell = tables.items[i].rows.getItem(0).cells.getItem(0);
              context.load(cell, 'value');
              await context.sync();
              if (cell.value.trim() === marker) {
                callback(i);
                return;
              }
            }
            callback(null);
          } catch {
            callback(null);
          }
        });
      }
    );
  };

  Office.context.document.addHandlerAsync(
    Office.EventType.DocumentSelectionChanged,
    handler
  );

  return () => {
    Office.context.document.removeHandlerAsync(
      Office.EventType.DocumentSelectionChanged
    );
  };
}

export async function readWordDocument(): Promise<WordContent> {
  return new Promise((resolve, reject) => {
    try {
      Word.run(async (context: any) => {
        const body = context.document.body;
        body.load('text');

        const paragraphs = body.paragraphs;
        paragraphs.load('items');

        const tables = body.tables;
        tables.load('items');

        await context.sync();

        const parData: WordContent['paragraphs'] = [];
        for (let i = 0; i < paragraphs.items.length; i++) {
          const p = paragraphs.items[i];
          p.load('text, style, font');
        }
        await context.sync();

        for (let i = 0; i < paragraphs.items.length; i++) {
          const p = paragraphs.items[i];
          parData.push({
            text: p.text,
            style: p.style || '',
          });
        }

        const tableData: WordTable[] = [];
        for (let t = 0; t < tables.items.length; t++) {
          const table = tables.items[t];
          const rows = table.rows;
          rows.load('items');
          await context.sync();

          const headers: string[] = [];
          const dataRows: string[][] = [];

          for (let r = 0; r < rows.items.length; r++) {
            const row = rows.items[r];
            const cells = row.cells;
            cells.load('items');
            await context.sync();

            const cellTexts: string[] = [];
            for (let c = 0; c < cells.items.length; c++) {
              const cell = cells.items[c];
              cell.body.load('text');
              await context.sync();
              cellTexts.push(cell.body.text.trim());
            }

            if (r === 0) {
              headers.push(...cellTexts);
            } else {
              dataRows.push(cellTexts);
            }
          }
          tableData.push({ headers, rows: dataRows });
        }

        resolve({ paragraphs: parData, tables: tableData });
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function insertChartPlaceholder(tableIndex: number): Promise<void> {
  return Word.run(async (context: any) => {
    const tables = context.document.body.tables;
    tables.load('items');
    await context.sync();

    if (tableIndex < tables.items.length) {
      const table = tables.items[tableIndex];
      const afterParagraph = table.insertParagraph(
        `[📊 无界文档：此表格已在侧边栏中增强为可交互图表]`,
        'After'
      );
      afterParagraph.font.color = '#6C63FF';
      afterParagraph.font.italic = true;
      afterParagraph.font.size = 10;
      await context.sync();
    }
  });
}

export async function highlightEnhancedContent(): Promise<void> {
  return Word.run(async (context: any) => {
    const body = context.document.body;
    const searchResults = body.search('return {', { matchCase: false });
    searchResults.load('items');
    await context.sync();

    for (const result of searchResults.items) {
      result.font.highlightColor = 'Yellow';
    }
    await context.sync();
  });
}
