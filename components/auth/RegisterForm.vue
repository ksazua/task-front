<script setup lang="ts">
import { Mail, Lock, Eye, EyeOff, UserRound } from 'lucide-vue-next'

const name = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const accept = ref(false)
const showPwd = ref(false)
const showConfirm = ref(false)
const loading = ref(false)

const errors = reactive<{ name?: string; email?: string; password?: string; confirm?: string; accept?: string }>({})

function validate() {
  errors.name = !name.value ? 'Ingresa tu nombre' : undefined
  errors.email = !email.value ? 'Ingresa tu correo'
    : !/^\S+@\S+\.\S+$/.test(email.value) ? 'Correo inválido' : undefined
  errors.password = password.value.length < 8 ? 'Mínimo 8 caracteres' : undefined
  errors.confirm = confirm.value !== password.value ? 'No coincide con la contraseña' : undefined
  errors.accept = !accept.value ? 'Debes aceptar los términos' : undefined
  return !errors.name && !errors.email && !errors.password && !errors.confirm && !errors.accept
}

function strengthLabel() {
  const p = password.value
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  return ['Débil','Regular','Buena','Fuerte','Muy fuerte'][score] || 'Débil'
}

async function onSubmit() {
  if (!validate()) return
  loading.value = true
  // aquí luego llamarás a tu API
  setTimeout(() => {
    loading.value = false
    navigateTo('/login')
  }, 800)
}
</script>

<template>
  <div class="flex min-h-[100dvh] items-center justify-center p-6">
    <Card class="w-full max-w-md">
      <CardHeader class="space-y-1 text-center">
        <CardTitle class="text-2xl">Crear cuenta</CardTitle>
        <CardDescription>Regístrate en <span class="font-medium">TaskFront</span></CardDescription>
      </CardHeader>

      <CardContent class="space-y-4">
        <!-- Nombre -->
        <div class="grid gap-2">
          <Label for="name">Nombre</Label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <UserRound :size="18" />
            </span>
            <Input
              id="name"
              v-model="name"
              placeholder="Tu nombre"
              :aria-invalid="!!errors.name"
              :class="['pl-10', errors.name && 'ring-2 ring-destructive/20 border-destructive']"
            />
          </div>
          <p v-if="errors.name" class="text-destructive text-sm">{{ errors.name }}</p>
        </div>

        <!-- Email -->
        <div class="grid gap-2">
          <Label for="email">Correo</Label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Mail :size="18" />
            </span>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="tu@email.com"
              :aria-invalid="!!errors.email"
              :class="['pl-10', errors.email && 'ring-2 ring-destructive/20 border-destructive']"
            />
          </div>
          <p v-if="errors.email" class="text-destructive text-sm">{{ errors.email }}</p>
        </div>

        <!-- Password -->
        <div class="grid gap-2">
          <div class="flex items-center justify-between">
            <Label for="password">Contraseña</Label>
            <span class="text-xs text-muted-foreground">Fuerza: {{ strengthLabel() }}</span>
          </div>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Lock :size="18" />
            </span>
            <Input
              id="password"
              v-model="password"
              :type="showPwd ? 'text' : 'password'"
              placeholder="••••••••"
              :aria-invalid="!!errors.password"
              :class="['pl-10 pr-10', errors.password && 'ring-2 ring-destructive/20 border-destructive']"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              @click="showPwd = !showPwd"
            >
              <Eye v-if="!showPwd" :size="18" />
              <EyeOff v-else :size="18" />
            </button>
          </div>
          <p v-if="errors.password" class="text-destructive text-sm">{{ errors.password }}</p>
        </div>

        <!-- Confirm -->
        <div class="grid gap-2">
          <Label for="confirm">Confirmar contraseña</Label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Lock :size="18" />
            </span>
            <Input
              id="confirm"
              v-model="confirm"
              :type="showConfirm ? 'text' : 'password'"
              placeholder="••••••••"
              :aria-invalid="!!errors.confirm"
              :class="['pl-10 pr-10', errors.confirm && 'ring-2 ring-destructive/20 border-destructive']"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              @click="showConfirm = !showConfirm"
            >
              <Eye v-if="!showConfirm" :size="18" />
              <EyeOff v-else :size="18" />
            </button>
          </div>
          <p v-if="errors.confirm" class="text-destructive text-sm">{{ errors.confirm }}</p>
        </div>

        <!-- Términos -->
        <label class="flex items-center gap-2 text-sm">
          <Checkbox v-model:checked="accept" />
          Acepto los <NuxtLink to="#" class="text-primary hover:underline">términos y condiciones</NuxtLink>
        </label>
        <p v-if="errors.accept" class="text-destructive text-sm">{{ errors.accept }}</p>

        <Button class="w-full" :disabled="loading" @click="onSubmit">
          {{ loading ? 'Creando cuenta…' : 'Crear cuenta' }}
        </Button>

        <p class="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?
          <NuxtLink to="/login" class="text-primary hover:underline"> Inicia sesión </NuxtLink>
        </p>
      </CardContent>
    </Card>
  </div>
</template>
