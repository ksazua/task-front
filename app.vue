<script setup lang="ts">
import { Toaster } from 'vue-sonner'
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
    <Toaster 
      position="top-right" 
      :duration="4000"
      rich-colors
    />
  </NuxtLayout>
</template>


<style src="~/assets/css/tailwind.css"></style>
