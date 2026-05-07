import React, { useState, useRef } from 'react';
import { useDocument } from '../../context/DocumentContext';
import { Block } from '../../types';

export default function CodeBlock({ block }: { block: Block }) {
  const { updateBlock, pyodideReady, pyodideLoading } = useDocument();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isPython = block.language === 'python';

  const runCode = async () => {
    setRunning(true);
    setError(null);

    try {
      if (isPython) {
        if (!pyodideReady || !window.pyodide) {
          setError('Pyodide 正在加载中，请稍候...');
          setRunning(false);
          return;
        }
        const pyodide = window.pyodide;
        await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
`);
        await pyodide.runPythonAsync(block.content);
        const stdout = await pyodide.runPythonAsync('sys.stdout.getvalue()');
        let output: any = stdout;
        try {
          output = JSON.parse(stdout);
        } catch {}
        updateBlock(block.id, { output });
      } else {
        const fn = new Function(block.content);
        const result = fn();
        updateBlock(block.id, { output: result });
      }
    } catch (e: any) {
      setError(e.message || String(e));
      updateBlock(block.id, { output: undefined });
    } finally {
      setRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      runCode();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textareaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = block.content;
        updateBlock(block.id, {
          content: val.substring(0, start) + '  ' + val.substring(end),
        });
        setTimeout(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  const outputDisplay = block.output !== undefined
    ? (typeof block.output === 'object'
      ? JSON.stringify(block.output, null, 2)
      : String(block.output))
    : null;

  return (
    <div className="code-block">
      <div className="code-header">
        <div className="code-lang-tabs">
          <button
            className={`lang-tab ${!isPython ? 'active' : ''}`}
            onClick={() => updateBlock(block.id, { language: 'javascript' })}
          >
            JavaScript
          </button>
          <button
            className={`lang-tab ${isPython ? 'active' : ''}`}
            onClick={() => updateBlock(block.id, { language: 'python' })}
          >
            Python {pyodideLoading && '(加载中...)'}
          </button>
        </div>
        <div className="code-actions">
          <span className="run-hint">⌘+Enter</span>
          <button
            className="run-btn"
            onClick={runCode}
            disabled={running || (isPython && !pyodideReady)}
          >
            {running ? '⏳ 运行中...' : '▶ 运行'}
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className="code-editor"
        value={block.content}
        onChange={e => updateBlock(block.id, { content: e.target.value })}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        rows={Math.max(block.content.split('\n').length, 3)}
      />
      {error && (
        <div className="code-output error">
          <div className="output-label">❌ 错误</div>
          <pre>{error}</pre>
        </div>
      )}
      {outputDisplay && !error && (
        <div className="code-output success">
          <div className="output-label">
            ✅ 输出
            {block.output && typeof block.output === 'object' && (
              <span className="data-flow-indicator">📊 数据可被图表引用</span>
            )}
          </div>
          <pre>{outputDisplay}</pre>
        </div>
      )}
    </div>
  );
}
