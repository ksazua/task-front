<script setup lang="ts">
import { Card, CardContent } from '~/components/ui/card'
import TagChip from './TagChip.vue'
import { type Task } from '~/stores/tasks'
import dayjs from 'dayjs'
import { Calendar, Trash2 } from 'lucide-vue-next'

const props = defineProps<{ task: Task }>()
const emit = defineEmits<{ (e:'edit', task: Task):void; (e:'delete', id:string):void }>()

function onDelete(e: Event) {
  e.stopPropagation() // Evitar que se abra el diálogo de edición
  emit('delete', props.task.id)
}

function onEdit() {
  emit('edit', props.task)
}
</script>

<template>
  <Card class="rounded-xl sm:rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group" @click="onEdit">
    <CardContent class="p-3 sm:p-4 space-y-2 sm:space-y-3 relative">
      <!-- Botón eliminar -->
      <button 
        @click="onDelete"
        class="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
        title="Eliminar tarea"
      >
        <Trash2 :size="14" />
      </button>

      <!-- header: título, categoría y descripción -->
      <div>
        <div class="flex items-start justify-between gap-2 pr-6">
          <h4 class="font-semibold text-xs sm:text-sm leading-tight text-gray-900 flex-1">{{ task.title }}</h4>
          <span v-if="task.category" class="text-[10px] sm:text-[11px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md whitespace-nowrap">
            {{ task.category }}
          </span>
        </div>
        <p v-if="task.description" class="mt-1 text-[11px] sm:text-xs text-gray-500 line-clamp-2">
          {{ task.description }}
        </p>
      </div>

      <!-- fecha límite -->
      <div v-if="task.dueDate" class="flex items-center text-[11px] sm:text-xs">
        <div class="inline-flex items-center gap-1 sm:gap-1.5 text-gray-600">
          <Calendar :size="12" class="sm:w-[14px] sm:h-[14px] text-gray-400" /> 
          <span>{{ dayjs(task.dueDate).format('DD MMM') }}</span>
        </div>
      </div>
      <div v-else class="flex items-center text-[11px] sm:text-xs">
        <div class="inline-flex items-center gap-1 sm:gap-1.5 text-gray-400">
          <Calendar :size="12" class="sm:w-[14px] sm:h-[14px]" /> 
          <span>Sin fecha</span>
        </div>
      </div>

      <!-- tags con outline -->
      <div v-if="task.tags && task.tags.length > 0" class="flex flex-wrap gap-1 sm:gap-1.5 pt-2 sm:pt-3 border-t">
        <TagChip v-for="tg in task.tags" :key="tg.id" :label="tg.name" :color="tg.color" />
      </div>
    </CardContent>
  </Card>
</template>
