export type BlockType = 'markdown' | 'code' | 'chart' | 'ai' | 'livechart' | 'model3d';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  output?: any;
  language?: 'javascript' | 'python';
  chartType?: 'line' | 'bar' | 'pie' | 'scatter';
  dataSourceBlockId?: string;
  collapsed?: boolean;
  liveUrl?: string;
  liveInterval?: number;
  modelUrl?: string;
}

export interface DocumentData {
  id: string;
  title: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
}

export interface DocumentContextType {
  doc: DocumentData;
  setDoc: React.Dispatch<React.SetStateAction<DocumentData>>;
  addBlock: (type: BlockType, afterId?: string) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (id: string, direction: 'up' | 'down') => void;
  getBlockOutput: (id: string) => any;
  pyodideReady: boolean;
  pyodideLoading: boolean;
}
