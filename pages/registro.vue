<script setup lang="ts">
import LoginBackground from '~/components/auth/LoginBackground.vue'
import RegisterForm from '~/components/auth/RegisterForm.vue'

// Definir la página como pública (no requiere autenticación)
definePageMeta({
  auth: false
})
</script>

<template>
  <LoginBackground>
    <RegisterForm />
  </LoginBackground>
</template>
