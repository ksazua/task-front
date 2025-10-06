<script setup lang="ts">
import AppSidebar from '~/components/kanban/AppSidebar.vue'
import KanbanHeader from '~/components/kanban/KanbanHeader.vue'
import BoardColumn from '~/components/kanban/BoardColumn.vue'
import TaskDialog from '~/components/kanban/TaskDialog.vue'
import BulkTaskDialog from '~/components/kanban/BulkTaskDialog.vue'
import { SidebarProvider, SidebarInset } from '~/components/ui/sidebar'
import { ref } from 'vue'
import { useTasksStore, type Task, type TaskStatus } from '~/stores/tasks'
import { toast } from 'vue-sonner'
import type { CategoryResponse } from '~/types/api'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs/index'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { X } from 'lucide-vue-next'
import dayjs from 'dayjs'

// Nota: La autenticación es manejada por middleware/auth.global.ts
// No necesitamos definePageMeta aquí

const tasks = useTasksStore()

// Estados para filtros adicionales
const startDateFrom = ref('')
const startDateTo = ref('')
const selectedCategory = ref('all')
const categories = ref<{category: string, count: number}[]>([])

// Estado para controlar si es la primera carga
const isInitialLoading = ref(true)

// Cargar tareas y categorías al montar el componente
onMounted(async () => {
  try {
    await Promise.all([
      tasks.fetchTasks(),
      fetchCategories()
    ])
  } finally {
    isInitialLoading.value = false
  }
})

// Función para obtener categorías
async function fetchCategories() {
  try {
    const response = await $fetch<CategoryResponse>('/api/categories')
    if (response.success) {
      categories.value = response.data
    }
  } catch (error) {
    // Error silencioso al cargar categorías
  }
}

// Función para aplicar filtros de API
async function applyFilters() {
  // No aplicar filtros si aún estamos en la carga inicial
  if (isInitialLoading.value) return
  
  const filters: any = {}
  
  // Filtro por estado (convertir de local a API)
  if (tasks.statusFilter !== 'all') {
    const statusMap = {
      'planned': 'planificado',
      'in_progress': 'en_progreso', 
      'done': 'completado'
    }
    filters.status = statusMap[tasks.statusFilter as keyof typeof statusMap]
  }
  
  // Filtro por categoría
  if (selectedCategory.value && selectedCategory.value !== 'all') {
    filters.category = selectedCategory.value
  }
  
  // Filtros de fecha
  if (startDateFrom.value) {
    filters.start_date_from = new Date(startDateFrom.value).toISOString()
  }
  if (startDateTo.value) {
    filters.start_date_to = new Date(startDateTo.value).toISOString()
  }
  
  // Búsqueda
  if (tasks.q) {
    filters.search = tasks.q
  }
  
  await tasks.fetchTasks(filters)
}

// Watchers para aplicar filtros automáticamente
watch([() => tasks.statusFilter, () => tasks.q, startDateFrom, startDateTo, selectedCategory], () => {
  applyFilters()
})

const dialogOpen = ref(false)
const dialogMode = ref<'create'|'edit'>('create')
const dialogInitial = ref<Partial<Task> & { status?: TaskStatus }>({ status: 'planned' })

const bulkDialogOpen = ref(false)

function openCreate(status: TaskStatus) {
  dialogMode.value = 'create'
  dialogInitial.value = { status }
  dialogOpen.value = true
}
async function openEdit(t: Task) {
  dialogMode.value = 'edit'
  dialogInitial.value = { ...t }
  dialogOpen.value = true
  // Refrescar categorías al editar por si hay nuevas categorías disponibles
  await fetchCategories()
}
async function remove(id: string) { 
  if (confirm('¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.')) {
    try {
      await tasks.remove(id)
      toast.success('Tarea eliminada correctamente')
    } catch (error) {
      toast.error('Error al eliminar la tarea')
    }
  }
}

function onDrop(status: TaskStatus, ids: string[]) {
  // Solo reordenar si es dentro de la misma columna
  // Los movimientos entre columnas los maneja BoardColumn.onChange
  const currentTasks = tasks.byStatus(status)
  
  if (currentTasks.length === ids.length) {
    tasks.setOrder(status, ids)
  }
}

function openBulkCreate() {
  bulkDialogOpen.value = true
}

async function onDialogClose() {
  dialogOpen.value = false
  // Refrescar las tareas para mostrar la nueva tarea creada o cambios
  await tasks.fetchTasks()
}

