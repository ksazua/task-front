<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { useTasksStore, type Tag, type TaskStatus } from '~/stores/tasks'
import { Plus, Trash2, Download, Upload, Loader2 } from 'lucide-vue-next'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const tasks = useTasksStore()

interface BulkTaskRow {
  id: string
  title: string
  description: string
  category: string
  status: string
  startDate: string
  dueDate: string
  tagId: string
}

const rows = ref<BulkTaskRow[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const isLoading = ref(false)

const STATUS_FROM_API: Record<string, TaskStatus> = {
  planificado: 'planned',
  en_progreso: 'in_progress',
  completado: 'done'
}

const normalizeStatus = (status: string): TaskStatus => {
  const key = status.toLowerCase().trim()
  return STATUS_FROM_API[key] ?? 'planned'
}

// Función helper para parsear líneas CSV con comillas
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"' && !inQuotes) {
      inQuotes = true
    } else if (char === '"' && inQuotes) {
      if (nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = false
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, '')) // Remover comillas del inicio y final
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim().replace(/^"|"$/g, '')) // Remover comillas del inicio y final
  return result
}

// Inicializar con una fila vacía
function initRows() {
  rows.value = [{
    id: nanoid(),
    title: '',
    description: '',
    category: 'General',
    status: 'planificado',
    startDate: dayjs().format('YYYY-MM-DD'),
    dueDate: '',
    tagId: 'all'
  }]
}

// Añadir nueva fila
function addRow() {
  rows.value.push({
    id: nanoid(),
    title: '',
    description: '',
    category: 'General',
    status: 'planificado',
    startDate: dayjs().format('YYYY-MM-DD'),
    dueDate: '',
    tagId: 'all'
  })
}

// Eliminar fila
function removeRow(id: string) {
  if (rows.value.length > 1) {
    rows.value = rows.value.filter(r => r.id !== id)
  }
}

// Guardar todas las tareas
const saveAll = async () => {
  if (isLoading.value) return

  const validRows = rows.value.filter(row => row.title.trim())

  if (validRows.length === 0) {
    toast.error('Agrega al menos una tarea con título')
    return
  }

  isLoading.value = true

  try {
    const results = await Promise.allSettled(validRows.map(row => {
      const status = normalizeStatus(row.status)
      const startDateIso = row.startDate ? dayjs(row.startDate).startOf('day').toISOString() : undefined
      const dueDateIso = row.dueDate ? dayjs(row.dueDate).endOf('day').toISOString() : undefined

      return tasks.create({
        title: row.title.trim(),
        description: row.description?.trim() || '',
        category: row.category?.trim() || 'General',
        status,
        startDate: startDateIso,
        dueDate: dueDateIso
      })
    }))

    const fulfilled = results.filter(r => r.status === 'fulfilled').length
    const rejected = results.length - fulfilled

    if (fulfilled) {
      toast.success(`Se guardaron ${fulfilled} tarea${fulfilled === 1 ? '' : 's'}`)
    }

    if (rejected) {
      toast.error(`No se pudieron guardar ${rejected} tarea${rejected === 1 ? '' : 's'}`)
    }

    if (fulfilled) {
      emit('close')
    }

    initRows()
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  } catch (error) {
    toast.error('Error al guardar tareas. Intenta nuevamente.')
  } finally {
    isLoading.value = false
  }
}

// Descargar plantilla CSV
function downloadTemplate() {
  const examples = [
    'title,description,category,status,start_date,deadline',
    'Completar informe mensual,"Elaborar y enviar el informe de ventas","Trabajo","planificado","2025-10-10T09:00:00","2025-10-15T18:00:00"',
    'Revisar presentación,"Preparar slides para reunión del lunes","Trabajo","en_progreso","2025-10-11T10:00:00","2025-10-16T17:00:00"',
    'Comprar víveres,"Lista de compras para la semana","Personal","planificado","2025-10-12T15:00:00","2025-10-12T18:00:00"'
  ]
  
  const csv = examples.join('\n')
  
  // Agregar BOM UTF-8 para compatibilidad con Excel
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `plantilla-tareas-${dayjs().format('YYYY-MM-DD')}.csv`
  link.click()
}

// Cargar CSV
function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    parseCSV(text)
  }
  reader.readAsText(file)
}

// Parsear CSV y crear tareas
function parseCSV(text: string) {
  const lines = text.split('\n').filter(line => line.trim())
  
  // Omitir la primera línea (headers)
  const dataLines = lines.slice(1)
  
  const newRows: BulkTaskRow[] = []
  
  dataLines.forEach(line => {
    // Parsear CSV correctamente considerando comillas
    const columns = parseCSVLine(line)
    
    if (!columns[0]) return // Saltar si no hay título
    
    const [title, description, category, status, startDate, deadline] = columns
    
    // Buscar tag por nombre de categoría
    let tagId = 'all'
    if (category) {
      const tag = tasks.tags.find(t => t.name.toLowerCase() === category.toLowerCase())
      if (tag) tagId = tag.id
    }

    // Formatear fechas si vienen con tiempo ISO
    const formatDate = (dateStr: string) => {
      if (!dateStr) return ''
      try {
        const date = new Date(dateStr)
        return dayjs(date).format('YYYY-MM-DD')
      } catch {
        return dateStr
      }
    }
    
    newRows.push({
      id: nanoid(),
      title: title || '',
      description: description || '',
      category: category || 'General',
      status: status || 'planificado',
      startDate: formatDate(startDate) || dayjs().format('YYYY-MM-DD'),
      dueDate: formatDate(deadline) || '',
      tagId
    })
  })
  
  if (newRows.length > 0) {
    rows.value = newRows
  }
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

// Inicializar al abrir
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    if (rows.value.length === 0) {
      initRows()
    }
  } else {
    isLoading.value = false
  }
})

