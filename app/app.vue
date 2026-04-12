<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style lang="postcss">
/* Page transitions */
.page-enter-active {
  transition: opacity 200ms ease-out, transform 200ms ease-out;
}
.page-leave-active {
  transition: opacity 150ms ease-in;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
}

/* Layout transitions */
.layout-enter-active {
  transition: opacity 250ms ease-out;
}
.layout-leave-active {
  transition: opacity 150ms ease-in;
}
.layout-enter-from,
.layout-leave-to {
  opacity: 0;
}

/* Scale Y */
.scale-y-enter-active,
.scale-y-leave-active {
  transition: all 300ms ease;
  will-change: max-height, opacity;
  max-height: 160px;
  overflow: hidden;
  opacity: 1;
}
.scale-y-enter-from,
.scale-y-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
