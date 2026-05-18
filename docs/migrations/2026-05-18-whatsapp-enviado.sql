-- WhatsApp enviado: marcar inicio de comunicación con el cliente
-- Fecha: 2026-05-18
--
-- whatsapp_enviado_en es NULL si nunca se marcó o se desmarcó; timestamp
-- del último marcado si está activo. Oficinistas y admins pueden hacer toggle.
-- El cambio se registra además en comentarios_gestion (visible para todos)
-- y en oficinista_activity (solo cuando lo dispara una oficinista, por RLS).

-- 1. Nueva columna en ventas
ALTER TABLE public.ventas ADD COLUMN whatsapp_enviado_en TIMESTAMPTZ;

-- 2. Índice parcial — solo importan las ventas que están "en vuelo"
CREATE INDEX idx_ventas_whatsapp_enviado_estado
  ON public.ventas (estado, whatsapp_enviado_en)
  WHERE estado IN ('en_proceso', 'en_conflicto');

-- 3. Ampliar tipos de acción permitidos en oficinista_activity
ALTER TABLE public.oficinista_activity
  DROP CONSTRAINT oficinista_activity_action_type_check;

ALTER TABLE public.oficinista_activity
  ADD CONSTRAINT oficinista_activity_action_type_check
  CHECK (action_type IN (
    'estado_change',
    'coordinacion_set',
    'nro_cliente_set',
    'comentario',
    'whatsapp_toggle'
  ));
