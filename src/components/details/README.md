# Componentes de Detalles

Esta carpeta contiene componentes para mostrar detalles completos de las entidades del sistema.

## Componentes Disponibles

### CustomerDetails
Muestra información completa de un cliente incluyendo:
- Información personal (nombre, email, teléfono, fecha de nacimiento)
- Tipo de cliente y estado
- Total de compras y última compra
- Información de dirección
- Fechas de creación y actualización

### ProductDetails
Muestra información completa de un producto incluyendo:
- Imagen del producto (si existe)
- Información básica (nombre, SKU, categoría, estado)
- Características (talla, color)
- Estado del stock con indicadores visuales
- Información de precios (precio de venta, costo, margen de ganancia)
- Descripción del producto
- Fechas de creación y actualización

### ExpenseDetails
Muestra información completa de un gasto incluyendo:
- Información principal (descripción, categoría, método de pago)
- Monto del gasto
- Fecha del gasto
- Comprobante (imagen si existe)
- Notas adicionales
- Fechas de creación y actualización

### SaleDetails
Muestra información completa de una venta incluyendo:
- Información del cliente
- Detalles de la venta (fecha, método de pago, estado)
- Lista de productos vendidos
- Totales y cálculos
- Notas de la venta

## Uso

### Importación
```typescript
import { CustomerDetails, ProductDetails, ExpenseDetails, SaleDetails } from '@/components/details';
```

### Ejemplo de Uso
```typescript
import { useState } from 'react';
import { CustomerDetails } from '@/components/details';

function CustomersPage() {
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);

  const handleView = (customer: Customer) => {
    setViewingCustomer(customer);
  };

  const handleCloseDetails = () => {
    setViewingCustomer(null);
  };

  return (
    <div>
      {/* Tu tabla o lista de clientes */}
      <Button onClick={() => handleView(customer)}>
        <Eye className="h-4 w-4" />
      </Button>

      {/* Modal de detalles */}
      {viewingCustomer && (
        <CustomerDetails
          customer={viewingCustomer}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
```

## Características

- **Modales responsivos**: Todos los componentes se muestran como modales que se adaptan a diferentes tamaños de pantalla
- **Información organizada**: Los datos se presentan en secciones claramente definidas con colores distintivos
- **Indicadores visuales**: Badges y colores para mostrar estados y categorías
- **Formato de moneda**: Uso consistente del formato de peso colombiano
- **Fechas formateadas**: Todas las fechas se muestran en formato legible
- **Manejo de datos nulos**: Muestra "No especificado" para campos vacíos
- **Cálculos automáticos**: Para productos, calcula automáticamente márgenes de ganancia

## Personalización

Los componentes están diseñados para ser flexibles y pueden personalizarse fácilmente:

- Modificar colores de las secciones
- Agregar o quitar campos
- Cambiar el layout de la información
- Ajustar el tamaño del modal
- Agregar funcionalidades adicionales

## Dependencias

- `@/components/ui/*` - Componentes base de UI
- `@/lib/currency` - Utilidades para formato de moneda
- `date-fns` - Formateo de fechas
- `lucide-react` - Iconos 