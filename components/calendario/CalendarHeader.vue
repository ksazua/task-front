<script setup lang="ts">
import { SidebarTrigger } from '~/components/ui/sidebar'
import { Separator } from '~/components/ui/separator'
import { Button } from '~/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-vue-next'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

const props = defineProps<{
  currentDate: string // YYYY-MM-DD
}>()

const emit = defineEmits<{
  (e: 'update:currentDate', value: string): void
}>()

const currentMonth = computed(() => {
  return dayjs(props.currentDate).format('MMMM YYYY')
})

const currentYear = computed(() => {
  return dayjs(props.currentDate).year()
})

const currentMonthNumber = computed(() => {
  return dayjs(props.currentDate).month()
})

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const years = Array.from({ length: 10 }, (_, i) => currentYear.value - 5 + i)

function goToPreviousMonth() {
  const newDate = dayjs(props.currentDate).subtract(1, 'month').format('YYYY-MM-DD')
  emit('update:currentDate', newDate)
}

function goToNextMonth() {
  const newDate = dayjs(props.currentDate).add(1, 'month').format('YYYY-MM-DD')
  emit('update:currentDate', newDate)
}

function goToToday() {
  emit('update:currentDate', dayjs().format('YYYY-MM-DD'))
}

function changeMonth(monthIndex: any) {
  if (monthIndex === null || monthIndex === undefined) return
  const newDate = dayjs(props.currentDate).month(parseInt(String(monthIndex))).format('YYYY-MM-DD')
  emit('update:currentDate', newDate)
}

function changeYear(year: any) {
  if (year === null || year === undefined) return
  const newDate = dayjs(props.currentDate).year(parseInt(String(year))).format('YYYY-MM-DD')
  emit('update:currentDate', newDate)
}
</script>

<template>
  <header class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-b bg-background px-3 sm:px-4 md:px-6 py-3 shrink-0">
    <!-- Left: Sidebar trigger y título -->
    <div class="flex items-center gap-3 flex-1">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="h-5 hidden sm:block" />
      <h1 class="text-xl font-semibold capitalize">{{ currentMonth }}</h1>
    </div>

    <!-- Right: Controles -->
    <div class="flex items-center gap-2">
      <!-- Selectores de mes y año -->
      <div class="hidden md:flex items-center gap-2">
        <Select :model-value="currentMonthNumber.toString()" @update:model-value="changeMonth">
          <SelectTrigger class="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="(month, idx) in months" :key="idx" :value="idx.toString()">
              {{ month }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select :model-value="currentYear.toString()" @update:model-value="changeYear">
          <SelectTrigger class="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="year in years" :key="year" :value="year.toString()">
              {{ year }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator orientation="vertical" class="h-5 hidden md:block" />

      <!-- Navegación -->
      <div class="flex items-center gap-1">
        <Button variant="outline" size="icon" @click="goToPreviousMonth">
          <ChevronLeft :size="18" />
        </Button>
        <Button variant="outline" @click="goToToday">
          Hoy
        </Button>
        <Button variant="outline" size="icon" @click="goToNextMonth">
          <ChevronRight :size="18" />
        </Button>
      </div>
    </div>
  </header>
</template>
