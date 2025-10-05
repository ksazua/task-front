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

const { state } = useSidebar()
const route = useRoute()

const menuItems = [
  { title: 'Tablero', url: '/inicio', icon: LayoutDashboard },
  { title: 'To-Do List', url: '/todo', icon: ListChecks },
  { title: 'Calendario', url: '/calendario', icon: CalendarDays },
]
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
                    <SidebarMenuButton as-child :is-active="route.path === item.url">
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
              <SidebarMenuButton v-else as-child :is-active="route.path === item.url">
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
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <Avatar class="size-8 rounded-lg">
                  <AvatarImage src="" alt="Kevin Azua" />
                  <AvatarFallback class="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">KA</AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">Kevin Azua</span>
                  <span class="truncate text-xs text-muted-foreground">kevin@azua.cc</span>
                </div>
                <ChevronUp class="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-56 rounded-lg" side="top" align="end" :side-offset="4">
              <DropdownMenuItem>
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuItem class="text-destructive">
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
