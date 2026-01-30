-- Agregar columna unit_cost a sale_items para congelar el costo al momento de la venta
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2);

-- Poblar la columna con el costo actual de los productos para ventas existentes
-- Esto asume que para las ventas pasadas, el costo válido es el actual del producto
UPDATE public.sale_items si
SET unit_cost = p.cost
FROM public.products p
WHERE si.product_id = p.id
AND si.unit_cost IS NULL;

-- Para items donde el producto ya no existe o no se encontró, establecer en 0 para evitar errores de cálculo
UPDATE public.sale_items SET unit_cost = 0 WHERE unit_cost IS NULL;

-- Establecer valor por defecto y restricción NOT NULL para mantener integridad
ALTER TABLE public.sale_items ALTER COLUMN unit_cost SET DEFAULT 0;
ALTER TABLE public.sale_items ALTER COLUMN unit_cost SET NOT NULL;
