-- =====================================================
-- FUNCIONES Y TRIGGERS PARA GESTIÓN AUTOMÁTICA DE INVENTARIO
-- =====================================================

-- Función para actualizar el inventario cuando se inserta un item de venta
CREATE OR REPLACE FUNCTION update_inventory_on_sale_item_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Restar la cantidad vendida del stock del producto
  UPDATE public.products 
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar el inventario cuando se elimina un item de venta
CREATE OR REPLACE FUNCTION update_inventory_on_sale_item_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Sumar la cantidad de vuelta al stock del producto
  UPDATE public.products 
  SET stock_quantity = stock_quantity + OLD.quantity
  WHERE id = OLD.product_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar el inventario cuando se actualiza un item de venta
CREATE OR REPLACE FUNCTION update_inventory_on_sale_item_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Si cambió la cantidad, ajustar el inventario
  IF NEW.quantity != OLD.quantity THEN
    -- Primero restaurar la cantidad anterior
    UPDATE public.products 
    SET stock_quantity = stock_quantity + OLD.quantity
    WHERE id = OLD.product_id;
    
    -- Luego restar la nueva cantidad
    UPDATE public.products 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para validar que hay suficiente stock antes de insertar
CREATE OR REPLACE FUNCTION validate_stock_before_sale()
RETURNS TRIGGER AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Obtener el stock actual del producto
  SELECT stock_quantity INTO current_stock
  FROM public.products
  WHERE id = NEW.product_id;
  
  -- Verificar que hay suficiente stock
  IF current_stock < NEW.quantity THEN
    RAISE EXCEPTION 'Stock insuficiente para el producto. Stock disponible: %, Cantidad solicitada: %', 
      current_stock, NEW.quantity;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREAR TRIGGERS
-- =====================================================

-- Trigger para actualizar inventario al insertar items de venta
CREATE TRIGGER trigger_update_inventory_on_sale_item_insert
  AFTER INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_sale_item_insert();

-- Trigger para actualizar inventario al eliminar items de venta
CREATE TRIGGER trigger_update_inventory_on_sale_item_delete
  AFTER DELETE ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_sale_item_delete();

-- Trigger para actualizar inventario al actualizar items de venta
CREATE TRIGGER trigger_update_inventory_on_sale_item_update
  AFTER UPDATE ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_sale_item_update();

-- Trigger para validar stock antes de insertar items de venta
CREATE TRIGGER trigger_validate_stock_before_sale
  BEFORE INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_stock_before_sale();

-- Trigger para validar stock antes de actualizar items de venta
CREATE TRIGGER trigger_validate_stock_before_update
  BEFORE UPDATE ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_stock_before_sale();

-- =====================================================
-- VERIFICACIÓN DE INSTALACIÓN
-- =====================================================

-- Para verificar que los triggers se crearon correctamente, ejecuta:
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name LIKE '%inventory%' OR trigger_name LIKE '%stock%';

-- Para verificar que las funciones se crearon correctamente, ejecuta:
-- SELECT routine_name, routine_type 
-- FROM information_schema.routines 
-- WHERE routine_name LIKE '%inventory%' OR routine_name LIKE '%stock%'; 