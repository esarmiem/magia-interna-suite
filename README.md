# Magia Interna Suite

https://github.com/user-attachments/assets/a35b77c7-78f0-48f1-bbee-04ed5e342e1c

## Descripción del Proyecto

**Magia Interna Suite** es una aplicación web de gestión empresarial (ERP) desarrollada para la administración integral de un negocio de ropa. La aplicación proporciona funcionalidades completas para la gestión de inventario, ventas, clientes, gastos y análisis financieros con un sistema de inventario automático y validaciones en tiempo real.

## Arquitectura Técnica

### Stack Tecnológico

#### Frontend
- **React 18.3.1** - Biblioteca de interfaz de usuario
- **TypeScript 5.5.3** - Tipado estático para JavaScript
- **Vite 5.4.1** - Herramienta de construcción y desarrollo
- **React Router DOM 6.26.2** - Enrutamiento del lado del cliente
- **TanStack Query 5.56.2** - Gestión de estado del servidor y caché

#### UI/UX
- **Tailwind CSS 3.4.11** - Framework CSS utilitario
- **shadcn/ui** - Componentes de interfaz reutilizables
- **Radix UI** - Componentes primitivos accesibles
- **Lucide React 0.462.0** - Iconografía
- **next-themes 0.3.0** - Gestión de temas (claro/oscuro)
- **Sonner 1.5.0** - Sistema de notificaciones toast moderno

#### Formularios y Validación
- **React Hook Form 7.53.0** - Gestión de formularios
- **Zod 3.23.8** - Validación de esquemas
- **@hookform/resolvers 3.9.0** - Integración de validadores

#### Visualización de Datos
- **Recharts 2.12.7** - Biblioteca de gráficos y visualizaciones
- **date-fns 3.6.0** - Utilidades para manejo de fechas

#### Base de Datos y Backend
- **Supabase** - Backend-as-a-Service (BaaS)
  - PostgreSQL como base de datos principal
  - API REST automática
  - Autenticación y autorización
  - Storage para archivos
  - **Triggers y funciones automáticas** para gestión de inventario

#### Herramientas de Desarrollo
- **ESLint 9.9.0** - Linting de código
- **PostCSS 8.4.47** - Procesamiento de CSS
- **Autoprefixer 10.4.20** - Prefijos CSS automáticos

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables de UI
│   ├── ui/             # Componentes base de shadcn/ui
│   ├── sales/          # Componentes específicos de ventas
│   ├── products/       # Componentes específicos de productos
│   ├── customers/      # Componentes específicos de clientes
│   ├── expenses/       # Componentes específicos de gastos
│   ├── Header.tsx      # Header de la aplicación
│   ├── Sidebar.tsx     # Navegación lateral
│   ├── Layout.tsx      # Layout principal
│   └── ThemeProvider.tsx # Proveedor de temas
├── pages/              # Páginas principales de la aplicación
│   ├── Dashboard.tsx   # Panel principal con métricas
│   ├── Products.tsx    # Gestión de productos/inventario
│   ├── Customers.tsx   # Gestión de clientes
│   ├── Sales.tsx       # Gestión de ventas
│   ├── Expenses.tsx    # Gestión de gastos
│   ├── Analytics.tsx   # Análisis y reportes con gráficos
│   ├── Settings.tsx    # Configuración del sistema
│   ├── Index.tsx       # Página de inicio
│   └── NotFound.tsx    # Página 404
├── integrations/       # Integraciones externas
│   └── supabase/       # Cliente y tipos de Supabase
├── lib/                # Utilidades y configuraciones
├── hooks/              # Hooks personalizados de React
└── App.tsx             # Componente raíz de la aplicación

