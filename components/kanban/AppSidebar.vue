<script setup lang="ts">
import { LayoutDashboard, CalendarDays, ChevronUp, ListChecks } from 'lucide-vue-next'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '~/components/ui/sidebar'
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '~/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'
import { Skeleton } from '~/components/ui/skeleton'
import { useAuth } from '~/composables/useAuth'

const { state } = useSidebar()
const route = useRoute()
const { user, logout, checkAuth } = useAuth()

// Estado para controlar la carga del usuario
const isLoadingUser = ref(true)

const menuItems = [
  { title: 'Tablero', url: '/inicio', icon: LayoutDashboard },
  { title: 'To-Do List', url: '/todo', icon: ListChecks },
  { title: 'Calendario', url: '/calendario', icon: CalendarDays },
]

// Computed para mostrar datos del usuario
const userName = computed(() => {
  if (user.value?.name) return user.value.name
  return 'Usuario'
})

const userEmail = computed(() => {
  if (user.value?.email) return user.value.email
  return 'usuario@email.com'
})

const userInitials = computed(() => {
  if (user.value?.name) {
    const names = user.value.name.split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase()
    }
    return user.value.name.substring(0, 2).toUpperCase()
  }
  return 'U'
})

// Cargar datos del usuario al montar el componente
onMounted(async () => {
  if (!user.value) {
    try {
      await checkAuth()
    } catch (error) {
      // Error silencioso al cargar usuario
    } finally {
      isLoadingUser.value = false
    }
  } else {
    isLoadingUser.value = false
  }
})

async function handleLogout() {
  try {
    // Mostrar loading/feedback inmediato
    const { toast } = await import('vue-sonner')
    const loadingToastId = toast.loading('Cerrando sesión...')
    
    await logout()
    
    // Limpiar toast de loading específico
    toast.dismiss(loadingToastId)
  } catch (error) {
    // Error silencioso y forzar navegación
    const { toast } = await import('vue-sonner')
    toast.dismiss() // Limpiar todos los toasts
    await navigateTo('/login', { replace: true })
  }
}
</script>

<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <a href="/">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span class="font-bold text-sm">TF</span>
              </div>
              <div class="flex flex-col gap-0.5 leading-none">
                <span class="font-semibold">TaskFront</span>
                <span class="text-xs text-muted-foreground">Workspace</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <!-- Menú principal -->
      <SidebarGroup>
        <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in menuItems" :key="item.title">
              <TooltipProvider v-if="state === 'collapsed'" :delay-duration="0">
                <Tooltip>
                  <TooltipTrigger as-child>
                    <SidebarMenuButton as-child :is-active="route.path === item.url"
                                     :class="route.path === item.url ? 'sidebar-menu-active' : ''">
                      <a :href="item.url">
                        <component :is="item.icon" />
                        <span>{{ item.title }}</span>
                      </a>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{{ item.title }}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <SidebarMenuButton v-else as-child :is-active="route.path === item.url" 
                               :class="route.path === item.url ? 'sidebar-menu-active' : ''">
                <a :href="item.url">
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <!-- Loading skeleton -->
          <div v-if="isLoadingUser" class="flex items-center space-x-3 px-2 py-2">
            <Skeleton class="size-8 rounded-lg" />
            <div class="space-y-1 flex-1">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-3 w-24" />
            </div>
          </div>
          
          <!-- User dropdown cuando está cargado -->
          <DropdownMenu v-else>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <Avatar class="size-8 rounded-lg">
                  <AvatarImage src="" :alt="userName" />
                  <AvatarFallback class="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
                    {{ userInitials }}
                  </AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ userName }}</span>
                  <span class="truncate text-xs text-muted-foreground">{{ userEmail }}</span>
                </div>
                <ChevronUp class="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-56 rounded-lg" side="top" align="end" :side-offset="4">
              <DropdownMenuItem class="text-destructive" @click="handleLogout">
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
