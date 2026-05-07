import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DocumentProvider, useDocument } from './context/DocumentContext';
import BlockWrapper from './components/blocks/BlockWrapper';
import { parseDocx } from './utils/docxParser';
import { isOfficeEnvironment, initOffice, readWordDocument, watchTableSelection } from './utils/officeApi';
import { wordContentToBlocks } from './utils/wordToBlocks';
import { Block } from './types';
import './index.css';

/* ─── Word Add-in Mode ─── */
function WordAddinPanel() {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [tableChartMap, setTableChartMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scanDocument = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const content = await readWordDocument();
      const result = wordContentToBlocks(content);
      setBlocks(result.blocks);
      setTableChartMap(result.tableChartMap);
    } catch (e: any) {
      setError('读取文档失败：' + e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  if (!blocks) {
    return (
      <div className="addin-landing">
        <div className="addin-logo">π</div>
        <h2>无界文档</h2>
        <p className="addin-desc">
          点击下方按钮扫描当前 Word 文档，<br />
          表格将变为交互图表，代码可直接运行，<br />
          AI助手将理解全文内容。
        </p>
        {error && <p className="addin-error">{error}</p>}
        <button className="scan-btn" onClick={scanDocument} disabled={loading}>
          {loading ? '⏳ 扫描中...' : '⚡ 扫描并增强文档'}
        </button>
      </div>
    );
  }

  return (
    <DocumentProvider initialBlocks={blocks} initialTitle="Word 文档增强视图">
      <AddinDocView onRescan={() => { setBlocks(null); setTableChartMap({}); }} tableChartMap={tableChartMap} />
    </DocumentProvider>
  );
}

function AddinDocView({ onRescan, tableChartMap }: { onRescan: () => void; tableChartMap: Record<number, string> }) {
  const { doc, addBlock } = useDocument();
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    const unwatch = watchTableSelection((tableIndex) => {
      if (tableIndex !== null && tableChartMap[tableIndex]) {
        const blockId = tableChartMap[tableIndex];
        const el = document.getElementById(blockId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightId(blockId);
          setTimeout(() => setHighlightId(null), 1500);
        }
      }
    });
    return unwatch;
  }, [tableChartMap]);

  return (
    <div className="addin-app">
      <div className="addin-header">
        <span className="addin-header-logo">π</span>
        <span className="addin-header-title">无界文档</span>
        <button className="addin-rescan" onClick={onRescan}>🔄 重新扫描</button>
      </div>
      <div className="addin-toolbar">
        <button onClick={() => addBlock('code')}>⚡ 代码</button>
        <button onClick={() => addBlock('chart')}>📊 图表</button>
        <button onClick={() => addBlock('livechart')}>📡 实时数据</button>
        <button onClick={() => addBlock('model3d')}>🌐 3D模型</button>
        <button onClick={() => addBlock('ai')}>🤖 AI</button>
      </div>
      <div className="addin-hint">💡 点击 Word 中的表格，侧边栏会自动跳转到对应图表</div>
      <div className="addin-blocks">
        {doc.blocks.map(block => (
          <BlockWrapper key={block.id} block={block} highlighted={block.id === highlightId} />
        ))}
      </div>
    </div>
  );
}

