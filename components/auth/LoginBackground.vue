<template>
  <div class="relative min-h-[100dvh] overflow-hidden">
  <!-- smoother blue/teal gradient background -->
  <div class="absolute inset-0 bg-gradient-to-br from-[#022c54] via-[#0369a1] to-[#7dd3fc]"></div>

    <!-- subtle blue blobs for depth -->
    <div class="pointer-events-none absolute inset-0 opacity-[0.38]">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.blob{position:absolute;filter:blur(60px);width:46vmax;height:46vmax;border-radius:9999px;opacity:.75;mix-blend-mode:screen}
.blob-1{background:radial-gradient(closest-side,#0ea5a4,transparent 70%);top:-12%;left:-8%;animation:bm1 12s ease-in-out infinite alternate}
.blob-2{background:radial-gradient(closest-side,#0369a1,transparent 70%);bottom:-18%;right:-12%;animation:bm2 14s ease-in-out infinite alternate}
.blob-3{background:radial-gradient(closest-side,#60a5fa,transparent 70%);top:8%;right:18%;animation:bm3 16s ease-in-out infinite alternate}
@keyframes bm1{from{transform:translate(0,0) scale(1)}to{transform:translate(8%,-6%) scale(1.08)}}
@keyframes bm2{from{transform:translate(0,0) scale(1)}to{transform:translate(-6%,6%) scale(1.05)}}
@keyframes bm3{from{transform:translate(0,0) scale(1)}to{transform:translate(-4%,-4%) scale(1.06)}}
</style>
