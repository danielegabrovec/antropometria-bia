import ReactECharts from 'echarts-for-react'

export const CHART_BASE = {
  backgroundColor: 'transparent',
  textStyle: { fontFamily: 'IBM Plex Sans', color: '#93a0b5' },
  animation: false,
  grid: { left: 48, right: 16, top: 28, bottom: 36 },
  tooltip: { trigger: 'axis' as const }
}

export function Chart({ option, height = 280 }: { option: object; height?: number }) {
  return <ReactECharts option={option} style={{ height, width: '100%' }} notMerge />
}
