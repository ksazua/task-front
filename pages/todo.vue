<script setup lang="ts">
import AppSidebar from '~/components/kanban/AppSidebar.vue'
import KanbanHeader from '~/components/kanban/KanbanHeader.vue'

// Nota: La autenticación es manejada por middleware/auth.global.ts

import TaskDialog from '~/components/kanban/TaskDialog.vue'
import { SidebarProvider, SidebarInset } from '~/components/ui/sidebar'
import { useTasksStore, type Task, type TaskStatus } from '~/stores/tasks'
import { Checkbox } from '~/components/ui/checkbox'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs/index'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import TagChip from '~/components/kanban/TagChip.vue'
import { Calendar, Edit, Trash2, X } from 'lucide-vue-next'
import dayjs from 'dayjs'

const tasks = useTasksStore()

const dialogOpen = ref(false)
const dialogMode = ref<'create'|'edit'>('create')
const dialogInitial = ref<Partial<Task> & { status?: TaskStatus }>({ status: 'planned' })

// Estado para manejar las tareas que están en transición (tachadas pero aún en su estado original)
const tasksInTransition = ref<Set<string>>(new Set())

// Agrupar tareas por estado
const tasksByStatus = computed(() => ({
  planned: tasks.filtered.filter(t => t.status === 'planned'),
  in_progress: tasks.filtered.filter(t => t.status === 'in_progress'),
  done: tasks.filtered.filter(t => t.status === 'done'),
}))

function openCreate() {
  dialogMode.value = 'create'
  dialogInitial.value = { status: 'planned' }
  dialogOpen.value = true
}

function openEdit(task: Task) {
  dialogMode.value = 'edit'
  dialogInitial.value = { ...task }
  dialogOpen.value = true
}

function handleCheckChange(task: Task, checked: boolean) {
  if (checked) {
    // Marcar como en transición (se tacha visualmente)
    tasksInTransition.value.add(task.id)
    
    // Después de 500ms, cambiar el estado real
    setTimeout(() => {
      let newStatus: TaskStatus
      
      if (task.status === 'planned') {
        newStatus = 'in_progress'
      } else if (task.status === 'in_progress') {
        newStatus = 'done'
      } else {
        newStatus = 'done'
      }
      
      tasks.update(task.id, { status: newStatus })
      tasksInTransition.value.delete(task.id)
    }, 500)
  } else {
    // Si desmarcamos, quitamos de transición y cambiamos estado inmediatamente
    tasksInTransition.value.delete(task.id)
    
    let newStatus: TaskStatus
    if (task.status === 'done') {
      newStatus = 'in_progress'
    } else if (task.status === 'in_progress') {
      newStatus = 'planned'
    } else {
      newStatus = 'planned'
    }
    
    tasks.update(task.id, { status: newStatus })
  }
}

function isChecked(task: Task): boolean {
  // El checkbox solo debe estar marcado en:
  // - Planned que está en transición (a punto de moverse a in_progress)
  // - In Progress que está en transición (a punto de moverse a done)
  // - Done (siempre marcado)
  if (tasksInTransition.value.has(task.id)) {
    return true // Marcado durante la transición
  }
  // Solo Done está permanentemente marcado
  return task.status === 'done'
}

function isInTransition(taskId: string): boolean {
  return tasksInTransition.value.has(taskId)
}

