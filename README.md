# Magia Interna Suite

## Descripción del Proyecto

**Magia Interna Suite** es una aplicación web de gestión empresarial (ERP) desarrollada para la administración integral de un negocio de ropa. La aplicación proporciona funcionalidades completas para la gestión de inventario, ventas, clientes, gastos y análisis financieros.

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

#### Formularios y Validación
- **React Hook Form 7.53.0** - Gestión de formularios
- **Zod 3.23.8** - Validación de esquemas
- **@hookform/resolvers 3.9.0** - Integración de validadores

#### Base de Datos y Backend
- **Supabase** - Backend-as-a-Service (BaaS)
  - PostgreSQL como base de datos principal
  - API REST automática
  - Autenticación y autorización
  - Storage para archivos

#### Herramientas de Desarrollo
- **ESLint 9.9.0** - Linting de código
- **PostCSS 8.4.47** - Procesamiento de CSS
- **Autoprefixer 10.4.20** - Prefijos CSS automáticos

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables de UI
├── pages/              # Páginas principales de la aplicación
│   ├── Dashboard.tsx   # Panel principal con métricas
│   ├── Products.tsx    # Gestión de productos/inventario
│   ├── Customers.tsx   # Gestión de clientes
│   ├── Sales.tsx       # Gestión de ventas
│   ├── Expenses.tsx    # Gestión de gastos
│   ├── Analytics.tsx   # Análisis y reportes
│   └── Settings.tsx    # Configuración del sistema
├── integrations/       # Integraciones externas
│   └── supabase/       # Cliente y tipos de Supabase
├── lib/                # Utilidades y configuraciones
├── hooks/              # Hooks personalizados de React
└── App.tsx             # Componente raíz de la aplicación
```

## Modelo de Datos

### Tablas Principales

#### `products`
- Gestión de inventario de productos
- Campos: id, name, sku, category, price, cost, stock_quantity, min_stock, size, color, image_url, is_active
- Relaciones: Referenciada por `sale_items`

#### `customers`
- Base de datos de clientes
- Campos: id, name, email, phone, address, city, postal_code, customer_type, birth_date, is_active, total_purchases
- Relaciones: Referenciada por `sales`

#### `sales`
- Registro de transacciones de venta
- Campos: id, customer_id, sale_date, total_amount, payment_method, status, discount_amount, tax_amount, notes
- Relaciones: Referencia a `customers`, referenciada por `sale_items`

#### `sale_items`
- Detalle de productos en cada venta
- Campos: id, sale_id, product_id, quantity, unit_price, total_price
- Relaciones: Referencia a `sales` y `products`

#### `expenses`
- Registro de gastos operativos
- Campos: id, description, amount, category, expense_date, payment_method, receipt_url, notes

## Funcionalidades Principales

### Dashboard
- Métricas en tiempo real de ventas diarias
- Estado del inventario con alertas de stock bajo
- Resumen de clientes activos
- Control de gastos operativos
- Gráficos de productos con mayor stock
- Sistema de alertas para productos con stock crítico

### Gestión de Productos
- CRUD completo de productos
- Control de inventario con alertas automáticas
- Gestión de categorías, tallas y colores
- Subida de imágenes de productos
- Control de stock mínimo y máximo

### Gestión de Ventas
- Creación de ventas con múltiples productos
- Cálculo automático de totales, descuentos e impuestos
- Múltiples métodos de pago
- Asociación con clientes
- Historial completo de transacciones

### Gestión de Clientes
- Base de datos completa de clientes
- Historial de compras por cliente
- Segmentación por tipo de cliente
- Información de contacto y ubicación

### Análisis y Reportes
- Dashboard analítico con gráficos
- Métricas de rendimiento
- Análisis de ventas por período
- Reportes de inventario
- Análisis de gastos por categoría

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

### Migraciones
Las migraciones de base de datos se encuentran en `supabase/migrations/`. Para aplicar las migraciones:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Aplicar migraciones
supabase db push
```

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
