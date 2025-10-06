<script setup lang="ts">
import AppSidebar from '~/components/kanban/AppSidebar.vue'
import CalendarHeader from '~/components/calendario/CalendarHeader.vue'

// Nota: La autenticación es manejada por middleware/auth.global.ts

import CalendarGrid from '~/components/calendario/CalendarGrid.vue'
import TaskDetailSheet from '~/components/calendario/TaskDetailSheet.vue'
import TaskDialog from '~/components/kanban/TaskDialog.vue'
import { SidebarProvider, SidebarInset } from '~/components/ui/sidebar'
import { useTasksStore, type Task } from '~/stores/tasks'
import dayjs from 'dayjs'

const tasks = useTasksStore()

// Cargar tareas al montar el componente
onMounted(async () => {
  console.log('🚀 Cargando tareas desde la API (Calendario)...')
  await tasks.fetchTasks()
})

// Estado
const currentDate = ref(dayjs().format('YYYY-MM-DD'))
const selectedTask = ref<Task | null>(null)
const sheetOpen = ref(false)
const dialogOpen = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogInitial = ref<Partial<Task>>({})

// Abrir detalles de tarea
function handleSelectTask(task: Task) {
  selectedTask.value = task
  sheetOpen.value = true
}

// Abrir dialog para editar
function handleEditTask(task: Task) {
  dialogMode.value = 'edit'
  dialogInitial.value = { ...task }
  dialogOpen.value = true
  sheetOpen.value = false
}

// Eliminar tarea
function handleDeleteTask(taskId: string) {
  tasks.remove(taskId)
}

// Seleccionar fecha (podría abrir dialog para crear tarea)
function handleSelectDate(date: string) {
  console.log('Fecha seleccionada:', date)
  // Opcional: abrir dialog para crear tarea en esa fecha
}
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="flex flex-col overflow-hidden">
      <!-- Header -->
      <CalendarHeader 
        v-model:current-date="currentDate"
      />

      <!-- Calendar Grid -->
      <div class="flex-1 overflow-auto bg-background">
        <div class="p-3 sm:p-4 md:p-6">
          <CalendarGrid 
            :current-date="currentDate"
            @select-task="handleSelectTask"
            @select-date="handleSelectDate"
          />
        </div>
      </div>
    </SidebarInset>

    <!-- Task Detail Sheet -->
    <TaskDetailSheet
      :open="sheetOpen"
      :task="selectedTask"
      @close="sheetOpen = false"
      @edit="handleEditTask"
      @delete="handleDeleteTask"
    />

    <!-- Task Dialog (para editar) -->
    <TaskDialog
      :open="dialogOpen"
      :mode="dialogMode"
      :initial="dialogInitial"
      @close="dialogOpen = false"
    />
  </SidebarProvider>
</template>
