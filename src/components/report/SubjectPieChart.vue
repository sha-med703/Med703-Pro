<template>
  <div ref="chartRef" class="chart"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import * as echarts from "echarts"

const props = defineProps<{
  subjects: string[]
  durations: number[]
}>()

const chartRef = ref<HTMLDivElement>()

function renderChart() {
  if (!chartRef.value) return

  const chart = echarts.init(chartRef.value)

  const data = props.subjects.map((subject, index) => {
    return {
      name: subject,
      value: Math.round((props.durations[index] || 0) / 60)
    }
  })

  chart.setOption({
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} 分钟"
    },
    legend: {
      bottom: 0
    },
    series: [
      {
        name: "科目占比",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        data
      }
    ]
  })
}

onMounted(renderChart)

watch(
  () => [props.subjects, props.durations],
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