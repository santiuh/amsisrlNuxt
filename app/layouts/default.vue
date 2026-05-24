<template>
  <div class="h-screen overflow-hidden bg-[#f4f6f8] text-gray-900 dark:bg-[#080e1a] dark:text-gray-100">
    <div class="flex h-full overflow-hidden">
      <!-- Overlay backdrop (mobile only) -->
      <Transition name="fade">
        <div
          v-if="sidebarOpen"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          @click="sidebarOpen = false"
        />
      </Transition>

      <AppSidebar />

      <div class="flex-1 flex flex-col overflow-hidden w-0">
        <AppHeader />
        <main class="flex-1 overflow-y-auto px-3 sm:p-5 lg:p-6 pt-2 sm:pt-5 pb-28 md:pb-6">
          <MobileProfileBadge />
          <slot />
        </main>
      </div>
    </div>

    <MobileBottomNav />
    <MobileMenuPanel />
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
