<script setup lang="ts">
defineProps<{ label: string; color?: string }>()
</script>

<template>
  <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
        :style="{ backgroundColor: (color??'#e5e7eb')+'22', color: color??'#374151', borderColor: (color??'#e5e7eb') }"
        style="border-width:1px">
    {{ label }}
  </span>
</template>
