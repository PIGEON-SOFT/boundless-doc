import React from 'react';
import { useDocument } from '../../context/DocumentContext';
import { Block } from '../../types';
import MarkdownBlock from './MarkdownBlock';
import CodeBlock from './CodeBlock';
import ChartBlock from './ChartBlock';
import AIBlock from './AIBlock';
import LiveChartBlock from './LiveChartBlock';
import Model3DBlock from './Model3DBlock';

const typeLabels: Record<string, { icon: string; label: string; color: string }> = {
  markdown: { icon: '📝', label: '文本', color: '#4a9eff' },
  code: { icon: '⚡', label: '代码', color: '#f5a623' },
  chart: { icon: '📊', label: '图表', color: '#7ed321' },
  ai: { icon: '🤖', label: 'AI', color: '#bd10e0' },
  livechart: { icon: '📡', label: '实时', color: '#06b6d4' },
  model3d: { icon: '🌐', label: '3D', color: '#f97316' },
};

export default function BlockWrapper({ block, highlighted }: { block: Block; highlighted?: boolean }) {
  const { deleteBlock, moveBlock, addBlock } = useDocument();
  const meta = typeLabels[block.type];

  const renderBlock = () => {
    switch (block.type) {
      case 'markdown': return <MarkdownBlock block={block} />;
      case 'code': return <CodeBlock block={block} />;
      case 'chart': return <ChartBlock block={block} />;
      case 'ai': return <AIBlock block={block} />;
      case 'livechart': return <LiveChartBlock block={block} />;
      case 'model3d': return <Model3DBlock block={block} />;
      default: return null;
    }
  };

  return (
    <div className={`block-wrapper ${highlighted ? 'block-highlighted' : ''}`} data-type={block.type} id={block.id}>
      <div className="block-gutter">
        <div className="block-type-badge" style={{ borderColor: meta?.color || '#666' }}>
          {meta?.icon || '📦'}
        </div>
        <div className="block-controls">
          <button title="上移" onClick={() => moveBlock(block.id, 'up')}>↑</button>
          <button title="下移" onClick={() => moveBlock(block.id, 'down')}>↓</button>
          <button title="删除" className="delete-btn" onClick={() => deleteBlock(block.id)}>×</button>
        </div>
      </div>
      <div className="block-content">
        {renderBlock()}
      </div>
      <div className="block-add-divider">
        <div className="add-line" />
        <div className="add-buttons">
          <button onClick={() => addBlock('markdown', block.id)} title="添加文本块">📝</button>
          <button onClick={() => addBlock('code', block.id)} title="添加代码块">⚡</button>
          <button onClick={() => addBlock('chart', block.id)} title="添加图表块">📊</button>
          <button onClick={() => addBlock('livechart', block.id)} title="添加实时数据块">📡</button>
          <button onClick={() => addBlock('model3d', block.id)} title="添加3D模型块">🌐</button>
          <button onClick={() => addBlock('ai', block.id)} title="添加AI块">🤖</button>
        </div>
        <div className="add-line" />
      </div>
    </div>
  );
}
