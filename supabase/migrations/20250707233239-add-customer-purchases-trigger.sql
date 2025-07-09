-- =====================================================
-- TRIGGERS PARA ACTUALIZAR TOTAL_PURCHASES EN CUSTOMERS
-- =====================================================

-- Función para actualizar total_purchases cuando se inserta una venta
CREATE OR REPLACE FUNCTION update_customer_total_purchases_on_sale_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar si la venta tiene un customer_id
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE public.customers 
    SET 
      total_purchases = COALESCE(total_purchases, 0) + NEW.total_amount,
      last_purchase_date = NEW.sale_date
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar total_purchases cuando se actualiza una venta
CREATE OR REPLACE FUNCTION update_customer_total_purchases_on_sale_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Si cambió el customer_id, actualizar ambos clientes
  IF OLD.customer_id IS NOT NULL THEN
    -- Restar la venta anterior del cliente anterior
    UPDATE public.customers 
    SET total_purchases = COALESCE(total_purchases, 0) - OLD.total_amount
    WHERE id = OLD.customer_id;
  END IF;
  
  IF NEW.customer_id IS NOT NULL THEN
    -- Sumar la nueva venta al cliente nuevo
    UPDATE public.customers 
    SET 
      total_purchases = COALESCE(total_purchases, 0) + NEW.total_amount,
      last_purchase_date = NEW.sale_date
    WHERE id = NEW.customer_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar total_purchases cuando se elimina una venta
CREATE OR REPLACE FUNCTION update_customer_total_purchases_on_sale_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar si la venta tenía un customer_id
  IF OLD.customer_id IS NOT NULL THEN
    UPDATE public.customers 
    SET total_purchases = COALESCE(total_purchases, 0) - OLD.total_amount
    WHERE id = OLD.customer_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREAR TRIGGERS
-- =====================================================

-- Trigger para actualizar total_purchases al insertar ventas
CREATE TRIGGER trigger_update_customer_total_purchases_on_sale_insert
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_total_purchases_on_sale_insert();

-- Trigger para actualizar total_purchases al actualizar ventas
CREATE TRIGGER trigger_update_customer_total_purchases_on_sale_update
  AFTER UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_total_purchases_on_sale_update();

-- Trigger para actualizar total_purchases al eliminar ventas
CREATE TRIGGER trigger_update_customer_total_purchases_on_sale_delete
  AFTER DELETE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_total_purchases_on_sale_delete();

-- =====================================================
-- ACTUALIZAR DATOS EXISTENTES
-- =====================================================

-- Actualizar total_purchases para todos los clientes basado en ventas existentes
UPDATE public.customers 
SET total_purchases = (
  SELECT COALESCE(SUM(total_amount), 0)
  FROM public.sales 
  WHERE sales.customer_id = customers.id
);

-- Actualizar last_purchase_date para todos los clientes
UPDATE public.customers 
SET last_purchase_date = (
  SELECT MAX(sale_date)
  FROM public.sales 
  WHERE sales.customer_id = customers.id
); 