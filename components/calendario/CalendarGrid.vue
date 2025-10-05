<script setup lang="ts">
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { useTasksStore, type Task } from '~/stores/tasks'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

const props = defineProps<{
  currentDate: string // YYYY-MM-DD
}>()

const emit = defineEmits<{
  (e: 'selectTask', task: Task): void
  (e: 'selectDate', date: string): void
}>()

const tasks = useTasksStore()

// Generar días del mes
const calendarDays = computed(() => {
  const date = dayjs(props.currentDate)
  const year = date.year()
  const month = date.month()
  
  // Primer y último día del mes
  const firstDay = dayjs(new Date(year, month, 1))
  const lastDay = dayjs(new Date(year, month + 1, 0))
  
  // Día de la semana del primer día (0 = Domingo)
  const startDayOfWeek = firstDay.day()
  
  // Total de días a mostrar
  const totalDays = lastDay.date()
  
  const days = []
  
  // Días vacíos antes del primer día
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ date: null, tasks: [] })
  }
  
  // Días del mes
  for (let i = 1; i <= totalDays; i++) {
    const dateStr = dayjs(new Date(year, month, i)).format('YYYY-MM-DD')
    const dayTasks = getTasksForDate(dateStr)
    days.push({ date: dateStr, tasks: dayTasks })
  }
  
  return days
})

function getTasksForDate(date: string): Task[] {
  return tasks.tasks.filter((task: Task) => {
    if (!task.startDate || !task.dueDate) return false
    
    const taskStart = dayjs(task.startDate)
    const taskEnd = dayjs(task.dueDate)
    const currentDate = dayjs(date)
    
    return currentDate.isSameOrAfter(taskStart, 'day') && currentDate.isSameOrBefore(taskEnd, 'day')
  })
}

function getDayNumber(date: string | null): string {
  if (!date) return ''
  return dayjs(date).format('D')
}

function isToday(date: string | null): boolean {
  if (!date) return false
  return dayjs(date).isSame(dayjs(), 'day')
}

function getStatusColor(status: string): string {
  const colors = {
    planned: 'bg-blue-100 text-blue-700 border-blue-200',
    in_progress: 'bg-amber-100 text-amber-700 border-amber-200',
    done: 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }
  return colors[status as keyof typeof colors] || colors.planned
}

const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
</script>

<template>
  <div class="bg-white rounded-lg border overflow-hidden">
    <!-- Header con días de la semana -->
    <div class="grid grid-cols-7 border-b bg-muted/30">
      <div 
        v-for="day in weekDays" 
        :key="day"
        class="p-2 text-center text-sm font-semibold text-muted-foreground"
      >
        {{ day }}
      </div>
    </div>

    <!-- Grid de días -->
    <div class="grid grid-cols-7">
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        :class="[
          'min-h-[120px] border-b border-r p-2 transition-colors',
          day.date ? 'hover:bg-muted/50 cursor-pointer' : 'bg-muted/10',
          isToday(day.date) ? 'bg-blue-50' : ''
        ]"
        @click="day.date && emit('selectDate', day.date)"
      >
        <!-- Número del día -->
        <div 
          v-if="day.date"
          :class="[
            'text-sm font-semibold mb-2 w-8 h-8 rounded-full flex items-center justify-center',
            isToday(day.date) ? 'bg-primary text-primary-foreground' : 'text-foreground'
          ]"
        >
          {{ getDayNumber(day.date) }}
        </div>

        <!-- Tareas del día -->
        <div class="space-y-1">
          <div
            v-for="task in day.tasks.slice(0, 3)"
            :key="task.id"
            :class="[
              'text-xs px-2 py-1 rounded border truncate transition-all hover:shadow-sm',
              getStatusColor(task.status)
            ]"
            @click.stop="emit('selectTask', task)"
          >
            {{ task.title }}
          </div>
          <div
            v-if="day.tasks.length > 3"
            class="text-xs text-muted-foreground px-2 py-1"
          >
            +{{ day.tasks.length - 3 }} más
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
