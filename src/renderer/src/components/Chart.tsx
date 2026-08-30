import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as echarts from 'echarts/core'
import { LineChart, ScatterChart } from 'echarts/charts'
import { GridComponent, LegendComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, ScatterChart, GridComponent, LegendComponent, MarkLineComponent, TooltipComponent, CanvasRenderer])

export const CHART_BASE = {
  backgroundColor: 'transparent',
  textStyle: { fontFamily: 'IBM Plex Sans', color: '#93a0b5' },
  animation: false,
  grid: { left: 48, right: 16, top: 28, bottom: 36 },
  tooltip: { trigger: 'axis' as const }
}

export function Chart({ option, height = 280 }: { option: object; height?: number }) {
  return <ReactEChartsCore echarts={echarts} option={option} style={{ height, width: '100%' }} notMerge />
}
