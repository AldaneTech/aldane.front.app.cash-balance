# Hoja de ruta del frontend — MVP

Objetivo: que un usuario nuevo pueda entrar, organizar su dinero, registrar y corregir ingresos y gastos, entender su saldo y gestionar su cuenta sin ayuda.

Base disponible: dashboard, creación y consulta de movimientos con filtros y paginación, creación y consulta de carteras, gestión de categorías/marcas/tiendas y perfil con cambio de contraseña.

| Prioridad | Desarrollo | Alcance | Estado |
| --- | --- | --- | --- |
| 1 | Completar el acceso | Registro funcional, errores visibles en login y bloqueo durante el envío. | Implementado; pendiente de validación con API real |
| 2 | Editar y eliminar movimientos | Corregir importe, fecha, cartera y categoría; confirmar eliminación y actualizar saldos y gráficos. | Implementado salvo cambio de cartera; pendiente de validación con API real |
| 3 | Gestionar carteras existentes | Editar nombre y descripción; archivar explicando el efecto sobre los movimientos. | Implementado; pendiente de validación con API real |
| 4 | Gestionar la sesión caducada | Detectar respuestas 401, limpiar sesión y volver al login con un mensaje. | Implementado; pendiente de validación con API real |
| 5 | Catálogos iniciales al registrarse | Crear categorías, tiendas y marcas por defecto propias de cada usuario, editables desde Settings. Lista pendiente de concretar. | Pendiente |
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

## Avance del punto 3 — 2026-10-13

- Acciones Edit wallet y Archive wallet en el detalle de cada cartera.
- Formulario precargado para nombre y descripción, con reinicio seguro al cancelar y volver a abrir.
- Confirmación de archivado: la API realiza una baja lógica, conserva los movimientos y excluye la cartera de las vistas y totales activos. No hay restauración disponible en el front.
- Tras archivar se vuelve a todas las carteras y se recargan los datos. Las escrituras invalidan la caché de vistas.
- Ajuste mínimo del backend: una descripción enviada vacía ahora se borra; si se omite se conserva.
- Añadidas pruebas de edición, descripción vacía, reapertura, confirmación de archivado, errores y duplicados. Pendiente recorrido con API real y ejecución de Karma en un entorno que permita la conexión local.

## Avance del punto 4 — 2026-10-13

- Interceptor global: ante un 401 en la API protegida elimina el token y navega al login con un aviso de sesión caducada.
- Login/registro mantienen sus propios errores; respuestas 403 y errores de conexión no cierran la sesión.
- Evita redirecciones duplicadas y que un 401 tardío de una sesión anterior cierre una sesión nueva.
- Guard también en rutas hijas: detecta y limpia tokens caducados al cambiar entre secciones.
- Decodificación JWT compatible con base64url y UTF-8; expiración exacta y valores inválidos se consideran caducados.
- Añadidas pruebas de interceptor, navegación y expiración. Compilación y tipos verificados; pendiente recorrido con API real y ejecución de Karma por la restricción local del entorno.

## Revisión del punto 5 — 2026-10-13

Se sustituye la guía inicial por la creación de catálogos por defecto al registrar un usuario. Los datos deben pertenecer al nuevo usuario y permitir edición y baja mediante Settings. No se crearán movimientos ni saldos ficticios.

La creación debe realizarse en el backend junto con el usuario, dentro de una transacción. Antes de implementarlo hay que concretar los valores iniciales y revisar las restricciones de unicidad: las entidades actuales declaran los nombres de categorías, tiendas y marcas únicos globalmente, lo que impediría repetir los mismos valores para distintos usuarios. La unicidad debería ser por usuario y nombre, con la correspondiente migración de la base de datos existente.
