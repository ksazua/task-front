<script setup lang="ts">
import { Mail, Lock, Eye, EyeOff } from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'
import { toast } from 'vue-sonner'

const { login } = useAuth()

const email = ref('')
const password = ref('')
const remember = ref(true)
const show = ref(false)
const loading = ref(false)
const errors = reactive<{ email?: string; password?: string }>({})

function validate() {
  errors.email = !email.value ? 'Ingresa tu correo' :
    !/^\S+@\S+\.\S+$/.test(email.value) ? 'Correo inválido' : undefined
  errors.password = !password.value ? 'Ingresa tu contraseña' : undefined
  return !errors.email && !errors.password
}

async function onSubmit() {
  if (!validate()) return
  
  loading.value = true
  
  try {
    const result = await login({
      email: email.value,
      password: password.value
    })

    if (result.success) {
      // Mostrar toast de éxito
      toast.success(result.message || 'Inicio de sesión exitoso')
      
      // Esperar un momento para que las cookies se guarden
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Redirigir al inicio usando navigateTo
      await navigateTo('/inicio', { replace: true })
    } else {
      // Mostrar toast de error
      toast.error(result.message || 'Error al iniciar sesión')
    }
  } catch (error: any) {
    toast.error(error.message || 'Error al conectar con el servidor')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-[100dvh] items-center justify-center p-6">
    <Card class="w-full max-w-md border bg-white shadow-sm">
      <CardHeader class="space-y-1 text-center">
        <div class="mx-auto rounded-md px-3 py-2 text-lg font-semibold text-primary">TaskFront</div>
        <CardTitle class="text-2xl">Iniciar Sesión</CardTitle>
        <CardDescription>Accede a tu cuenta</CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <form @submit.prevent="onSubmit">
          <div class="grid gap-2">
            <Label for="email">Correo</Label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Mail :size="18" />
              </span>
              <Input id="email" v-model="email" type="email" placeholder="tu@email.com"
                     :aria-invalid="!!errors.email" :class="['pl-10', errors.email && 'ring-2 ring-destructive/20 border-destructive']"/>
            </div>
            <p v-if="errors.email" class="text-destructive text-sm">{{ errors.email }}</p>
          </div>

          <div class="grid gap-2 mt-4">
            <Label for="password">Contraseña</Label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock :size="18" />
              </span>
              <Input id="password" v-model="password" :type="show ? 'text' : 'password'" placeholder="••••••••"
                     :aria-invalid="!!errors.password" :class="['pl-10 pr-10', errors.password && 'ring-2 ring-destructive/20 border-destructive']"/>
              <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      @click="show = !show">
                <Eye v-if="!show" :size="18" />
                <EyeOff v-else :size="18" />
              </button>
            </div>
            <p v-if="errors.password" class="text-destructive text-sm">{{ errors.password }}</p>
          </div>

          <div class="flex items-center justify-start mt-4">
            <label class="inline-flex items-center gap-2 text-sm">
              <Checkbox v-model:checked="remember" /> Recordarme
            </label>
          </div>

          <Button type="submit" class="w-full mt-4" :disabled="loading">
            {{ loading ? 'Entrando…' : 'Iniciar Sesión' }}
          </Button>
        </form>

        <!-- Social sign-in removed per request -->
      </CardContent>

      <CardFooter class="flex justify-center">
        <p class="text-sm text-muted-foreground">
          ¿No tienes cuenta?
          <NuxtLink to="/registro" class="text-primary hover:underline"> Regístrate aquí </NuxtLink>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
