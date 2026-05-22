import {
  Chart,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  DoughnutController,
  BarController,
  LineElement,
  PointElement,
  LineController,
  Filler,
} from 'chart.js'

export default defineNuxtPlugin(() => {
  Chart.register(
    ArcElement,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    DoughnutController,
    BarController,
    LineElement,
    PointElement,
    LineController,
    Filler,
  )
})
