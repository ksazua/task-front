<script setup lang="ts">
import draggable from 'vuedraggable'
import TaskCard from './TaskCard.vue'
import { Button } from '~/components/ui/button'
import { useTasksStore, type Task, type TaskStatus } from '~/stores/tasks'
import { Plus, Target, Loader2, CheckCircle2, Circle } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  status: TaskStatus
  tasks: Task[]
}>()

const emit = defineEmits<{
  (e:'create', status: TaskStatus):void
  (e:'edit', task: Task):void
  (e:'delete', id:string):void
  (e:'drop-to', status: TaskStatus, ids: string[]):void
}>()

const list = computed({
  get: () => props.tasks,
  set: () => {
    // No hacer nada aquí - manejamos todo en onChange
  }
})

const group = { name: 'tasks', pull: true, put: true }

function onChange(e: any) {
  if (e.added) {
    const task = e.added.element
    if (task) {
      useTasksStore().move(task.id, props.status, e.added.newIndex)
    }
  }
  // Siempre emitir el nuevo orden cuando hay cambios
  const newOrder = props.tasks.map(t => t.id)
  emit('drop-to', props.status, newOrder)
}
</script>

<template>
  <section class="bg-gray-50/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 h-fit">
    <div class="flex items-center justify-between mb-3 sm:mb-4 px-0.5 sm:px-1">
      <div class="flex items-center gap-1.5 sm:gap-2">
        <component 
          :is="status === 'planned' ? Target : status === 'in_progress' ? Loader2 : CheckCircle2" 
          :size="16" 
          :class="status === 'planned' ? 'text-gray-400' : status === 'in_progress' ? 'text-orange-400' : 'text-emerald-500'"
          class="sm:w-[18px] sm:h-[18px]"
        />
        <h3 class="text-xs sm:text-sm font-semibold text-gray-700">{{ title }}</h3>
      </div>
      <Button size="icon" variant="ghost" class="h-6 w-6 sm:h-7 sm:w-7 rounded-full" @click="emit('create', props.status)">
        <Plus :size="14" class="sm:w-4 sm:h-4 text-gray-500"/>
      </Button>
    </div>

    <draggable
      v-model="list"
      :group="group"
      item-key="id"
      class="min-h-[150px] sm:min-h-[200px] space-y-2 sm:space-y-3 pb-2"
      @change="onChange"
    >
      <template #item="{ element }">
        <TaskCard :task="element" @edit="t => emit('edit', t)" @delete="id => emit('delete', id)" />
      </template>
    </draggable>
  </section>
</template>
