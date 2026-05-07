import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { useDocument } from '../../context/DocumentContext';
import { Block } from '../../types';

declare const Office: any;
declare const Word: any;

const CLOUD_PRESETS = [
  {
    name: '🪙 加密货币 TOP5',
    url: 'https://api.coincap.io/v2/assets?limit=5',
    transform: (json: any) => {
      const assets = json.data.slice(0, 5);
      return {
        labels: assets.map((a: any) => a.symbol),
        series: [{ name: '市值(亿美元)', data: assets.map((a: any) => Math.round(a.marketCapUsd / 1e8)) }],
      };
    },
  },
  {
    name: '🌤️ 北京天气',
    url: 'https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FShanghai&forecast_days=7',
    transform: (json: any) => ({
      labels: json.daily.time,
      series: [
        { name: '最高温(°C)', data: json.daily.temperature_2m_max },
        { name: '最低温(°C)', data: json.daily.temperature_2m_min },
      ],
    }),
  },
  {
    name: '🪙 BTC 价格',
    url: 'https://api.coincap.io/v2/assets/bitcoin/history?interval=h1',
    transform: (json: any) => {
      const points = json.data.slice(-24);
      return {
        labels: points.map((p: any) => new Date(p.time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })),
        series: [{ name: 'BTC(USD)', data: points.map((p: any) => Math.round(parseFloat(p.priceUsd))) }],
      };
    },
  },
];

export default function LiveChartBlock({ block }: { block: Block }) {
  const { updateBlock } = useDocument();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [syncing, setSyncing] = useState(false);

  const url = block.liveUrl || '';
  const interval = block.liveInterval || 30;
  const chartType = block.chartType || 'line';

  const fetchData = useCallback(async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();

      const preset = CLOUD_PRESETS.find(p => p.url === url);
      const parsed = preset ? preset.transform(json) : parseChartData(json);
      setData(parsed);
      updateBlock(block.id, { output: parsed });
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [url, block.id, updateBlock]);

  useEffect(() => {
    if (!url.trim()) return;
    fetchData();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchData, interval * 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [url, interval, fetchData]);

  const syncToWord = async () => {
    if (!data || typeof Word === 'undefined') return;
    setSyncing(true);
    try {
      const chartInstance = (document.querySelector(`#${block.id} .echarts-for-react`) as any)?.getEchartsInstance?.();
      if (!chartInstance) {
        setSyncing(false);
        return;
      }
      const imgData = chartInstance.getDataURL({ type: 'png', pixelRatio: 2 });
      const base64 = imgData.replace(/^data:image\/png;base64,/, '');

      Word.run(async (context: any) => {
        const selection = context.document.getSelection();
        selection.insertParagraph('📊 实时数据图表', 'Before');
        const imgParagraph = selection.insertParagraph('', 'Before');
        imgParagraph.insertInlinePictureFromBase64(base64, 'Replace');
        await context.sync();
      });
    } catch {}
    setSyncing(false);
  };

  const darkTheme = {
    textStyle: { color: '#e1e1e6' },
    legend: { textStyle: { color: '#8b8d98' }, inactiveColor: '#444' },
    tooltip: { backgroundColor: 'rgba(26,27,35,0.95)', borderColor: '#2e303a', textStyle: { color: '#e1e1e6' } },
  };

  const getOption = () => {
    if (!data) return {};
    if (chartType === 'pie') {
      return {
        ...darkTheme,
        tooltip: { ...darkTheme.tooltip, trigger: 'item' as const },
        legend: { ...darkTheme.legend, bottom: 0 },
        series: [{
          type: 'pie', radius: ['40%', '70%'], label: { color: '#e1e1e6' },
          data: data.labels.map((name: string, i: number) => ({
            name, value: data.series[0]?.data?.[i] ?? 0,
          })),
        }],
      };
    }
    return {
      ...darkTheme,
      tooltip: { ...darkTheme.tooltip, trigger: 'axis' as const },
      legend: { ...darkTheme.legend, data: data.series.map((s: any) => s.name) },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: data.labels, axisLine: { lineStyle: { color: '#3a3c48' } }, axisLabel: { color: '#8b8d98' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#2e303a' } }, axisLabel: { color: '#8b8d98' } },
      series: data.series.map((s: any) => ({
        name: s.name, type: chartType, data: s.data,
        smooth: chartType === 'line',
        areaStyle: chartType === 'line' ? { opacity: 0.1 } : undefined,
      })),
    };
  };

  return (
    <div className="livechart-block">
      <div className="livechart-header">
        <span className="livechart-title">📡 实时数据</span>
        {lastUpdate && <span className="livechart-time">更新于 {lastUpdate}</span>}
        {loading && <span className="livechart-loading">⏳</span>}
      </div>
      <div className="livechart-config">
        <div className="livechart-presets">
          {CLOUD_PRESETS.map(p => (
            <button
              key={p.url}
              className={`livechart-preset-btn ${url === p.url ? 'active' : ''}`}
              onClick={() => updateBlock(block.id, { liveUrl: p.url })}
            >{p.name}</button>
          ))}
        </div>
        <input
          type="text"
          className="livechart-url"
          placeholder="或输入自定义 JSON 数据 URL"
          value={url}
          onChange={e => updateBlock(block.id, { liveUrl: e.target.value })}
        />
        <select value={interval} onChange={e => updateBlock(block.id, { liveInterval: Number(e.target.value) })}>
          <option value={10}>10秒</option>
          <option value={30}>30秒</option>
          <option value={60}>1分钟</option>
          <option value={300}>5分钟</option>
        </select>
        <select value={chartType} onChange={e => updateBlock(block.id, { chartType: e.target.value as any })}>
          <option value="line">折线图</option>
          <option value="bar">柱状图</option>
          <option value="pie">饼图</option>
        </select>
        <button className="livechart-sync" onClick={syncToWord} disabled={!data || syncing}>
          {syncing ? '⏳ 同步中...' : '📥 同步到 Word'}
        </button>
      </div>
      {error && <div className="livechart-error">❌ {error}</div>}
      {data ? (
        <ReactECharts option={getOption()} style={{ height: 300 }} notMerge />
      ) : (
        <div className="livechart-placeholder">
          <div>📡</div>
          <p>输入数据 URL，图表将自动获取并定时刷新</p>
          <p className="livechart-format">
            JSON 格式：<code>{`{ "labels": [...], "series": [{ "name": "...", "data": [...] }] }`}</code>
          </p>
          <p className="livechart-format">
            也支持简单数组：<code>{`{ "labels": ["A","B","C"], "values": [10,20,30] }`}</code>
          </p>
        </div>
      )}
    </div>
  );
}

function parseChartData(json: any): { labels: string[]; series: { name: string; data: number[] }[] } | null {
  if (json.labels && json.series) return json;
  if (json.labels && json.values) {
    return { labels: json.labels, series: [{ name: '数据', data: json.values }] };
  }
  if (Array.isArray(json)) {
    const labels = json.map((_: any, i: number) => `${i + 1}`);
    const keys = Object.keys(json[0]).filter(k => typeof json[0][k] === 'number');
    return {
      labels: json.map((item: any) => item.name || item.label || item.date || ''),
      series: keys.map(k => ({ name: k, data: json.map((item: any) => item[k]) })),
    };
  }
  if (json.data) return parseChartData(json.data);
  return null;
}