async function onBulkDialogClose() {
  bulkDialogOpen.value = false
  // Refrescar las tareas para mostrar las nuevas tareas creadas
  await tasks.fetchTasks()
}
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="flex flex-col overflow-hidden">
      <!-- Header moderno -->
      <KanbanHeader 
        v-model:search-query="tasks.q"
        breadcrumb-title="Tablero"
        @create-task="openCreate('planned')"
        @bulk-create="openBulkCreate"
      />

      <!-- Filtros -->
      <div class="px-3 sm:px-4 md:px-6 py-3 border-b bg-card shrink-0">
        <!-- Todos los filtros en una línea flex -->
        <div class="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
          <!-- Tabs de estado -->
          <Tabs :model-value="tasks.statusFilter" @update:model-value="(val: any) => tasks.statusFilter = val">
            <TabsList class="w-full lg:w-auto">
              <TabsTrigger value="all" class="flex-1 lg:flex-none">Todos</TabsTrigger>
              <TabsTrigger value="planned" class="flex-1 lg:flex-none">Planificado</TabsTrigger>
              <TabsTrigger value="in_progress" class="flex-1 lg:flex-none">En Progreso</TabsTrigger>
              <TabsTrigger value="done" class="flex-1 lg:flex-none">Completado</TabsTrigger>
            </TabsList>
          </Tabs>

          <!-- Separador vertical (solo desktop) -->
          <div class="hidden lg:block w-px h-8 bg-border"></div>

          <!-- Filtros adicionales -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <!-- Filtro por fecha inicio -->
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-muted-foreground shrink-0">Desde:</label>
              <div class="relative flex-1 sm:flex-none">
                <input
                  v-model="startDateFrom"
                  type="date"
                  class="w-full sm:w-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Fecha inicio"
                />
                <button
                  v-if="startDateFrom"
                  @click="startDateFrom = ''"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X :size="14" />
                </button>
              </div>
            </div>

            <!-- Filtro por fecha fin -->
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-muted-foreground shrink-0">Hasta:</label>
              <div class="relative flex-1 sm:flex-none">
                <input
                  v-model="startDateTo"
                  type="date"
                  class="w-full sm:w-[160px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Fecha fin"
                />
                <button
                  v-if="startDateTo"
                  @click="startDateTo = ''"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X :size="14" />
                </button>
              </div>
            </div>

            <!-- Filtro por categoría -->
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-muted-foreground shrink-0">Categoría:</label>
              <Select v-model="selectedCategory">
                <SelectTrigger class="w-full sm:w-[180px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem v-for="cat in categories" :key="cat.category" :value="cat.category">
                    {{ cat.category }} ({{ cat.count }})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <!-- Board -->
      <div class="flex-1 overflow-auto bg-white">
        <div class="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 pt-4 sm:pt-6">
          <!-- Loading state -->
          <div v-if="isInitialLoading || tasks.loading" class="flex items-center justify-center py-12">
            <div class="flex flex-col items-center gap-3">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p class="text-sm text-gray-500">{{ isInitialLoading ? 'Cargando tareas...' : 'Actualizando...' }}</p>
            </div>
          </div>

          <!-- Error state -->
          <div v-else-if="tasks.error" class="flex items-center justify-center py-12">
            <div class="flex flex-col items-center gap-3 text-center">
              <div class="text-red-500 text-lg">⚠️</div>
              <p class="text-sm text-red-600">{{ tasks.error }}</p>
              <Button @click="tasks.fetchTasks(); tasks.clearError()" variant="outline" size="sm">
                Reintentar
              </Button>
            </div>
          </div>

          <!-- Kanban Board -->
          <div v-else-if="!isInitialLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <BoardColumn
              title="Planificado"
              status="planned"
              :tasks="tasks.byStatus('planned')"
              @create="openCreate"
              @edit="openEdit"
              @delete="remove"
              @drop-to="onDrop"
            />
            <BoardColumn
              title="En Progreso"
              status="in_progress"
              :tasks="tasks.byStatus('in_progress')"
              @create="openCreate"
              @edit="openEdit"
              @delete="remove"
              @drop-to="onDrop"
            />
            <BoardColumn
              title="Completado"
              status="done"
              :tasks="tasks.byStatus('done')"
              @create="openCreate"
              @edit="openEdit"
              @delete="remove"
              @drop-to="onDrop"
            />
          </div>
          <!-- End of Kanban Board -->
        </div>
      </div>
    </SidebarInset>

    <TaskDialog
      :open="dialogOpen"
      :mode="dialogMode"
      :initial="dialogInitial"
      @close="onDialogClose"
    />

    <BulkTaskDialog
      :open="bulkDialogOpen"
      @close="onBulkDialogClose"
    />
  </SidebarProvider>
</template>
