-- ==========================================
-- 🛡️ KIT DE SEGURIDAD Y VALIDACIÓN 🛡️
-- ==========================================

-- PASO 1: VALIDACIÓN PREVIA (Ejecutar ANTES de la migración)
-- Esto no modifica nada, solo lee datos.
-- Verifica cuántos items de venta tienes actualmente.
SELECT count(*) as total_items_venta FROM sale_items;

-- Muestra una vista previa de cómo se vería la unión de datos
-- Esto te permite ver qué costo se asignará a tus ventas pasadas
SELECT 
  si.created_at as fecha_venta,
  p.name as producto,
  si.unit_price as precio_venta_historico,
  p.cost as costo_actual_que_se_guardara
FROM sale_items si
JOIN products p ON si.product_id = p.id
ORDER BY si.created_at DESC
LIMIT 10;

-- ==========================================
-- PASO 2: MIGRACIÓN SEGURA (Ejecutar PARA APLICAR CAMBIOS)
-- ==========================================

-- 1. Agregar la columna (Esto es seguro, crea el espacio vacío)
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2);

-- 2. Verificar que la columna se creó (debe salir null)
SELECT id, unit_cost FROM sale_items LIMIT 5;

-- 3. Rellenar datos (Aquí es donde se guarda el historial)
UPDATE public.sale_items si
SET unit_cost = p.cost
FROM public.products p
WHERE si.product_id = p.id
AND si.unit_cost IS NULL;

-- 4. Rellenar con 0 los productos que ya no existan (para evitar errores)
UPDATE public.sale_items SET unit_cost = 0 WHERE unit_cost IS NULL;

-- ==========================================
-- PASO 3: VERIFICACIÓN FINAL (Ejecutar DESPUÉS)
-- ==========================================

-- Verifica que ya no existan nulos
SELECT count(*) as pendientes_sin_costo FROM sale_items WHERE unit_cost IS NULL;

-- Muestra tus ventas con el nuevo costo histórico asegurado
SELECT 
  si.created_at,
  p.name,
  si.unit_price as precio,
  si.unit_cost as costo_historico
FROM sale_items si
LEFT JOIN products p ON si.product_id = p.id
ORDER BY si.created_at DESC
LIMIT 10;
