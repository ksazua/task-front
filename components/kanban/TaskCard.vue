<script setup lang="ts">
import { Card, CardContent } from '~/components/ui/card'
import TagChip from './TagChip.vue'
import { type Task } from '~/stores/tasks'
import dayjs from 'dayjs'
import { Calendar } from 'lucide-vue-next'

const props = defineProps<{ task: Task }>()
const emit = defineEmits<{ (e:'edit', task: Task):void; (e:'delete', id:string):void }>()
</script>

<template>
  <Card class="rounded-xl sm:rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" @click="emit('edit', task)">
    <CardContent class="p-3 sm:p-4 space-y-2 sm:space-y-3">
      <!-- header: título y descripción -->
      <div>
        <h4 class="font-semibold text-xs sm:text-sm leading-tight text-gray-900">{{ task.title }}</h4>
        <p v-if="task.description" class="mt-1 text-[11px] sm:text-xs text-gray-500 line-clamp-2">
          {{ task.description }}
        </p>
      </div>

      <!-- fecha límite -->
      <div class="flex items-center text-[11px] sm:text-xs">
        <div class="inline-flex items-center gap-1 sm:gap-1.5 text-gray-600">
          <Calendar :size="12" class="sm:w-[14px] sm:h-[14px] text-gray-400" /> 
          <span>{{ dayjs(task.dueDate).format('DD MMM') }}</span>
        </div>
      </div>

      <!-- tags con outline -->
      <div v-if="task.tags && task.tags.length > 0" class="flex flex-wrap gap-1 sm:gap-1.5 pt-2 sm:pt-3 border-t">
        <TagChip v-for="tg in task.tags" :key="tg.id" :label="tg.name" :color="tg.color" />
      </div>
    </CardContent>
  </Card>
</template>
