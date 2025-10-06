<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Button } from '~/components/ui/button'
import { Checkbox } from '~/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { useTasksStore, type Task, type TaskStatus } from '~/stores/tasks'
import { Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
  mode: 'create'|'edit'
  initial?: Partial<Task> & { status?: TaskStatus }
}>()
const emit = defineEmits<{ (e:'close'):void }>()

const tasks = useTasksStore()
const title = ref(props.initial?.title ?? '')
const description = ref(props.initial?.description ?? '')
const category = ref(props.initial?.category ?? '')
const startNow = ref(false) // Por defecto permite seleccionar fecha
const startDate = ref(props.initial?.startDate?.slice(0,10) ?? '')
const dueDate = ref(props.initial?.dueDate?.slice(0,10) ?? '')
const status = ref<TaskStatus>(props.initial?.status ?? 'planned')
const isLoading = ref(false)

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
    category.value = props.initial?.category ?? ''
    startNow.value = false // Por defecto muestra el input de fecha
    startDate.value = props.initial?.startDate?.slice(0,10) ?? ''
    dueDate.value = props.initial?.dueDate?.slice(0,10) ?? ''
    status.value = props.initial?.status ?? 'planned'

  }
})



async function submit() {
  if (!title.value.trim()) return
  if (isLoading.value) return
  
  isLoading.value = true
  
  const taskStartDate = startNow.value 
    ? new Date().toISOString() 
    : startDate.value ? new Date(startDate.value).toISOString() : undefined
  
  try {
    if (props.mode === 'create') {
      await tasks.create({
        title: title.value.trim(),
        description: description.value.trim(),
        category: category.value.trim(),
        startDate: taskStartDate,
        dueDate: dueDate.value ? new Date(dueDate.value).toISOString() : undefined,
        status: status.value,
      })
      toast.success('Tarea creada correctamente')
    } else if (props.initial?.id) {
      await tasks.update(props.initial.id, {
        title: title.value.trim(),
        description: description.value.trim(),
        category: category.value.trim(),
        startDate: taskStartDate,
        dueDate: dueDate.value ? new Date(dueDate.value).toISOString() : undefined,
        status: status.value,
      })
      toast.success('Tarea actualizada correctamente')
    }
    emit('close')
  } catch (error) {
    toast.error(props.mode === 'create' ? 'Error al crear la tarea' : 'Error al actualizar la tarea')
  } finally {
    isLoading.value = false
  }
}

const isDeleting = ref(false)

async function deleteTask() {
  if (props.mode === 'edit' && props.initial?.id) {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea? Esta acción no se puede deshacer.')) {
      if (isDeleting.value) return
      isDeleting.value = true
      
      try {
        await tasks.remove(props.initial.id)
        toast.success('Tarea eliminada correctamente')
        emit('close')
      } catch (error) {
        toast.error('Error al eliminar la tarea')
      } finally {
        isDeleting.value = false
      }
    }
  }
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
          <label class="text-sm font-medium mb-1.5 block">Categoría</label>
          <Input v-model="category" placeholder="Ej: Trabajo, Personal, Urgente..." class="placeholder:text-muted-foreground/70" />
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


      </div>

      <DialogFooter class="mt-2">
        <div class="flex justify-between items-center w-full">
          <Button 
            v-if="mode === 'edit'" 
            variant="destructive" 
            @click="deleteTask"
            :disabled="isDeleting"
            class="mr-auto"
          >
            <div v-if="isDeleting" class="flex items-center gap-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Eliminando...
            </div>
            <span v-else>Eliminar</span>
          </Button>
          <div class="flex gap-2 ml-auto">
            <Button variant="outline" @click="emit('close')">Cancelar</Button>
            <Button @click="submit" :disabled="isLoading">
              <div v-if="isLoading" class="flex items-center gap-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {{ mode === 'create' ? 'Creando...' : 'Guardando...' }}
              </div>
              <span v-else>{{ mode === 'create' ? 'Crear' : 'Guardar' }}</span>
            </Button>
          </div>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