/* ─── Standalone Web Mode ─── */
function LandingPage({ onLoad }: { onLoad: (blocks: Block[], title: string) => void }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.docx')) {
      alert('请上传 .docx 格式的文件');
      return;
    }
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const blocks = await parseDocx(buffer);
      onLoad(blocks, file.name.replace('.docx', ''));
    } catch (e: any) {
      alert('解析失败：' + e.message);
    } finally {
      setLoading(false);
    }
  }, [onLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const loadDemo = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/demo.docx');
      const buffer = await resp.arrayBuffer();
      const blocks = await parseDocx(buffer);
      onLoad(blocks, '无界文档 π — 活文档演示');
    } catch (e: any) {
      alert('加载演示文档失败：' + e.message);
    } finally {
      setLoading(false);
    }
  }, [onLoad]);

  return (
    <div className="landing">
      <div className="landing-bg" />
      <div className="landing-content">
        <div className="landing-logo">π</div>
        <h1 className="landing-title">无界文档</h1>
        <p className="landing-subtitle">文档的尽头，是没有文档</p>
        <p className="landing-desc">
          上传你的 .docx 文件，表格自动变为可交互图表，<br />
          代码片段可直接运行，AI 助手理解全文内容为你解答。<br />
          <strong>也可作为 Word 插件直接嵌入 Microsoft Word 使用。</strong>
        </p>
        <div
          className={`upload-zone ${dragging ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".docx" style={{ display: 'none' }}
            onChange={e => { const file = e.target.files?.[0]; if (file) handleFile(file); }} />
          {loading ? (
            <><div className="upload-spinner" /><p>正在解析文档...</p></>
          ) : (
            <><div className="upload-icon">📄</div>
              <p className="upload-main">拖放 .docx 文件到这里</p>
              <p className="upload-sub">或点击选择文件</p></>
          )}
        </div>
        <div className="landing-divider"><span>或</span></div>
        <button className="demo-btn" onClick={loadDemo} disabled={loading}>⚡ 体验演示文档</button>
        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">📊</div><h3>活数据</h3><p>表格自动转为可交互图表</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div><h3>可执行</h3><p>代码片段直接运行出结果</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div><h3>AI原生</h3><p>AI助手理解全文档内容</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📎</div><h3>Word插件</h3><p>直接嵌入 Word 使用</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentView({ onBack }: { onBack: () => void }) {
  const { doc, addBlock } = useDocument();
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>← 返回</button>
          <div className="logo">π</div>
          <h1 className="doc-title">{doc.title}</h1>
        </div>
        <div className="header-right">
          <div className="header-meta">{doc.blocks.length} 个块 · 从 .docx 解析增强</div>
          <div className="header-add-buttons">
            <button onClick={() => addBlock('markdown')}>📝 文本</button>
            <button onClick={() => addBlock('code')}>⚡ 代码</button>
            <button onClick={() => addBlock('chart')}>📊 图表</button>
            <button onClick={() => addBlock('livechart')}>📡 实时</button>
            <button onClick={() => addBlock('model3d')}>🌐 3D</button>
            <button onClick={() => addBlock('ai')}>🤖 AI</button>
          </div>
        </div>
      </header>
      <div className="enhance-banner">
        <span className="enhance-icon">✨</span>
        <span>此文档已从 .docx 解析并增强 — 表格已转为可交互图表，代码可直接运行</span>
      </div>
      <main className="document">
        {doc.blocks.map(block => <BlockWrapper key={block.id} block={block} />)}
      </main>
      <footer className="app-footer"><span>无界文档 π — 文档的尽头，是没有文档</span></footer>
    </div>
  );
}

/* ─── Main App ─── */
export default function App() {
  const [mode, setMode] = useState<'loading' | 'addin' | 'web'>('loading');
  const [parsedBlocks, setParsedBlocks] = useState<Block[] | null>(null);
  const [docTitle, setDocTitle] = useState('');

  useEffect(() => {
    (async () => {
      try {
        await initOffice();
        if (isOfficeEnvironment()) {
          setMode('addin');
        } else {
          setMode('web');
        }
      } catch {
        setMode('web');
      }
    })();
  }, []);

  if (mode === 'loading') {
    return (
      <div className="loading-screen">
        <div className="loading-logo">π</div>
        <p>加载中...</p>
      </div>
    );
  }

  if (mode === 'addin') {
    return <WordAddinPanel />;
  }

  if (!parsedBlocks) {
    return <LandingPage onLoad={(blocks, title) => { setParsedBlocks(blocks); setDocTitle(title); }} />;
  }

  return (
    <DocumentProvider initialBlocks={parsedBlocks} initialTitle={docTitle}>
      <DocumentView onBack={() => setParsedBlocks(null)} />
    </DocumentProvider>
  );
}
