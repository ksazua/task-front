<script setup lang="ts">
import AppSidebar from '~/components/kanban/AppSidebar.vue'
import KanbanHeader from '~/components/kanban/KanbanHeader.vue'
import BoardColumn from '~/components/kanban/BoardColumn.vue'
import TaskDialog from '~/components/kanban/TaskDialog.vue'
import BulkTaskDialog from '~/components/kanban/BulkTaskDialog.vue'
import { SidebarProvider, SidebarInset } from '~/components/ui/sidebar'
import { useTasksStore, type Task, type TaskStatus } from '~/stores/tasks'
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs/index'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Button } from '~/components/ui/button'
import { X } from 'lucide-vue-next'
import dayjs from 'dayjs'

const tasks = useTasksStore()

const dialogOpen = ref(false)
const dialogMode = ref<'create'|'edit'>('create')
const dialogInitial = ref<Partial<Task> & { status?: TaskStatus }>({ status: 'planned' })

const bulkDialogOpen = ref(false)

function openCreate(status: TaskStatus) {
  dialogMode.value = 'create'
  dialogInitial.value = { status }
  dialogOpen.value = true
}
function openEdit(t: Task) {
  dialogMode.value = 'edit'
  dialogInitial.value = { ...t }
  dialogOpen.value = true
}
function remove(id: string) { tasks.remove(id) }

function onDrop(status: TaskStatus, ids: string[]) {
  tasks.setOrder(status, ids)
}

function openBulkCreate() {
  bulkDialogOpen.value = true
}
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset class="flex flex-col overflow-hidden">
      <!-- Header moderno -->
      <KanbanHeader 
        v-model:search-query="tasks.q"
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

      <!-- Board -->
      <div class="flex-1 overflow-auto bg-white">
        <div class="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 pt-4 sm:pt-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <BoardColumn
              title="Planned"
              status="planned"
              :tasks="tasks.byStatus('planned')"
              @create="openCreate"
              @edit="openEdit"
              @delete="remove"
              @drop-to="onDrop"
            />
            <BoardColumn
              title="In Progress"
              status="in_progress"
              :tasks="tasks.byStatus('in_progress')"
              @create="openCreate"
              @edit="openEdit"
              @delete="remove"
              @drop-to="onDrop"
            />
            <BoardColumn
              title="Done"
              status="done"
              :tasks="tasks.byStatus('done')"
              @create="openCreate"
              @edit="openEdit"
              @delete="remove"
              @drop-to="onDrop"
            />
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

    <BulkTaskDialog
      :open="bulkDialogOpen"
      @close="bulkDialogOpen = false"
    />
  </SidebarProvider>
</template>
