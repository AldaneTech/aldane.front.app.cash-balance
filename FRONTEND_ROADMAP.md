# Hoja de ruta del frontend — MVP

Objetivo: que un usuario nuevo pueda entrar, organizar su dinero, registrar y corregir ingresos y gastos, entender su saldo y gestionar su cuenta sin ayuda.

Base disponible: dashboard, creación y consulta de movimientos con filtros y paginación, creación y consulta de carteras, gestión de categorías/marcas/tiendas y perfil con cambio de contraseña.

| Prioridad | Desarrollo | Alcance | Estado |
| --- | --- | --- | --- |
| 1 | Completar el acceso | Registro funcional, errores visibles en login y bloqueo durante el envío. | Implementado; pendiente de validación con API real |
| 2 | Editar y eliminar movimientos | Corregir importe, fecha, cartera y categoría; confirmar eliminación y actualizar saldos y gráficos. | Implementado salvo cambio de cartera; pendiente de validación con API real |
| 3 | Gestionar carteras existentes | Editar nombre y descripción; archivar explicando el efecto sobre los movimientos. | Pendiente |
| 4 | Gestionar la sesión caducada | Detectar respuestas 401, limpiar sesión y volver al login con un mensaje. | Pendiente |
| 5 | Guiar al usuario nuevo | Estados vacíos con acciones para crear la primera cartera, categorías y movimiento. | Pendiente |
| 6 | Unificar idioma y formatos | Unificar textos, fechas, importes y moneda. | Pendiente |
| 7 | Cerrar la experiencia móvil | Revisar navegación, tablas, filtros, formularios y diálogos. | Pendiente |
| 8 | Homogeneizar formularios y mensajes | Validaciones junto a campos, cargas, confirmaciones y protección ante cambios sin guardar. | Pendiente |
| 9 | Seleccionar el periodo del dashboard | Mes actual, año actual y rango personalizado compartido por indicadores y gráficos. | Pendiente |
| 10 | Limpiar el menú superior | Datos reales del usuario; retirar correo y notificaciones hasta que sean funcionales. | Pendiente |
| 11 | Recuperar contraseña | Solicitud por correo y establecimiento de nueva contraseña. Requiere backend y envío de emails. | Pendiente |
| 12 | Verificar recorridos principales | Acceso → crear cartera → registrar movimiento → corregirlo → consultar saldo → cerrar sesión, con errores y teclado. | Pendiente |

Orden: acceso y sesión → movimientos → carteras → primera experiencia → acabado visual y móvil → pruebas de recorridos.

Fuera del MVP: presupuestos, movimientos recurrentes, importación bancaria y notificaciones.

## Punto 1: criterios de aceptación

- El registro envía nombre de usuario, email y contraseña a `POST /createUser`.
- Se valida usuario no vacío, email, contraseña de al menos 8 caracteres y máximo 72 bytes UTF-8, y confirmación coincidente.
- Tras crear una cuenta, se muestra confirmación y se vuelve al login sin conservar las contraseñas.
- El login guarda el token y navega al dashboard únicamente si la respuesta incluye un token.
- Los errores de credenciales, registro y conexión aparecen en pantalla sin registrar contraseñas o tokens en consola.
- Durante una petición se bloquean campos, cambio de formulario y reenvíos.

## Avance del punto 1 — 2026-10-13

Implementado: registro conectado al endpoint público existente, confirmación y regreso al login, validaciones, errores visibles, bloqueo de reenvíos y campos durante peticiones, y eliminación de logs de credenciales/tokens.

Verificación: compilación de desarrollo y comprobación de tipos de pruebas. Se añadieron pruebas de registro, errores, respuestas sin token y envíos duplicados. La ejecución en Karma está bloqueada por la conexión local de Console Ninja (`EPERM`). Queda validar el recorrido contra una API en ejecución y ejecutar las pruebas en un entorno que permita Karma.

## Avance del punto 2 — 2026-10-13

- Acciones Edit/Delete en la lista de movimientos, con formulario precargado para importe, fecha, tipo, descripción, categoría, marca y tienda.
- Confirmación de eliminación con resumen y aviso de que se revierte el efecto sobre el saldo.
- Bloqueo de reenvíos/cierre durante peticiones, errores recuperables y recarga de la lista y carteras al completar. Se vuelve a la primera página para evitar páginas vacías tras eliminar o cambiar filtros efectivos.
- El backend recalcula el saldo en ambas operaciones; dashboard y detalle de cartera consultan sus datos al navegar a ellos.
- Dependencia pendiente: la API prohíbe cambiar la cartera de un movimiento existente. El selector queda bloqueado y se explica en el formulario. Para habilitarlo hay que ampliar el backend para ajustar ambas carteras de forma atómica.
- Compilación de desarrollo y tipos de pruebas verificados. Añadidas pruebas de edición, eliminación confirmada, bloqueo de duplicados y errores. Pendiente ejecución de Karma y recorrido con API real por la restricción de conexión local del entorno.
