<template>
  <NuxtLink
    v-if="esAdmin && vencidas + hoy > 0"
    to="/mapa?tab=agenda"
    class="flex items-center gap-3 rounded-2xl px-4 py-3 bg-white shadow-card ring-1 ring-gray-100 dark:bg-white/[0.03] dark:ring-white/[0.06] hover:ring-cyan-300 dark:hover:ring-cyan-500/40 transition-all"
  >
    <div class="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
      <UIcon name="i-heroicons-calendar-days" class="w-5 h-5 text-orange-500" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-[13px] font-bold text-gray-800 dark:text-gray-100">
        Revisitas pendientes
      </p>
      <p class="text-[12px] text-gray-500 dark:text-slate-400">
        <span v-if="vencidas > 0" class="text-rose-500 font-semibold">{{ vencidas }} vencida{{ vencidas === 1 ? '' : 's' }}</span>
        <span v-if="vencidas > 0 && hoy > 0"> · </span>
        <span v-if="hoy > 0" class="text-cyan-600 dark:text-cyan-400 font-semibold">{{ hoy }} para hoy</span>
      </p>
    </div>
    <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-300 dark:text-slate-600 shrink-0" />
  </NuxtLink>
</template>

<script setup lang="ts">
// Contador de revisitas de prospectos (vencidas + hoy) con link a la agenda.
// El mapa de clientes es admin-only, así que este widget solo aplica a admin.
const client = useSupabaseClient()
const profile = useCurrentProfile()
const esAdmin = computed(() => profile.value?.rol === 'admin')

const vencidas = ref(0)
const hoy = ref(0)

onMounted(async () => {
  if (!esAdmin.value) return
  const d = new Date()
  const hoyISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const [{ count: countVencidas }, { count: countHoy }] = await Promise.all([
    client
      .from('prospectos')
      .select('id', { count: 'exact', head: true })
      .not('proxima_visita', 'is', null)
      .lt('proxima_visita', hoyISO)
      .neq('estado', 'contratado'),
    client
      .from('prospectos')
      .select('id', { count: 'exact', head: true })
      .eq('proxima_visita', hoyISO)
      .neq('estado', 'contratado'),
  ])
  vencidas.value = countVencidas ?? 0
  hoy.value = countHoy ?? 0
})
</script>
