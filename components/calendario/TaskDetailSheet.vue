<script setup lang="ts">
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Progress } from '~/components/ui/progress'
import { Separator } from '~/components/ui/separator'
import { ScrollArea } from '~/components/ui/scroll-area'
import TagChip from '~/components/kanban/TagChip.vue'
import { Calendar, Clock, Link as LinkIcon, Paperclip, MessageSquare, Edit, Trash2 } from 'lucide-vue-next'
import { useTasksStore, type Task } from '~/stores/tasks'
import dayjs from 'dayjs'

const props = defineProps<{
  open: boolean
  task: Task | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'edit', task: Task): void
  (e: 'delete', taskId: string): void
}>()

const tasks = useTasksStore()

const statusLabel = computed(() => {
  if (!props.task) return ''
  const labels = {
    planned: 'Pendiente',
    in_progress: 'En Progreso',
    done: 'Completada'
  }
  return labels[props.task.status]
})

const statusColor = computed(() => {
  if (!props.task) return ''
  const colors = {
    planned: 'bg-blue-500',
    in_progress: 'bg-amber-500',
    done: 'bg-emerald-500'
  }
  return colors[props.task.status]
})

function formatDate(date?: string): string {
  if (!date) return 'No definida'
  return dayjs(date).format('DD MMM YYYY')
}

function handleEdit() {
  if (props.task) {
    emit('edit', props.task)
  }
}

function handleDelete() {
  if (props.task && confirm('¿Estás seguro de eliminar esta tarea?')) {
    emit('delete', props.task.id)
    emit('close')
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="(val) => !val && emit('close')">
    <SheetContent side="right" class="w-full sm:max-w-xl p-0 flex flex-col">
      <!-- Header -->
      <div v-if="task" class="px-6 pt-6 pb-4 border-b">
        <div class="flex items-start justify-between gap-4 mb-3">
          <SheetTitle class="text-2xl font-bold leading-tight pr-8">
            {{ task.title }}
          </SheetTitle>
          <Badge :class="statusColor" class="shrink-0 text-white">
            {{ statusLabel }}
          </Badge>
        </div>
        <SheetDescription v-if="task.description" class="text-base">
          {{ task.description }}
        </SheetDescription>
      </div>

      <!-- Content with Scroll -->
      <ScrollArea v-if="task" class="flex-1 px-6">
        <div class="space-y-6 py-6">
          <!-- Progreso -->
          <div v-if="task.progress !== undefined" class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold">Progreso</span>
              <span class="text-sm font-bold text-primary">{{ task.progress }}%</span>
            </div>
            <Progress :model-value="task.progress" class="h-2.5" />
          </div>

          <Separator />

          <!-- Fechas -->
          <div class="space-y-4">
            <h3 class="font-semibold flex items-center gap-2">
              <Calendar :size="18" class="text-primary" />
              Fechas
            </h3>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <p class="text-xs text-muted-foreground font-medium">Fecha de Inicio</p>
                <p class="text-sm font-semibold">{{ formatDate(task.startDate) }}</p>
              </div>
              <div class="space-y-1.5">
                <p class="text-xs text-muted-foreground font-medium">Fecha Límite</p>
                <p class="text-sm font-semibold">{{ formatDate(task.dueDate) }}</p>
              </div>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="task.tags && task.tags.length > 0" class="space-y-4">
            <h3 class="font-semibold">Categorías</h3>
            <div class="flex flex-wrap gap-2">
              <TagChip 
                v-for="tag in task.tags" 
                :key="tag.id" 
                :label="tag.name" 
                :color="tag.color"
              />
            </div>
          </div>

          <!-- Links -->
          <div v-if="Array.isArray(task.links) && task.links.length > 0" class="space-y-4">
            <h3 class="font-semibold flex items-center gap-2">
              <LinkIcon :size="18" class="text-primary" />
              Enlaces
            </h3>
            <div class="space-y-2">
              <a
                v-for="(link, idx) in task.links"
                :key="idx"
                :href="String(link)"
                target="_blank"
                rel="noopener noreferrer"
                class="block text-sm text-blue-600 hover:text-blue-700 hover:underline truncate p-2 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                {{ link }}
              </a>
            </div>
          </div>

          <!-- Attachments -->
          <div v-if="Array.isArray(task.attachments) && task.attachments.length > 0" class="space-y-4">
            <h3 class="font-semibold flex items-center gap-2">
              <Paperclip :size="18" class="text-primary" />
              Archivos Adjuntos
            </h3>
            <div class="space-y-2">
              <div
                v-for="(attachment, idx) in task.attachments"
                :key="idx"
                class="flex items-center gap-3 p-3 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <Paperclip :size="16" class="text-muted-foreground shrink-0" />
                <span class="flex-1 truncate text-sm font-medium">{{ attachment }}</span>
              </div>
            </div>
          </div>

          <!-- Comments -->
          <div v-if="Array.isArray(task.comments) && task.comments.length > 0" class="space-y-4">
            <h3 class="font-semibold flex items-center gap-2">
              <MessageSquare :size="18" class="text-primary" />
              Comentarios ({{ task.comments.length }})
            </h3>
            <div class="space-y-3">
              <div
                v-for="(comment, idx) in task.comments"
                :key="idx"
                class="p-4 rounded-lg bg-muted/40 text-sm leading-relaxed"
              >
                {{ comment }}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <!-- Actions Footer -->
      <div class="flex gap-3 px-6 py-4 border-t bg-muted/20">
        <Button variant="outline" class="flex-1" @click="handleEdit">
          <Edit :size="16" class="mr-2" />
          Editar
        </Button>
        <Button variant="outline" class="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground" @click="handleDelete">
          <Trash2 :size="16" class="mr-2" />
          Eliminar
        </Button>
      </div>
    </SheetContent>
  </Sheet>
</template>
