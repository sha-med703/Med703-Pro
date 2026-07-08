<template>
  <div ref="chartRef" class="chart"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import * as echarts from "echarts"

const props = defineProps<{
  dates: string[]
  durations: number[]
}>()

const chartRef = ref<HTMLDivElement>()

function renderChart() {
  if (!chartRef.value) return

  const chart = echarts.init(chartRef.value)

  chart.setOption({
    tooltip: {
      trigger: "axis"
    },
    xAxis: {
      type: "category",
      data: props.dates
    },
    yAxis: {
      type: "value",
      name: "分钟"
    },
    series: [
      {
        data: props.durations.map(v => Math.round(v / 60)),
        type: "line",
        smooth: true,
        areaStyle: {}
      }
    ]
  })
}

onMounted(renderChart)

watch(
  () => [props.dates, props.durations],
  () => {
    renderChart()
  },
  { deep: true }
)
</script>

<style scoped>
.chart {
  width: 100%;
  height: 360px;
}
</style>