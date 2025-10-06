<script setup lang="ts">
import { Eye, EyeOff, Mail, Lock, UserRound } from 'lucide-vue-next'
import { reactive, ref, watch } from 'vue'
import { z } from 'zod'
import { toast } from 'vue-sonner'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { useAuth } from '~/composables/useAuth'

const name = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

const errors = reactive<{ name?: string; email?: string; password?: string }>({})

const { fetchSession } = useAuth()

const registerSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Ingresa al menos 3 caracteres' })
    .max(80, { message: 'Nombre demasiado largo' })
    .regex(
      /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)(\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3}$/,
      {
        message: 'Usa 1 a 4 palabras con inicial mayúscula'
      }
    ),
  email: z.string().email({ message: 'Correo inválido' }),
  password: z.string().min(8, { message: 'Mínimo 8 caracteres' })
})

function formatNameValue(value: string): string {
  return value
    .replace(/\d+/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => {
      const normalized = word.normalize('NFC')
      if (!normalized) return ''
      const lower = normalized.toLocaleLowerCase('es')
      const [first, ...rest] = lower
      return first.toLocaleUpperCase('es') + rest.join('')
    })
    .join(' ')
}

function handleNameBlur() {
  name.value = formatNameValue(name.value)
}

watch(name, (value) => {
  const formatted = formatNameValue(value)

  if (formatted !== value) {
    name.value = formatted
    return
  }

  errors.name = undefined
})

watch(email, () => {
  errors.email = undefined
})

watch(password, () => {
  errors.password = undefined
})

function validate() {
  const formattedName = formatNameValue(name.value)

  const result = registerSchema.safeParse({
    name: formattedName,
    email: email.value.trim(),
    password: password.value
  })

  errors.name = undefined
  errors.email = undefined
  errors.password = undefined

  if (!result.success) {
    const fieldErrors = result.error.formErrors.fieldErrors
    errors.name = fieldErrors.name?.[0]
    errors.email = fieldErrors.email?.[0]
    errors.password = fieldErrors.password?.[0]
    return false
  }

  name.value = result.data.name
  email.value = result.data.email
  password.value = result.data.password

  return true
}

async function onSubmit() {
  if (!validate()) return

  loading.value = true

  try {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      credentials: 'include',
      body: {
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value
      }
    })

    if (response?.success) {
      toast.success(response.message || 'Registro exitoso')

      try {
        await fetchSession()
      } catch (error) {
        // Error silencioso al actualizar la sesión
      }

      await new Promise(resolve => setTimeout(resolve, 100))
      await navigateTo('/inicio', { replace: true })
    } else {
      toast.error(response?.message || 'Error al registrarse')
    }
  } catch (error: any) {
    const message = error?.data?.message || error.message || 'Error al conectar con el servidor'
    toast.error(message)
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
        <CardTitle class="text-2xl">Crear cuenta</CardTitle>
        <CardDescription>Completa tus datos para registrarte</CardDescription>
      </CardHeader>

      <CardContent>
        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="grid gap-2">
            <Label for="register-name">Nombre completo</Label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <UserRound :size="18" />
              </span>
              <Input
                id="register-name"
                v-model="name"
                type="text"
                placeholder="Tu nombre"
                autocomplete="name"
                @blur="handleNameBlur"
                :aria-invalid="!!errors.name"
                :class="['pl-10', errors.name && 'ring-2 ring-destructive/20 border-destructive']"
              />
            </div>
            <p v-if="errors.name" class="text-sm text-destructive">{{ errors.name }}</p>
          </div>

          <div class="grid gap-2">
            <Label for="register-email">Correo</Label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Mail :size="18" />
              </span>
              <Input
                id="register-email"
                v-model="email"
                type="email"
                placeholder="tu@email.com"
                autocomplete="email"
                :aria-invalid="!!errors.email"
                :class="['pl-10', errors.email && 'ring-2 ring-destructive/20 border-destructive']"
              />
            </div>
            <p v-if="errors.email" class="text-sm text-destructive">{{ errors.email }}</p>
          </div>

          <div class="grid gap-2">
            <Label for="register-password">Contraseña</Label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock :size="18" />
              </span>
              <Input
                id="register-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                autocomplete="new-password"
                :aria-invalid="!!errors.password"
                :class="['pl-10 pr-10', errors.password && 'ring-2 ring-destructive/20 border-destructive']"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                @click="showPassword = !showPassword"
              >
                <Eye v-if="!showPassword" :size="18" />
                <EyeOff v-else :size="18" />
              </button>
            </div>
            <p v-if="errors.password" class="text-sm text-destructive">{{ errors.password }}</p>
          </div>

          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? 'Creando cuenta…' : 'Registrarme' }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="flex justify-center">
        <p class="text-sm text-muted-foreground">
          ¿Ya tienes cuenta?
          <NuxtLink to="/login" class="text-primary hover:underline"> Inicia sesión </NuxtLink>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
