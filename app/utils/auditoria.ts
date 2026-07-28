/**
 * Cuenta autorizada a ver el registro de auditoría del asistente IA
 * (/admin/asistente-historial y su entrada en los menús).
 *
 * La barrera real es la policy "auditor_select" de
 * docs/migrations/2026-07-28-asistente-historial.sql — este id solo decide qué
 * UI se muestra. Si cambia la cuenta auditora, actualizar ambos lugares.
 */
export const AUDITOR_PROFILE_ID = 'bb381144-a60b-404d-9401-15ef65a3cda3'
