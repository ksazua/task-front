<script setup lang="ts">
import AppSidebar from '~/components/kanban/AppSidebar.vue'
import KanbanHeader from '~/components/kanban/KanbanHeader.vue'

// Nota: La autenticación es manejada por middleware/auth.global.ts

import TaskDialog from '~/components/kanban/TaskDialog.vue'
import BulkTaskDialog from '~/components/kanban/BulkTaskDialog.vue'
import { SidebarProvider, SidebarInset } from '~/components/ui/sidebar'
import { useTasksStore, type Task, type TaskStatus } from '~/stores/tasks'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs/index'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

import { Calendar, Edit, Trash2, X } from 'lucide-vue-next'
import dayjs from 'dayjs'
import { toast } from 'vue-sonner'
import type { CategoryResponse } from '~/types/api'
import draggable from 'vuedraggable'

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



// Agrupar tareas por estado - usar la lista completa de tareas, no filtrada
const tasksByStatus = computed(() => ({
  planned: tasks.tasks.filter(t => t.status === 'planned'),
  in_progress: tasks.tasks.filter(t => t.status === 'in_progress'),
  done: tasks.tasks.filter(t => t.status === 'done'),
}))

function openCreate() {
  dialogMode.value = 'create'
  dialogInitial.value = { status: 'planned' }
  dialogOpen.value = true
}