if (rows.value.length === 0) {
  initRows()
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => !val && emit('close')">
    <DialogContent class="max-w-[98vw] w-full max-h-[95vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>Crear tareas masivamente</DialogTitle>
        <DialogDescription>
          Añade múltiples tareas a la vez mediante formulario o carga un archivo CSV
        </DialogDescription>
      </DialogHeader>

      <Tabs default-value="form" class="flex-1 flex flex-col overflow-hidden">
        <TabsList class="w-full">
          <TabsTrigger value="form" class="flex-1">Formulario</TabsTrigger>
          <TabsTrigger value="csv" class="flex-1">Cargar CSV</TabsTrigger>
        </TabsList>

        <!-- Tab: Formulario -->
        <TabsContent value="form" class="flex-1 overflow-auto mt-4">
          <div class="border rounded-lg overflow-hidden">
            <div class="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead class="w-[250px]">Título*</TableHead>
                    <TableHead class="w-[300px]">Descripción</TableHead>
                    <TableHead class="w-[140px]">Categoría</TableHead>
                    <TableHead class="w-[140px]">Status</TableHead>
                    <TableHead class="w-[160px]">Fecha Inicio</TableHead>
                    <TableHead class="w-[160px]">Fecha Límite</TableHead>
                    <TableHead class="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="row in rows" :key="row.id">
                    <!-- Título -->
                    <TableCell>
                      <Input 
                        v-model="row.title" 
                        placeholder="Nombre de la tarea" 
                        class="w-full"
                      />
                    </TableCell>

                    <!-- Descripción -->
                    <TableCell>
                      <Input 
                        v-model="row.description" 
                        placeholder="Detalles opcionales" 
                        class="w-full"
                      />
                    </TableCell>

                    <!-- Categoría -->
                    <TableCell>
                      <Input 
                        v-model="row.category" 
                        placeholder="General" 
                        class="w-full"
                      />
                    </TableCell>

                    <!-- Status -->
                    <TableCell>
                      <Select v-model="row.status">
                        <SelectTrigger class="w-full">
                          <SelectValue placeholder="planificado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="planificado">Planificado</SelectItem>
                          <SelectItem value="en_progreso">En Progreso</SelectItem>
                          <SelectItem value="completado">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <!-- Fecha Inicio -->
                    <TableCell>
                      <Input 
                        v-model="row.startDate" 
                        type="date" 
                        class="w-full"
                      />
                    </TableCell>

                    <!-- Fecha Límite -->
                    <TableCell>
                      <Input 
                        v-model="row.dueDate" 
                        type="date" 
                        :min="row.startDate"
                        class="w-full"
                      />
                    </TableCell>

                    <!-- Acciones -->
                    <TableCell>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        @click="removeRow(row.id)"
                        :disabled="rows.length === 1"
                      >
                        <Trash2 :size="16" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <div class="flex items-center justify-between mt-4">
            <Button variant="outline" @click="addRow">
              <Plus :size="16" class="mr-2" />
              Añadir otra tarea
            </Button>
            <div class="flex gap-2">
              <Button variant="outline" @click="emit('close')">Cancelar</Button>
              <Button @click="saveAll" :disabled="isLoading || !rows.some(r => r.title.trim())">
                <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                Guardar todas
              </Button>
            </div>
          </div>
        </TabsContent>

        <!-- Tab: CSV -->
        <TabsContent value="csv" class="flex-1 flex flex-col mt-4">
          <div class="flex-1 flex flex-col items-center justify-center gap-6 border-2 border-dashed rounded-lg p-8">
            <div class="text-center space-y-2">
              <h3 class="text-lg font-semibold">Carga de tareas por CSV</h3>
              <p class="text-sm text-muted-foreground max-w-md">
                Descarga la plantilla, llénala con tus tareas y súbela para importarlas todas a la vez.
              </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" @click="downloadTemplate">
                <Download :size="16" class="mr-2" />
                Descargar plantilla
              </Button>
              <Button @click="triggerFileInput">
                <Upload :size="16" class="mr-2" />
                Subir CSV
              </Button>
            </div>

            <input 
              ref="fileInputRef"
              type="file" 
              accept=".csv"
              class="hidden"
              @change="handleFileUpload"
            />

            <!-- Preview de tareas cargadas -->
            <div v-if="rows.length > 0 && rows.some(r => r.title)" class="w-full mt-4">
              <div class="border rounded-lg p-4 bg-muted/20">
                <h4 class="font-medium mb-2">Tareas cargadas: {{ rows.filter(r => r.title).length }}</h4>
                <div class="space-y-1 text-sm">
                  <div v-for="row in rows.filter(r => r.title).slice(0, 5)" :key="row.id" class="flex items-center gap-2">
                    <span class="text-muted-foreground">•</span>
                    <span class="font-medium">{{ row.title }}</span>
                    <span v-if="row.dueDate" class="text-muted-foreground text-xs">
                      ({{ dayjs(row.dueDate).format('DD MMM YYYY') }})
                    </span>
                  </div>
                  <p v-if="rows.filter(r => r.title).length > 5" class="text-muted-foreground text-xs">
                    ... y {{ rows.filter(r => r.title).length - 5 }} más
                  </p>
                </div>
                <div class="flex gap-2 mt-4">
                  <Button variant="outline" @click="initRows()">Limpiar</Button>
                  <Button @click="saveAll" :disabled="isLoading || !rows.filter(r => r.title).length">
                    <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                    Guardar {{ rows.filter(r => r.title).length }} tareas
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
