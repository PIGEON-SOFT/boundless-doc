import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDocument } from '../../context/DocumentContext';
import { Block } from '../../types';

export default function MarkdownBlock({ block }: { block: Block }) {
  const { updateBlock } = useDocument();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.content);

  const handleSave = () => {
    updateBlock(block.id, { content: draft });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="markdown-block editing">
        <textarea
          className="markdown-editor"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => {
            if (e.key === 'Escape') handleSave();
          }}
          autoFocus
        />
        <div className="markdown-editor-hint">
          支持 Markdown 语法 · Esc 退出编辑
        </div>
      </div>
    );
  }

  return (
    <div
      className="markdown-block rendered"
      onDoubleClick={() => {
        setDraft(block.content);
        setEditing(true);
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {block.content}
      </ReactMarkdown>
      <div className="edit-hint">双击编辑</div>
    </div>
  );
}
