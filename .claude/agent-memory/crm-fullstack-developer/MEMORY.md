# CRM Cobranza Telcob - Memoria del Proyecto

## Estructura del Proyecto

- **Framework**: React + TypeScript + Vite
- **UI Library**: shadcn/ui components en `src/app/components/ui/`
- **Styling**: Tailwind CSS
- **Componentes de dominio**: `src/app/components/cobranza/`

## Patrones de Componentes

### Estilos y Convenciones
- Color principal: Indigo (indigo-600, indigo-700 para headers)
- Cards con sombras: `shadow-md border-slate-200`
- Headers de card: `bg-gradient-to-r from-indigo-50 to-slate-50`
- Texto de titulos: `text-base font-semibold text-indigo-700`
- Badges con colores segun estado (verde=vigente, amarillo=mora, naranja=castigo, rojo=judicial)

### Estructura de Tablas
- Usar Table components de shadcn/ui
- Headers compactos con `text-xs font-semibold`
- Filas con hover: `hover:bg-slate-50 transition-colors`
- Badges para estados con colores semanticos

### Sistema de Tabs
- Tabs con `TabsList` sin bordes redondeados: `rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600`
- TabsContent sin padding por defecto: `mt-0`
- Usar ScrollArea para contenido con scroll

### Iconos usados
- lucide-react para todos los iconos
- Iconos semanticos: User, Phone, Mail, MapPin, Building2, Briefcase, Calendar, CreditCard, etc.

## Archivos de Componentes UI Disponibles

- accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, skeleton, sonner, switch, table, tabs, textarea, toggle, toggle-group, tooltip

## Componentes de Cobranza Creados

- `Gestiones.tsx` - Busqueda y listado de gestiones con filtros
- `FichaGestion.tsx` - Ficha detallada del cliente con cuentas y acuerdos