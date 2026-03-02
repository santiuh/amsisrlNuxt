export default defineNuxtPlugin(() => {
  const root = document.documentElement
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const applyMode = (isDark: boolean) => {
    root.classList.toggle('dark', isDark)
    root.classList.toggle('light', !isDark)
  }

  applyMode(mediaQuery.matches)

  const onChange = (event: MediaQueryListEvent) => applyMode(event.matches)

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', onChange)
  }
})