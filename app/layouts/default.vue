<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <!-- Overlay backdrop (mobile only) -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 bg-black/40 z-30 lg:hidden"
        @click="sidebarOpen = false"
      />
    </Transition>

    <AppSidebar />

    <div class="flex-1 flex flex-col overflow-hidden w-0">
      <AppHeader />
      <main class="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
await useFetchProfile()
const sidebarOpen = useSidebarOpen()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
