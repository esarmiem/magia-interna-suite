-- Agregar cliente anónimo para ventas sin cliente específico
INSERT INTO public.customers (name, email, phone, address, city, customer_type, is_active) VALUES
('Cliente Anónimo', NULL, NULL, NULL, NULL, 'anonymous', true)
ON CONFLICT (name) DO NOTHING; 