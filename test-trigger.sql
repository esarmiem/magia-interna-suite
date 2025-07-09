-- =====================================================
-- SCRIPT DE PRUEBA PARA VERIFICAR EL TRIGGER
-- =====================================================

-- 1. Verificar que los triggers existen
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'sales' 
AND trigger_name LIKE '%customer_total_purchases%';

-- 2. Verificar las funciones del trigger
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name LIKE '%customer_total_purchases%';

-- 3. Verificar el estado actual de clientes y ventas
SELECT 
    c.id,
    c.name,
    c.total_purchases,
    c.last_purchase_date,
    COUNT(s.id) as total_sales,
    COALESCE(SUM(s.total_amount), 0) as calculated_total
FROM customers c
LEFT JOIN sales s ON c.id = s.customer_id
GROUP BY c.id, c.name, c.total_purchases, c.last_purchase_date
ORDER BY c.name;

-- 4. Verificar las ventas más recientes
SELECT 
    s.id,
    s.customer_id,
    c.name as customer_name,
    s.total_amount,
    s.sale_date,
    s.created_at
FROM sales s
LEFT JOIN customers c ON s.customer_id = c.id
ORDER BY s.created_at DESC
LIMIT 10;

-- 5. Probar manualmente el trigger con una venta de prueba
-- (Descomenta las siguientes líneas para probar)

/*
-- Insertar una venta de prueba
INSERT INTO sales (customer_id, total_amount, payment_method, sale_date)
SELECT 
    c.id,
    50.00,
    'efectivo',
    NOW()
FROM customers c
WHERE c.name = 'NOMBRE_DEL_CLIENTE_A_PROBAR'
LIMIT 1;

-- Verificar si se actualizó el total_purchases
SELECT 
    c.name,
    c.total_purchases,
    c.last_purchase_date
FROM customers c
WHERE c.name = 'NOMBRE_DEL_CLIENTE_A_PROBAR';
*/ 