supabase/
├── migrations/         # Migraciones de base de datos
│   ├── 20250707233236-e4f5fa25-4abf-4257-aea7-613d67a49669.sql
│   ├── 20250707233237-add-anonymous-customer.sql
│   ├── 20250707233238-add-inventory-triggers.sql
│   └── 20250707233239-add-customer-purchases-trigger.sql
└── config.toml         # Configuración de Supabase
```

## Modelo de Datos

### Tablas Principales

#### `products`
- Gestión de inventario de productos
- Campos: id, name, sku, category, price, cost, stock_quantity, min_stock, size, color, image_url, is_active
- Relaciones: Referenciada por `sale_items`
- Control automático de stock con triggers

#### `customers`
- Base de datos de clientes
- Campos: id, name, email, phone, address, city, postal_code, customer_type, birth_date, is_active, total_purchases, last_purchase_date
- Relaciones: Referenciada por `sales`
- Cliente anónimo para ventas sin cliente específico
- Actualización automática de total_purchases

#### `sales`
- Registro de transacciones de venta
- Campos: id, customer_id, sale_date, total_amount, payment_method, status, discount_amount, tax_amount, notes
- Relaciones: Referencia a `customers`, referenciada por `sale_items`

#### `sale_items`
- Detalle de productos en cada venta
- Campos: id, sale_id, product_id, quantity, unit_price, total_price
- Relaciones: Referencia a `sales` y `products`
- Triggers automáticos para gestión de inventario

#### `expenses`
- Registro de gastos operativos
- Campos: id, description, amount, category, expense_date, payment_method, receipt_url, notes

## Funcionalidades Principales

### 🎯 Dashboard Mejorado
- Métricas en tiempo real de ventas diarias
- Estado del inventario con alertas de stock bajo
- Resumen de clientes activos con total de compras
- Control de gastos operativos
- Gráficos de productos con mayor stock
- Sistema de alertas para productos con stock crítico
- Acciones rápidas para navegación directa
- Diseño mejorado con StatCard personalizado

### 🏪 Gestión de Productos
- CRUD completo de productos
- Control de inventario automático con triggers
- Gestión de categorías, tallas y colores
- Subida de imágenes de productos
- Control de stock mínimo y máximo
- Alertas visuales para stock bajo
- Validación en tiempo real de stock disponible

### 🛒 Gestión de Ventas con Inventario Automático
- Sistema de inventario automático
- Creación de ventas con múltiples productos
- Validación de stock en tiempo real
- Prevención de ventas con stock insuficiente
- Cliente anónimo para ventas sin cliente específico
- Cálculo automático de totales, descuentos e impuestos
- Múltiples métodos de pago
- Asociación con clientes
- Historial completo de transacciones
- Restauración automática del inventario al eliminar ventas

### 👥 Gestión de Clientes Mejorada
- Base de datos completa de clientes
- Historial de compras automático (total_purchases)
- Fecha de última compra automática
- Segmentación por tipo de cliente
- Información de contacto y ubicación
- Cliente anónimo integrado

### 📊 Analytics y Reportes Avanzados
- Dashboard analítico completo con Recharts
- Gráficos de ventas por mes, semana y día
- Análisis de productos por categoría
- Análisis de gastos por categoría
- Distribución de tipos de clientes
- Métricas de rendimiento en tiempo real
- Gráficos interactivos y responsivos
- KPIs principales con cálculos automáticos

### ⚙️ Configuración del Sistema
- Panel de configuración completo
- Configuración de empresa
- Configuración de usuario
- Configuración de sistema (moneda, idioma, zona horaria)
- Configuración de notificaciones
- Configuración de tema (claro/oscuro)
- Configuración de inventario
- Interfaz de configuración con pestañas

## 🚀 Sistema de Inventario Automático

### Características Principales
- **Actualización automática del inventario** al crear, editar o eliminar ventas
- **Validación de stock en tiempo real** antes de procesar ventas
- **Prevención de ventas sin stock** con mensajes de error claros
- **Restauración automática del inventario** al eliminar ventas
- **Interfaz mejorada** con visualización del stock disponible

### Triggers de Base de Datos
1. **`trigger_update_inventory_on_sale_item_insert`**: Actualiza inventario al insertar items
2. **`trigger_update_inventory_on_sale_item_delete`**: Restaura inventario al eliminar items
3. **`trigger_update_inventory_on_sale_item_update`**: Ajusta inventario al editar items
4. **`trigger_validate_stock_before_sale`**: Valida stock antes de procesar ventas

### Funciones Automáticas
- **`update_inventory_on_sale_item_insert()`**: Resta cantidad vendida del stock
- **`update_inventory_on_sale_item_delete()`**: Suma cantidad de vuelta al stock
- **`update_inventory_on_sale_item_update()`**: Ajusta stock según cambios
- **`validate_stock_before_sale()`**: Valida stock disponible

### Mejoras en la Interfaz
- **Visualización del stock disponible** en selección de productos
- **Validación en tiempo real** con alertas visuales
- **Prevención de envío** con stock insuficiente
- **Mensajes de confirmación** al restaurar inventario

## 🎨 Mejoras en la UI/UX

### Sistema de Notificaciones
- **Sonner**: Notificaciones toast modernas y elegantes
- **Toast personalizado**: Integrado con el sistema de temas
- **Notificaciones contextuales**: Para acciones de inventario, ventas, etc.

### Componentes Mejorados
- **StatCard personalizado**: Para métricas del dashboard
- **Gráficos interactivos**: Con Recharts para analytics
- **Formularios mejorados**: Con validaciones en tiempo real
- **Temas adaptables**: Soporte completo para modo claro/oscuro

### Diseño Responsivo
- **Grid system mejorado**: Para diferentes tamaños de pantalla
- **Componentes adaptables**: Que se ajustan automáticamente
- **Navegación optimizada**: Sidebar colapsible

## Configuración del Entorno

### Requisitos Previos
- Node.js 18+ y npm
- Cuenta de Supabase

### Instalación

```bash
# Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd magia-interna-suite

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales de Supabase
```

### Variables de Entorno

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo en http://localhost:8080

# Construcción
npm run build        # Construcción para producción
npm run build:dev    # Construcción para desarrollo

# Linting
npm run lint         # Verificar calidad del código

# Preview
npm run preview      # Vista previa de la construcción
```

