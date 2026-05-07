import React, { useState, useRef, useEffect } from 'react';
import { useDocument } from '../../context/DocumentContext';
import { Block } from '../../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIBlock({ block }: { block: Block }) {
  const { doc } = useDocument();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('deepseek-api-key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => {
    return doc.blocks
      .filter(b => b.id !== block.id)
      .map(b => {
        if (b.type === 'markdown') return `[文本块]\n${b.content}`;
        if (b.type === 'code')
          return `[代码块 - ${b.language}]\n${b.content}${b.output ? `\n[输出]: ${JSON.stringify(b.output).substring(0, 500)}` : ''}`;
        if (b.type === 'chart')
          return `[图表块 - ${b.chartType}] 数据源: ${b.dataSourceBlockId || '无'}`;
        return '';
      })
      .join('\n\n');
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const documentContext = buildContext();

    try {
      const systemPrompt = `你是一个嵌入在"无界文档"中的AI助手。你能感知整篇文档的内容，包括文本、代码和数据。以下是当前文档的内容：\n\n${documentContext}\n\n请基于文档内容回答用户的问题。回答简洁、准确、有用。`;

      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(m => ({ role: m.role as string, content: m.content })),
        { role: 'user' as const, content: input },
      ];

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: chatMessages,
          max_tokens: 1024,
        }),
      });
      const data = await response.json();
      const assistantMsg = data.choices?.[0]?.message?.content || '抱歉，无法获取回复。';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantMsg }]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `请求失败: ${e.message}。请检查API Key是否正确。` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('deepseek-api-key', key);
    setShowKeyInput(false);
  };

  return (
    <div className="ai-block">
      <div className="ai-header">
        <span className="ai-title">🤖 AI 助手</span>
        <span className="ai-context-badge">
          感知 {doc.blocks.length - 1} 个文档块
        </span>
        <button
          className="ai-key-btn"
          onClick={() => setShowKeyInput(!showKeyInput)}
        >
          {apiKey ? '🔑 已配置' : '⚙️ 设置API Key'}
        </button>
      </div>
      {showKeyInput && (
        <div className="ai-key-input">
          <input
            type="password"
            placeholder="输入 DeepSeek API Key (sk-...)"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <button onClick={() => saveApiKey(apiKey)}>保存</button>
          <span className="ai-key-hint">无 API Key 时使用模拟回复</span>
        </div>
      )}
      <div className="ai-chat">
        {messages.length === 0 && (
          <div className="ai-welcome">
            <p>👋 我是文档内置的AI助手，我能感知这份文档的所有内容。</p>
            <p>试试问我：</p>
            <div className="ai-suggestions">
              {['这份文档包含哪些代码？', '帮我解释上面的代码逻辑', '总结这份文档的核心内容'].map(q => (
                <button key={q} className="ai-suggestion" onClick={() => { setInput(q); }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`ai-message ${msg.role}`}>
            <div className="ai-message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="ai-message-content">{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div className="ai-message assistant">
            <div className="ai-message-avatar">🤖</div>
            <div className="ai-message-content ai-typing">思考中...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="ai-input-area">
        <input
          type="text"
          className="ai-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="询问关于文档内容的问题..."
          disabled={loading}
        />
        <button className="ai-send" onClick={sendMessage} disabled={loading || !input.trim()}>
          发送
        </button>
      </div>
    </div>
  );
}
