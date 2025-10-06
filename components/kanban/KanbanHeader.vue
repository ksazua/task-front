<script setup lang="ts">
import { SidebarTrigger } from '~/components/ui/sidebar'
import { Separator } from '~/components/ui/separator'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Search, Plus, ChevronRight, ListPlus } from 'lucide-vue-next'

const props = defineProps<{
  searchQuery: string
  breadcrumbTitle?: string
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', value: string): void
  (e: 'createTask'): void
  (e: 'bulkCreate'): void
}>()
</script>

<template>
  <header class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 border-b bg-background px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 shrink-0">
    <!-- Sidebar trigger y breadcrumb -->
    <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="h-5 hidden sm:block" />
      <nav class="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm overflow-hidden">
        <span class="font-semibold text-foreground truncate">
          {{ breadcrumbTitle || 'Tablero' }}
        </span>
      </nav>
    </div>

    <!-- Búsqueda y acciones -->
    <div class="flex items-center gap-2 shrink-0">
      <div class="relative flex-1 sm:flex-none">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" :size="16"/>
        <Input 
          :model-value="searchQuery"
          @update:model-value="(val) => emit('update:searchQuery', String(val))"
          placeholder="Busqueda inteligente" 
          class="pl-8 w-full sm:w-48 md:w-60 h-9"
        />
      </div>
      <Button @click="emit('bulkCreate')" size="sm" variant="outline" class="shrink-0">
        <ListPlus :size="16" class="sm:mr-1.5"/> 
        <span class="hidden sm:inline">Creacion masiva</span>
      </Button>
      <Button @click="emit('createTask')" size="sm" class="shrink-0">
        <Plus :size="16" class="sm:mr-1.5"/> 
        <span class="hidden sm:inline">New Task</span>
      </Button>
    </div>
  </header>
</template>