async function openEdit(task: Task) {
  dialogMode.value = 'edit'
  dialogInitial.value = { ...task }
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

function onDialogClose() {
  dialogOpen.value = false
  // Refrescar la lista después de cerrar el diálogo (puede haber habido cambios)
  applyFilters()
}

function openBulkCreate() {
  bulkDialogOpen.value = true
}

function onBulkDialogClose() {
  bulkDialogOpen.value = false
  // Refrescar las tareas después de crear tareas masivas
  applyFilters()
}

// Manejar drag and drop
function handleDragChange(event: any, status: TaskStatus) {
  if (event.added) {
    const task = event.added.element
    if (task && task.status !== status) {
      tasks.move(task.id, status)
    }
  }
}









function getStatusLabel(status: TaskStatus): string {
  const labels = {
    planned: 'Planificado',
    in_progress: 'En Progreso',
    done: 'Completado'
  }
  return labels[status]
}

function getStatusColor(status: TaskStatus): string {
  const colors = {
    planned: 'text-gray-600 bg-gray-100',
    in_progress: 'text-orange-600 bg-orange-100',
    done: 'text-emerald-600 bg-emerald-100'
  }
  return colors[status]
}
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="flex flex-col overflow-hidden">
      <!-- Header -->
      <KanbanHeader 
        v-model:search-query="tasks.q"
        breadcrumb-title="To-Do List"
        @create-task="openCreate"
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

      <!-- Content -->
      <div class="flex-1 overflow-auto bg-background">
        <div class="px-3 sm:px-4 md:px-6 py-4 sm:py-6 max-w-5xl mx-auto">
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
              <Button @click="tasks.fetchTasks()" variant="outline" size="sm">
                Reintentar
              </Button>
            </div>
          </div>

          <!-- Tasks content -->
          <div v-else class="space-y-8">
            <!-- Planned Tasks -->
            <section v-if="tasksByStatus.planned.length > 0">
              <div class="flex items-center gap-2 mb-4">
                <div class="h-8 w-1 bg-gray-400 rounded-full"></div>
                <h2 class="text-lg font-semibold text-gray-900">Planificadas</h2>
                <span class="text-sm text-muted-foreground">({{ tasksByStatus.planned.length }})</span>
              </div>
              <draggable
                v-model="tasksByStatus.planned"
                group="tasks"
                item-key="id"
                class="space-y-2"
                @change="(e) => handleDragChange(e, 'planned')"
              >
                <template #item="{ element: task }">
                  <Card 
                    class="hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <CardContent class="p-4">
                      <div class="flex items-start gap-3">
                        <!-- Content -->
                      <div class="flex-1 min-w-0" @click="openEdit(task)">
                        <div class="flex items-start justify-between gap-3 mb-1">
                          <h3 class="font-medium text-sm leading-tight text-gray-900">
                            {{ task.title }}
                          </h3>
                          <Badge :class="getStatusColor(task.status)" class="shrink-0 text-xs">
                            {{ getStatusLabel(task.status) }}
                          </Badge>
                        </div>
                        
                        <p v-if="task.description" class="text-xs mb-2 line-clamp-2 text-muted-foreground">
                          {{ task.description }}
                        </p>
                        
                        <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <div v-if="task.dueDate" class="flex items-center gap-1">
                            <Calendar :size="12" />
                            <span>{{ dayjs(task.dueDate).format('DD MMM YYYY') }}</span>
                          </div>
                          
                          <div v-if="task.tags && task.tags.length > 0" class="flex gap-1">
                            <TagChip v-for="tag in task.tags" :key="tag.id" :label="tag.name" :color="tag.color" />
                          </div>
                        </div>
                      </div>
                      
                      <!-- Actions -->
                      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          class="h-8 w-8"
                          @click.stop="openEdit(task)"
                        >
                          <Edit :size="14" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          class="h-8 w-8 text-destructive hover:text-destructive"
                          @click.stop="remove(task.id)"
                        >
                          <Trash2 :size="14" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </template>
              </draggable>
            </section>

            <!-- In Progress Tasks -->
            <section v-if="tasksByStatus.in_progress.length > 0">
              <div class="flex items-center gap-2 mb-4">
                <div class="h-8 w-1 bg-orange-400 rounded-full"></div>
                <h2 class="text-lg font-semibold text-gray-900">En Progreso</h2>
                <span class="text-sm text-muted-foreground">({{ tasksByStatus.in_progress.length }})</span>
              </div>
              <draggable
                v-model="tasksByStatus.in_progress"
                group="tasks"
                item-key="id"
                class="space-y-2"
                @change="(e) => handleDragChange(e, 'in_progress')"
              >
                <template #item="{ element: task }">
                  <Card 
                    class="hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <CardContent class="p-4">
                      <div class="flex items-start gap-3">
                        <!-- Content -->
                      <div class="flex-1 min-w-0" @click="openEdit(task)">
                        <div class="flex items-start justify-between gap-3 mb-1">
                          <h3 class="font-medium text-sm leading-tight text-gray-900">
                            {{ task.title }}
                          </h3>
                          <Badge :class="getStatusColor(task.status)" class="shrink-0 text-xs">
                            {{ getStatusLabel(task.status) }}
                          </Badge>
                        </div>
                        
                        <p v-if="task.description" class="text-xs mb-2 line-clamp-2 text-muted-foreground">
                          {{ task.description }}
                        </p>
                        
                        <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <div v-if="task.dueDate" class="flex items-center gap-1">
                            <Calendar :size="12" />
                            <span>{{ dayjs(task.dueDate).format('DD MMM YYYY') }}</span>
                          </div>
                          
                          <div v-if="task.tags && task.tags.length > 0" class="flex gap-1">
                            <TagChip v-for="tag in task.tags" :key="tag.id" :label="tag.name" :color="tag.color" />
                          </div>
                        </div>
                      </div>
                      
                      <!-- Actions -->
                      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          class="h-8 w-8"
                          @click.stop="openEdit(task)"
                        >
                          <Edit :size="14" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          class="h-8 w-8 text-destructive hover:text-destructive"
                          @click.stop="remove(task.id)"
                        >
                          <Trash2 :size="14" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </template>
              </draggable>
            </section>

            <!-- Done Tasks -->
            <section v-if="tasksByStatus.done.length > 0">
              <div class="flex items-center gap-2 mb-4">
                <div class="h-8 w-1 bg-emerald-500 rounded-full"></div>
                <h2 class="text-lg font-semibold text-gray-900">Completadas</h2>
                <span class="text-sm text-muted-foreground">({{ tasksByStatus.done.length }})</span>
              </div>
              <draggable
                v-model="tasksByStatus.done"
                group="tasks"
                item-key="id"
                class="space-y-2"
                @change="(e) => handleDragChange(e, 'done')"
              >
                <template #item="{ element: task }">
                  <Card 
                    class="hover:shadow-md transition-shadow cursor-pointer group opacity-75"
                  >
                    <CardContent class="p-4">
                      <div class="flex items-start gap-3">
                        <!-- Content -->
                      <div class="flex-1 min-w-0" @click="openEdit(task)">
                        <div class="flex items-start justify-between gap-3 mb-1">
                          <h3 class="font-medium text-sm leading-tight text-gray-500 line-through">
                            {{ task.title }}
                          </h3>
                          <Badge :class="getStatusColor(task.status)" class="shrink-0 text-xs">
                            {{ getStatusLabel(task.status) }}
                          </Badge>
                        </div>
                        
                        <p v-if="task.description" class="text-xs text-gray-400 mb-2 line-clamp-2 line-through">
                          {{ task.description }}
                        </p>
                        
                        <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <div v-if="task.dueDate" class="flex items-center gap-1">
                            <Calendar :size="12" />
                            <span>{{ dayjs(task.dueDate).format('DD MMM YYYY') }}</span>
                          </div>
                          
                          <div v-if="task.tags && task.tags.length > 0" class="flex gap-1">
                            <TagChip v-for="tag in task.tags" :key="tag.id" :label="tag.name" :color="tag.color" />
                          </div>
                        </div>
                      </div>
                      
                      <!-- Actions -->
                      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          class="h-8 w-8"
                          @click.stop="openEdit(task)"
                        >
                          <Edit :size="14" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          class="h-8 w-8 text-destructive hover:text-destructive"
                          @click.stop="remove(task.id)"
                        >
                          <Trash2 :size="14" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </template>
              </draggable>
            </section>

            <!-- Empty state -->
            <div v-if="!isInitialLoading && !tasks.loading && tasksByStatus.planned.length === 0 && tasksByStatus.in_progress.length === 0 && tasksByStatus.done.length === 0" class="text-center py-12">
              <p class="text-muted-foreground">No hay tareas para mostrar</p>
              <Button @click="openCreate" class="mt-4">
                Crear primera tarea
              </Button>
            </div>
          </div>
          <!-- End of tasks content -->
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
