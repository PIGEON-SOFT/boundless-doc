import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useDocument } from '../../context/DocumentContext';
import { Block } from '../../types';

export default function ChartBlock({ block }: { block: Block }) {
  const { updateBlock } = useDocument();

  const sourceData = block.output;
  const hasData = sourceData && typeof sourceData === 'object' && sourceData.labels && sourceData.series;

  const darkTheme = {
    textStyle: { color: '#e1e1e6' },
    legend: { textStyle: { color: '#8b8d98' }, inactiveColor: '#444' },
    tooltip: {
      backgroundColor: 'rgba(26,27,35,0.95)',
      borderColor: '#2e303a',
      textStyle: { color: '#e1e1e6' },
    },
  };

  const getOption = () => {
    if (!hasData) return {};
    const { labels, series } = sourceData;
    const chartType = block.chartType || 'bar';

    if (chartType === 'pie') {
      return {
        ...darkTheme,
        tooltip: { ...darkTheme.tooltip, trigger: 'item' as const },
        legend: { ...darkTheme.legend, bottom: 0 },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          label: { color: '#e1e1e6' },
          data: labels.map((name: string, i: number) => ({
            name,
            value: series[0]?.data?.[i] ?? 0,
          })),
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' },
          },
        }],
      };
    }

    return {
      ...darkTheme,
      tooltip: { ...darkTheme.tooltip, trigger: 'axis' as const },
      legend: { ...darkTheme.legend, data: series.map((s: any) => s.name) },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: labels, axisLine: { lineStyle: { color: '#3a3c48' } }, axisLabel: { color: '#8b8d98' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#2e303a' } }, axisLabel: { color: '#8b8d98' } },
      series: series.map((s: any) => ({
        name: s.name,
        type: chartType,
        data: s.data,
        smooth: chartType === 'line',
        areaStyle: chartType === 'line' ? { opacity: 0.15 } : undefined,
      })),
    };
  };

  return (
    <div className="chart-block">
      <div className="chart-header">
        <div className="chart-config">
          <label>图表类型：</label>
          <select
            value={block.chartType || 'bar'}
            onChange={e => updateBlock(block.id, { chartType: e.target.value as any })}
          >
            <option value="bar">柱状图</option>
            <option value="line">折线图</option>
            <option value="pie">饼图</option>
            <option value="scatter">散点图</option>
          </select>
        </div>
      </div>
      {hasData ? (
        <ReactECharts
          option={getOption()}
          style={{ height: 350 }}
          notMerge={true}
        />
      ) : (
        <div className="chart-placeholder">
          <div className="chart-placeholder-icon">📊</div>
          <p>暂无图表数据</p>
        </div>
      )}
    </div>
  );
}
