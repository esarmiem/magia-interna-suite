-- ==========================================
-- 🛠️ CORRECCIÓN DE MIGRACIÓN (INTENTO 2) 🛠️
-- ==========================================

-- El error que viste (P0001: Stock insuficiente) ocurre porque el sistema 
-- intentó validar si tenías stock HOY para ventas que hiciste en el PASADO.
-- Como algunos productos ya tienen stock 0, la validación falló.

-- SOLUCIÓN: Apagamos temporalmente esa validación solo durante esta actualización.

-- 1. Crear la columna (si no existe ya)
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2);

-- 2. 🔴 APAGAR TEMPORALMENTE EL TRIGGER DE VALIDACIÓN
ALTER TABLE public.sale_items DISABLE TRIGGER trigger_validate_stock_before_update;

-- 3. Rellenar el historial (Ahora sí funcionará sin errores)
UPDATE public.sale_items si
SET unit_cost = p.cost
FROM public.products p
WHERE si.product_id = p.id
AND si.unit_cost IS NULL;

-- 4. Limpiar datos huérfanos (si el producto fue borrado, costo 0)
UPDATE public.sale_items SET unit_cost = 0 WHERE unit_cost IS NULL;

-- 5. 🟢 ENCENDER DE NUEVO EL TRIGGER DE VALIDACIÓN
ALTER TABLE public.sale_items ENABLE TRIGGER trigger_validate_stock_before_update;

-- 6. Asegurar integridad futura
ALTER TABLE public.sale_items ALTER COLUMN unit_cost SET DEFAULT 0;
-- Nota: Si falla el NOT NULL porque hay datos sucios, puedes omitir la siguiente línea
-- ALTER TABLE public.sale_items ALTER COLUMN unit_cost SET NOT NULL;
