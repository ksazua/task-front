<script setup lang="ts">
import AppSidebar from '~/components/kanban/AppSidebar.vue'
import CalendarHeader from '~/components/calendario/CalendarHeader.vue'
import CalendarGrid from '~/components/calendario/CalendarGrid.vue'
import TaskDetailSheet from '~/components/calendario/TaskDetailSheet.vue'
import TaskDialog from '~/components/kanban/TaskDialog.vue'
import { SidebarProvider, SidebarInset } from '~/components/ui/sidebar'
import { Button } from '~/components/ui/button'
import { useTasksStore, type Task } from '~/stores/tasks'
import dayjs from 'dayjs'

const tasks = useTasksStore()

// Estado
const currentDate = ref(dayjs().format('YYYY-MM-DD'))
const selectedTask = ref<Task | null>(null)
const sheetOpen = ref(false)
const dialogOpen = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const dialogInitial = ref<Partial<Task>>({})

// Estado para controlar si es la primera carga
const isInitialLoading = ref(true)

// Función para cargar tareas del calendario
const loadCalendarTasks = async (date: string, isInitial = false) => {
  const year = dayjs(date).year()
  const month = dayjs(date).month() + 1 // dayjs usa 0-11, API usa 1-12
  
  try {
    tasks.loading = true
    const response: any = await $fetch(`/api/tasks/calendar/${year}/${month}`)
    
    if (response?.success && response?.data?.tasks) {
      // Convertir tareas de la API al formato local
      const calendarTasks = response.data.tasks.map((apiTask: any) => ({
        id: String(apiTask.id),
        title: apiTask.title,
        description: apiTask.description || '',
        startDate: apiTask.start_date,
        dueDate: apiTask.deadline,
        category: apiTask.category,
        status: apiTask.status === 'planificado' ? 'planned' : 
                apiTask.status === 'en_progreso' ? 'in_progress' : 'done',
        createdAt: apiTask.created_at,
        tags: []
      }))
      
      // Actualizar las tareas en el store
      tasks.tasks = calendarTasks
    }
  } catch (error) {
    tasks.error = 'Error al cargar tareas del calendario'
  } finally {
    tasks.loading = false
    if (isInitial) {
      isInitialLoading.value = false
    }
  }
}

// Cargar tareas al montar el componente
onMounted(async () => {
  await loadCalendarTasks(currentDate.value, true)
})

// Recargar tareas cuando cambie el mes
watch(currentDate, async (newDate) => {
  await loadCalendarTasks(newDate)
})

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
          <!-- Loading state -->
          <div v-if="isInitialLoading || tasks.loading" class="flex items-center justify-center py-12">
            <div class="flex flex-col items-center gap-3">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p class="text-sm text-gray-500">{{ isInitialLoading ? 'Cargando calendario...' : 'Actualizando...' }}</p>
            </div>
          </div>

          <!-- Error state -->
          <div v-else-if="tasks.error" class="flex items-center justify-center py-12">
            <div class="flex flex-col items-center gap-3 text-center">
              <div class="text-red-500 text-lg">⚠️</div>
              <p class="text-sm text-red-600">{{ tasks.error }}</p>
              <Button @click="loadCalendarTasks(currentDate)" variant="outline" size="sm">
                Reintentar
              </Button>
            </div>
          </div>

          <!-- Calendar content -->
          <CalendarGrid 
            v-else
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