function getStatusLabel(status: TaskStatus): string {
  const labels = {
    planned: 'Pendiente',
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
        @create-task="openCreate"
      />

      <!-- Filtros -->
      <div class="px-3 sm:px-4 md:px-6 py-3 border-b bg-card shrink-0">
        <!-- Todos los filtros en una línea flex -->
        <div class="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
          <!-- Tabs de estado -->
          <Tabs :model-value="tasks.statusFilter" @update:model-value="(val: any) => tasks.statusFilter = val">
            <TabsList class="w-full lg:w-auto">
              <TabsTrigger value="all" class="flex-1 lg:flex-none">Todos</TabsTrigger>
              <TabsTrigger value="planned" class="flex-1 lg:flex-none">Planned</TabsTrigger>
              <TabsTrigger value="in_progress" class="flex-1 lg:flex-none">In Progress</TabsTrigger>
              <TabsTrigger value="done" class="flex-1 lg:flex-none">Done</TabsTrigger>
            </TabsList>
          </Tabs>

          <!-- Separador vertical (solo desktop) -->
          <div class="hidden lg:block w-px h-8 bg-border"></div>

          <!-- Filtros adicionales -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <!-- Filtro por fecha -->
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-muted-foreground shrink-0">Fecha:</label>
              <div class="relative flex-1 sm:flex-none">
                <input
                  v-model="tasks.dateFilter"
                  type="date"
                  class="w-full sm:w-[180px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Seleccionar fecha"
                />
                <button
                  v-if="tasks.dateFilter"
                  @click="tasks.dateFilter = ''"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X :size="14" />
                </button>
              </div>
            </div>

            <!-- Filtro por tag -->
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-muted-foreground shrink-0">Categoría:</label>
              <Select v-model="tasks.tagFilter">
                <SelectTrigger class="w-full sm:w-[180px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem v-for="tag in tasks.tags" :key="tag.id" :value="tag.id">
                    {{ tag.name }}
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
          <div class="space-y-8">
            <!-- Planned Tasks -->
            <section v-if="tasksByStatus.planned.length > 0">
              <div class="flex items-center gap-2 mb-4">
                <div class="h-8 w-1 bg-gray-400 rounded-full"></div>
                <h2 class="text-lg font-semibold text-gray-900">Pendientes</h2>
                <span class="text-sm text-muted-foreground">({{ tasksByStatus.planned.length }})</span>
              </div>
              <div class="space-y-2">
                <Card 
                  v-for="task in tasksByStatus.planned" 
                  :key="task.id"
                  class="hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <CardContent class="p-4">
                    <div class="flex items-start gap-3">
                      <!-- Checkbox -->
                      <Checkbox 
                        :checked="isChecked(task)"
                        @update:checked="(val: boolean) => handleCheckChange(task, val)"
                        class="mt-0.5"
                      />
                      
                      <!-- Content -->
                      <div class="flex-1 min-w-0" @click="openEdit(task)">
                        <div class="flex items-start justify-between gap-3 mb-1">
                          <h3 class="font-medium text-sm leading-tight transition-all duration-300" :class="isInTransition(task.id) ? 'text-gray-500 line-through' : 'text-gray-900'">
                            {{ task.title }}
                          </h3>
                          <Badge :class="getStatusColor(task.status)" class="shrink-0 text-xs">
                            {{ getStatusLabel(task.status) }}
                          </Badge>
                        </div>
                        
                        <p v-if="task.description" class="text-xs mb-2 line-clamp-2 transition-all duration-300" :class="isInTransition(task.id) ? 'text-gray-400 line-through' : 'text-muted-foreground'">
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
                          @click.stop="tasks.remove(task.id)"
                        >
                          <Trash2 :size="14" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <!-- In Progress Tasks -->
            <section v-if="tasksByStatus.in_progress.length > 0">
              <div class="flex items-center gap-2 mb-4">
                <div class="h-8 w-1 bg-orange-400 rounded-full"></div>
                <h2 class="text-lg font-semibold text-gray-900">En Progreso</h2>
                <span class="text-sm text-muted-foreground">({{ tasksByStatus.in_progress.length }})</span>
              </div>
              <div class="space-y-2">
                <Card 
                  v-for="task in tasksByStatus.in_progress" 
                  :key="task.id"
                  class="hover:shadow-md transition-shadow cursor-pointer group"
                >
                  <CardContent class="p-4">
                    <div class="flex items-start gap-3">
                      <!-- Checkbox -->
                      <Checkbox 
                        :checked="isChecked(task)"
                        @update:checked="(val: boolean) => handleCheckChange(task, val)"
                        class="mt-0.5"
                      />
                      
                      <!-- Content -->
                      <div class="flex-1 min-w-0" @click="openEdit(task)">
                        <div class="flex items-start justify-between gap-3 mb-1">
                          <h3 class="font-medium text-sm leading-tight transition-all duration-300" :class="isInTransition(task.id) ? 'text-gray-500 line-through' : 'text-gray-900'">
                            {{ task.title }}
                          </h3>
                          <Badge :class="getStatusColor(task.status)" class="shrink-0 text-xs">
                            {{ getStatusLabel(task.status) }}
                          </Badge>
                        </div>
                        
                        <p v-if="task.description" class="text-xs mb-2 line-clamp-2 transition-all duration-300" :class="isInTransition(task.id) ? 'text-gray-400 line-through' : 'text-muted-foreground'">
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
                          @click.stop="tasks.remove(task.id)"
                        >
                          <Trash2 :size="14" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <!-- Done Tasks -->
            <section v-if="tasksByStatus.done.length > 0">
              <div class="flex items-center gap-2 mb-4">
                <div class="h-8 w-1 bg-emerald-500 rounded-full"></div>
                <h2 class="text-lg font-semibold text-gray-900">Completadas</h2>
                <span class="text-sm text-muted-foreground">({{ tasksByStatus.done.length }})</span>
              </div>
              <div class="space-y-2">
                <Card 
                  v-for="task in tasksByStatus.done" 
                  :key="task.id"
                  class="hover:shadow-md transition-shadow cursor-pointer group opacity-75"
                >
                  <CardContent class="p-4">
                    <div class="flex items-start gap-3">
                      <!-- Sin Checkbox en Done -->
                      <div class="w-4 h-4 mt-0.5 shrink-0"></div>
                      
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
                          @click.stop="tasks.remove(task.id)"
                        >
                          <Trash2 :size="14" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            <!-- Empty state -->
            <div v-if="tasks.filtered.length === 0" class="text-center py-12">
              <p class="text-muted-foreground">No hay tareas para mostrar</p>
              <Button @click="openCreate" class="mt-4">
                Crear primera tarea
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>

    <TaskDialog
      :open="dialogOpen"
      :mode="dialogMode"
      :initial="dialogInitial"
      @close="dialogOpen = false"
    />
  </SidebarProvider>
</template>
