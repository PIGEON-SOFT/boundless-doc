import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Block, BlockType, DocumentContextType, DocumentData } from '../types';

const DocumentContext = createContext<DocumentContextType | null>(null);

let blockCounter = 100;
function generateId() {
  return `block-${Date.now()}-${blockCounter++}`;
}

declare global {
  interface Window {
    loadPyodide: any;
    pyodide: any;
  }
}

interface ProviderProps {
  children: React.ReactNode;
  initialBlocks?: Block[];
  initialTitle?: string;
}

export function DocumentProvider({ children, initialBlocks, initialTitle }: ProviderProps) {
  const [doc, setDoc] = useState<DocumentData>({
    id: 'doc-' + Date.now(),
    title: initialTitle || '无界文档',
    blocks: initialBlocks || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const pyodideRef = useRef<any>(null);

  const loadPyodide = useCallback(async () => {
    if (pyodideRef.current || pyodideLoading) return;
    setPyodideLoading(true);
    try {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
      script.onload = async () => {
        const pyodide = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
        });
        pyodideRef.current = pyodide;
        window.pyodide = pyodide;
        setPyodideReady(true);
        setPyodideLoading(false);
      };
      document.head.appendChild(script);
    } catch (e) {
      console.error('Failed to load Pyodide:', e);
      setPyodideLoading(false);
    }
  }, [pyodideLoading]);

  useEffect(() => {
    const hasPython = doc.blocks.some(b => b.type === 'code' && b.language === 'python');
    if (hasPython && !pyodideReady && !pyodideLoading) {
      loadPyodide();
    }
  }, [doc.blocks, pyodideReady, pyodideLoading, loadPyodide]);

  const addBlock = useCallback((type: BlockType, afterId?: string) => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: type === 'markdown' ? '在这里输入内容...' : type === 'model3d' ? 'knot' : type === 'code'
        ? `# Python 示例：数据分析
data = [23, 45, 67, 12, 89, 34, 56]
result = {
    "数据量": len(data),
    "平均值": round(sum(data) / len(data), 1),
    "最大值": max(data),
    "最小值": min(data),
    "总和": sum(data)
}
print(result)`
        : '',
      language: type === 'code' ? 'python' : undefined,
      chartType: (type === 'chart' || type === 'livechart') ? 'line' : undefined,
      liveUrl: type === 'livechart' ? '' : undefined,
      liveInterval: type === 'livechart' ? 30 : undefined,
      modelUrl: type === 'model3d' ? 'https://modelviewer.dev/shared-assets/models/Astronaut.glb' : undefined,
    };

    setDoc(prev => {
      const blocks = [...prev.blocks];
      if (afterId) {
        const idx = blocks.findIndex(b => b.id === afterId);
        blocks.splice(idx + 1, 0, newBlock);
      } else {
        blocks.push(newBlock);
      }
      return { ...prev, blocks, updatedAt: Date.now() };
    });
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setDoc(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => (b.id === id ? { ...b, ...updates } : b)),
      updatedAt: Date.now(),
    }));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setDoc(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== id),
      updatedAt: Date.now(),
    }));
  }, []);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setDoc(prev => {
      const blocks = [...prev.blocks];
      const idx = blocks.findIndex(b => b.id === id);
      if (direction === 'up' && idx > 0) {
        [blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]];
      } else if (direction === 'down' && idx < blocks.length - 1) {
        [blocks[idx + 1], blocks[idx]] = [blocks[idx], blocks[idx + 1]];
      }
      return { ...prev, blocks, updatedAt: Date.now() };
    });
  }, []);

  const getBlockOutput = useCallback((id: string) => {
    const block = doc.blocks.find(b => b.id === id);
    return block?.output;
  }, [doc.blocks]);

  return (
    <DocumentContext.Provider
      value={{
        doc, setDoc, addBlock, updateBlock, deleteBlock,
        moveBlock, getBlockOutput, pyodideReady, pyodideLoading,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
}

export function useDocument() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error('useDocument must be used within DocumentProvider');
  return ctx;
}
