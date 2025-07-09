# Gestión Automática de Inventario

## Descripción

Esta funcionalidad permite que el inventario se actualice automáticamente cuando se crean o eliminan ventas, sin necesidad de intervención manual.

## Funcionalidades Implementadas

### 1. Actualización Automática del Inventario

- **Al crear una venta**: Se resta automáticamente la cantidad vendida del stock disponible
- **Al eliminar una venta**: Se suma automáticamente la cantidad de vuelta al stock disponible
- **Al editar una venta**: Se ajusta automáticamente el inventario según los cambios en las cantidades

### 2. Validación de Stock

- **Prevención de ventas sin stock**: No se permite crear ventas con cantidades mayores al stock disponible
- **Mensajes de error claros**: Se muestran mensajes específicos cuando no hay suficiente stock
- **Validación en tiempo real**: El formulario de ventas muestra el stock disponible y previene envíos con stock insuficiente

### 3. Interfaz Mejorada

- **Visualización del stock**: Se muestra el stock disponible en la selección de productos
- **Alertas visuales**: Se resaltan en rojo las cantidades que exceden el stock disponible
- **Información en tiempo real**: Se actualiza automáticamente la información del inventario

## Instalación

### Paso 1: Ejecutar el Script SQL

1. Ve a tu panel de Supabase
2. Abre el SQL Editor
3. Copia y pega el contenido del archivo `database-triggers.sql`
4. Ejecuta el script

### Paso 2: Verificar la Instalación

Ejecuta estas consultas para verificar que todo se instaló correctamente:

```sql
-- Verificar triggers
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%inventory%' OR trigger_name LIKE '%stock%';

-- Verificar funciones
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name LIKE '%inventory%' OR routine_name LIKE '%stock%';
```

## Cómo Funciona

### Triggers de Base de Datos

1. **`trigger_update_inventory_on_sale_item_insert`**: Se ejecuta después de insertar un item de venta
2. **`trigger_update_inventory_on_sale_item_delete`**: Se ejecuta después de eliminar un item de venta
3. **`trigger_update_inventory_on_sale_item_update`**: Se ejecuta después de actualizar un item de venta
4. **`trigger_validate_stock_before_sale`**: Se ejecuta antes de insertar/actualizar para validar stock

### Funciones

1. **`update_inventory_on_sale_item_insert()`**: Resta la cantidad vendida del stock
2. **`update_inventory_on_sale_item_delete()`**: Suma la cantidad de vuelta al stock
3. **`update_inventory_on_sale_item_update()`**: Ajusta el stock según los cambios en cantidad
4. **`validate_stock_before_sale()`**: Valida que hay suficiente stock disponible

## Mejoras en la Interfaz

### Formulario de Ventas (`SaleForm.tsx`)

- ✅ Muestra el stock disponible en la selección de productos
- ✅ Valida stock insuficiente en tiempo real
- ✅ Previene el envío del formulario con stock insuficiente
- ✅ Muestra alertas visuales para stock insuficiente
- ✅ Invalida automáticamente las queries de productos y dashboard

### Página de Ventas (`Sales.tsx`)

- ✅ Actualiza automáticamente el inventario al eliminar ventas
- ✅ Muestra mensaje confirmando la restauración del inventario
- ✅ Invalida las queries necesarias para reflejar los cambios

## Casos de Uso

### Escenario 1: Crear una Nueva Venta
1. El usuario selecciona productos y cantidades
2. El sistema valida que hay suficiente stock
3. Al guardar la venta, se resta automáticamente la cantidad del inventario
4. El dashboard y la lista de productos se actualizan automáticamente

### Escenario 2: Eliminar una Venta
1. El usuario elimina una venta existente
2. Se eliminan automáticamente todos los items de la venta
3. Se suma automáticamente la cantidad de vuelta al inventario
4. Se muestra un mensaje confirmando la restauración del inventario

### Escenario 3: Editar una Venta
1. El usuario modifica las cantidades de productos
2. El sistema valida el nuevo stock disponible
3. Al guardar, se ajusta automáticamente el inventario según los cambios
4. Se mantiene la integridad del inventario

## Ventajas

1. **Automatización completa**: No requiere intervención manual para actualizar inventario
2. **Integridad de datos**: Garantiza que el inventario siempre esté actualizado
3. **Prevención de errores**: Evita ventas con stock insuficiente
4. **Experiencia de usuario mejorada**: Interfaz clara y validaciones en tiempo real
5. **Escalabilidad**: Funciona automáticamente sin importar el volumen de ventas

## Notas Importantes

- Los triggers se ejecutan automáticamente en la base de datos
- No es necesario modificar el código de la aplicación para que funcione
- Las validaciones previenen errores antes de que lleguen a la base de datos
- El sistema es transaccional, por lo que si algo falla, se revierten todos los cambios

## Solución de Problemas

### Si los triggers no funcionan:
1. Verifica que el script SQL se ejecutó correctamente
2. Revisa los logs de Supabase para errores
3. Ejecuta las consultas de verificación

### Si hay problemas de rendimiento:
1. Los triggers están optimizados para operaciones individuales
2. Para grandes volúmenes, considera ejecutar actualizaciones en lotes

### Si necesitas deshabilitar temporalmente:
```sql
-- Deshabilitar triggers
ALTER TABLE public.sale_items DISABLE TRIGGER ALL;

-- Habilitar triggers
ALTER TABLE public.sale_items ENABLE TRIGGER ALL;
``` 