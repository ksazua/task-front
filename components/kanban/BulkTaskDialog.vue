<script setup lang="ts">
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '~/components/ui/tabs'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { useTasksStore, type Tag } from '~/stores/tasks'
import { Plus, Trash2, Download, Upload } from 'lucide-vue-next'
import { nanoid } from 'nanoid'
import dayjs from 'dayjs'

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
  startDate: string
  dueDate: string
  tagId: string
}

const rows = ref<BulkTaskRow[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

// Inicializar con una fila vacía
function initRows() {
  rows.value = [{
    id: nanoid(),
    title: '',
    description: '',
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
function saveAll() {
  const validRows = rows.value.filter(r => r.title.trim())
  
  validRows.forEach(row => {
    const tag = row.tagId !== 'all' ? tasks.tags.find(t => t.id === row.tagId) : undefined
    
    tasks.create({
      title: row.title,
      description: row.description || undefined,
      startDate: row.startDate || undefined,
      dueDate: row.dueDate || undefined,
      tags: tag ? [tag] : [],
      status: 'planned'
    })
  })

  initRows()
  emit('close')
}

// Descargar plantilla CSV
function downloadTemplate() {
  const headers = ['Titulo', 'Descripcion', 'Fecha Inicio', 'Fecha Limite', 'Categoria']
  const example = ['Ejemplo de tarea', 'Descripcion detallada', '2025-10-04', '2025-10-10', 'UI']
  
  const csv = [
    headers.join(','),
    example.join(','),
    // Fila vacía para que empiecen a llenar
    ',,,,'
  ].join('\n')
  
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
    const columns = line.split(',').map(col => col.trim())
    
    if (!columns[0]) return // Saltar si no hay título
    
    const [title, description, startDate, dueDate, categoryName] = columns
    
    // Buscar tag por nombre
    let tagId = 'all'
    if (categoryName) {
      const tag = tasks.tags.find(t => t.name.toLowerCase() === categoryName.toLowerCase())
      if (tag) tagId = tag.id
    }
    
    newRows.push({
      id: nanoid(),
      title: title || '',
      description: description || '',
      startDate: startDate || dayjs().format('YYYY-MM-DD'),
      dueDate: dueDate || '',
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
  if (isOpen && rows.value.length === 0) {
    initRows()
  }
})
</script>

<template>
  <Dialog :open="open" @update:open="(val) => !val && emit('close')">
    <DialogContent class="max-w-[95vw] w-full max-h-[90vh] overflow-hidden flex flex-col">
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
                    <TableHead class="w-[200px]">Título*</TableHead>
                    <TableHead class="w-[250px]">Descripción</TableHead>
                    <TableHead class="w-[150px]">Fecha Inicio</TableHead>
                    <TableHead class="w-[150px]">Fecha Límite</TableHead>
                    <TableHead class="w-[150px]">Categoría</TableHead>
                    <TableHead class="w-[60px]"></TableHead>
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

                    <!-- Categoría -->
                    <TableCell>
                      <Select v-model="row.tagId">
                        <SelectTrigger class="w-full">
                          <SelectValue placeholder="Ninguna" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Ninguna</SelectItem>
                          <SelectItem v-for="tag in tasks.tags" :key="tag.id" :value="tag.id">
                            {{ tag.name }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
              <Button @click="saveAll" :disabled="!rows.some(r => r.title.trim())">
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
                  <Button @click="saveAll">
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
