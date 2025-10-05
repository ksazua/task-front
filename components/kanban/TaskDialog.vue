<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import { useTasksStore, type Task, type TaskStatus, type Tag } from '~/stores/tasks'
import { X } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  mode: 'create'|'edit'
  initial?: Partial<Task> & { status?: TaskStatus }
}>()
const emit = defineEmits<{ (e:'close'):void }>()

const tasks = useTasksStore()
const title = ref(props.initial?.title ?? '')
const description = ref(props.initial?.description ?? '')
const startNow = ref(false) // Por defecto permite seleccionar fecha
const startDate = ref(props.initial?.startDate?.slice(0,10) ?? '')
const dueDate = ref(props.initial?.dueDate?.slice(0,10) ?? '')
const status = ref<TaskStatus>(props.initial?.status ?? 'planned')
const selectedTags = ref<Tag[]>(props.initial?.tags ?? [])

// Calcular la fecha mínima para dueDate
const minDueDate = computed(() => {
  if (startNow.value) {
    return new Date().toISOString().slice(0, 10)
  }
  return startDate.value || new Date().toISOString().slice(0, 10)
})

watch(() => props.open, (o) => {
  if (o) {
    title.value = props.initial?.title ?? ''
    description.value = props.initial?.description ?? ''
    startNow.value = false // Por defecto muestra el input de fecha
    startDate.value = props.initial?.startDate?.slice(0,10) ?? ''
    dueDate.value = props.initial?.dueDate?.slice(0,10) ?? ''
    status.value = props.initial?.status ?? 'planned'
    selectedTags.value = props.initial?.tags ?? []
  }
})

function toggleTag(tag: Tag) {
  const index = selectedTags.value.findIndex(t => t.id === tag.id)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
}

function submit() {
  if (!title.value.trim()) return
  
  const taskStartDate = startNow.value 
    ? new Date().toISOString() 
    : startDate.value ? new Date(startDate.value).toISOString() : undefined
  
  if (props.mode === 'create') {
    tasks.create({
      title: title.value.trim(),
      description: description.value.trim(),
      startDate: taskStartDate,
      dueDate: dueDate.value ? new Date(dueDate.value).toISOString() : undefined,
      status: status.value,
      tags: selectedTags.value,
    })
  } else if (props.initial?.id) {
    tasks.update(props.initial.id, {
      title: title.value.trim(),
      description: description.value.trim(),
      startDate: taskStartDate,
      dueDate: dueDate.value ? new Date(dueDate.value).toISOString() : undefined,
      status: status.value,
      tags: selectedTags.value,
    })
  }
  emit('close')
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ mode === 'create' ? 'Nueva tarea' : 'Editar tarea' }}</DialogTitle>
      </DialogHeader>

      <div class="grid gap-4">
        <div>
          <label class="text-sm font-medium mb-1.5 block">Título</label>
          <Input v-model="title" placeholder="Nombre de la tarea" class="placeholder:text-muted-foreground/70" />
        </div>
        
        <div>
          <label class="text-sm font-medium mb-1.5 block">Descripción</label>
          <Textarea v-model="description" placeholder="Añade una descripción..." class="placeholder:text-muted-foreground/70" rows="3" />
        </div>

        <div>
          <label class="text-sm font-medium mb-2 block">Fecha de inicio</label>
          <Input 
            v-if="!startNow" 
            v-model="startDate" 
            type="date" 
            class="mb-2"
          />
          <div class="flex items-center gap-2">
            <Checkbox :checked="startNow" @update:checked="(val: boolean) => startNow = val" id="start-now" />
            <label for="start-now" class="text-sm cursor-pointer">Comenzar ahora</label>
          </div>
        </div>

        <div>
          <label class="text-sm font-medium mb-1.5 block">Fecha límite</label>
          <Input 
            v-model="dueDate" 
            type="date" 
            :min="minDueDate"
          />
        </div>

        <div>
          <label class="text-sm font-medium mb-1.5 block">Estado</label>
          <select v-model="status" class="w-full rounded-md border bg-background px-3 py-2 text-sm">
            <option value="planned">Planificado</option>
            <option value="in_progress">En progreso</option>
            <option value="done">Completado</option>
          </select>
        </div>

        <div>
          <label class="text-sm font-medium mb-2 block">Categorías</label>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="tag in tasks.tags"
              :key="tag.id"
              :variant="selectedTags.some(t => t.id === tag.id) ? 'default' : 'outline'"
              class="cursor-pointer hover:opacity-80 transition-opacity"
              :style="selectedTags.some(t => t.id === tag.id) && tag.color ? { backgroundColor: tag.color, borderColor: tag.color } : {}"
              @click="toggleTag(tag)"
            >
              {{ tag.name }}
              <X 
                v-if="selectedTags.some(t => t.id === tag.id)" 
                :size="12" 
                class="ml-1" 
              />
            </Badge>
          </div>
        </div>
      </div>

      <DialogFooter class="mt-2">
        <Button variant="outline" @click="emit('close')">Cancelar</Button>
        <Button @click="submit">{{ mode === 'create' ? 'Crear' : 'Guardar' }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