## Configuración de Supabase

### Migraciones Automáticas
Las migraciones de base de datos se encuentran en `supabase/migrations/`. Para aplicar las migraciones:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Aplicar migraciones
supabase db push
```

### Migraciones Incluidas
1. **Estructura base**: Tablas principales y relaciones
2. **Cliente anónimo**: Para ventas sin cliente específico
3. **Triggers de inventario**: Sistema automático de gestión de stock
4. **Triggers de clientes**: Actualización automática de total_purchases

### Tipos de TypeScript
Los tipos de TypeScript se generan automáticamente desde Supabase y se encuentran en `src/integrations/supabase/types.ts`.

## Características Técnicas Avanzadas

### Gestión de Estado
- **TanStack Query**: Para estado del servidor, caché y sincronización
- **React Hook Form**: Para estado de formularios
- **Context API**: Para temas y configuración global

### Optimizaciones de Rendimiento
- Lazy loading de componentes
- Caché inteligente con TanStack Query
- Optimización de imágenes
- Code splitting automático con Vite
- Invalidación automática de queries para datos actualizados

### Accesibilidad
- Componentes Radix UI con soporte completo de accesibilidad
- Navegación por teclado
- Soporte para lectores de pantalla
- Contraste y temas adaptables

### Seguridad
- Validación de esquemas con Zod
- Sanitización de datos
- Autenticación segura con Supabase
- HTTPS obligatorio en producción
- Validación de stock a nivel de base de datos

## Despliegue

### Opciones de Despliegue
- **Vercel**: Despliegue automático desde Git
- **Netlify**: Despliegue con funciones serverless
- **Supabase**: Hosting estático integrado
- **Docker**: Contenedorización completa

### Configuración de Producción
1. Configurar variables de entorno de producción
2. Ejecutar `npm run build`
3. Desplegar la carpeta `dist/` en el servidor web
4. Configurar redirecciones para SPA (React Router)

## Documentación Adicional

### Sistema de Inventario Automático
Ver el archivo `INVENTARIO-AUTOMATICO.md` para documentación detallada sobre:
- Instalación de triggers
- Casos de uso
- Solución de problemas
- Configuración avanzada

### Scripts SQL
- `database-triggers.sql`: Script completo para configuración manual
- `test-trigger.sql`: Script de pruebas para verificar funcionamiento

## Contribución

### Estándares de Código
- TypeScript estricto
- ESLint con configuración personalizada
- Prettier para formateo
- Conventional Commits

### Flujo de Desarrollo
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Desarrollar y probar cambios
4. Commit con mensaje descriptivo
5. Pull Request con descripción detallada

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Soporte

Para soporte técnico o preguntas sobre el proyecto, contactar al equipo de desarrollo o crear un issue en el repositorio.

---

**Última actualización**: Julio 2025
**Versión**: 2.0.0
**Estado**: Producción con sistema de inventario automático
