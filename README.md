# Smart Enterprise ERP · Sistema de Diseño

Catálogo de componentes Angular para el ERP de Smart Enterprise: la librería de UI, sus tokens de diseño y las plantillas de referencia que demuestran cómo se combinan. No es una aplicación de negocio — no tiene backend, ni guards, ni HTTP — es el sistema de diseño que una aplicación de negocio consume.

<div align="center">

![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

</div>

---

## Tabla de contenido

- [Smart Enterprise ERP · Sistema de Diseño](#smart-enterprise-erp--sistema-de-diseño)
  - [Tabla de contenido](#tabla-de-contenido)
  - [1. Descripción general](#1-descripción-general)
  - [2. Arquitectura](#2-arquitectura)
    - [2.1 División en cuatro áreas](#21-división-en-cuatro-áreas)
    - [2.2 Standalone al 100%, sin `NgModule`](#22-standalone-al-100-sin-ngmodule)
    - [2.3 Servicios sin `NgModule`: `@Service()`](#23-servicios-sin-ngmodule-service)
    - [2.4 Tokens de diseño en tres niveles](#24-tokens-de-diseño-en-tres-niveles)
    - [2.5 El tema, antes del primer pintado](#25-el-tema-antes-del-primer-pintado)
    - [2.6 Iconos: vocabulario cerrado, tree-shakable](#26-iconos-vocabulario-cerrado-tree-shakable)
  - [3. Estructura del proyecto](#3-estructura-del-proyecto)
  - [4. Componentes principales](#4-componentes-principales)
    - [Primitivas compartidas detrás de varios componentes](#primitivas-compartidas-detrás-de-varios-componentes)
    - [`@angular/aria`: dónde se usa y dónde no](#angulararia-dónde-se-usa-y-dónde-no)
  - [5. Servicios y lógica de negocio](#5-servicios-y-lógica-de-negocio)
  - [6. Modelos y contratos](#6-modelos-y-contratos)
  - [7. Routing y navegación](#7-routing-y-navegación)
    - [Navegación por sección, no por ruta](#navegación-por-sección-no-por-ruta)
  - [8. Estado y programación reactiva](#8-estado-y-programación-reactiva)
    - [Signal Forms: soporte, no uso end-to-end](#signal-forms-soporte-no-uso-end-to-end)
    - [`@Service()` en vez de `providedIn: 'root'`](#service-en-vez-de-providedin-root)
  - [9. Configuración](#9-configuración)
  - [10. Dependencias relevantes](#10-dependencias-relevantes)
  - [11. Observaciones técnicas](#11-observaciones-técnicas)

---

## 1. Descripción general

El proyecto es un **catálogo standalone de Angular 22**: 64 componentes compartidos, organizados en 10 familias, expuestos a través de páginas de *showcase* que los documentan en vivo (variantes, estados, accesibilidad, ambos temas). Cuatro plantillas completas (`/acceso`, `/panel`, `/clientes`, `/perfil`) demuestran cómo esos componentes se combinan en pantallas reales de un ERP, sin que exista ninguna de negocio detrás — son fachadas.

No hay servidor, ni `HttpClient`, ni guards de ruta, ni interceptores: no hay nada de eso porque no hay nada que proteger ni ninguna API que consumir. Lo que el proyecto sí tiene, con el mismo nivel de cuidado que tendría una aplicación de producción, es:

- Un **sistema de tokens de diseño en tres niveles** (primitivo → semántico → componente), en ambos temas.
- Componentes **construidos sobre primitivas headless de `@angular/aria`** donde la interacción lo justifica (combobox, tabs, accordion), y navegación de teclado propia donde esas primitivas resultaron insuficientes (ver [§11](#11-observaciones-técnicas)).
- Un conjunto de **scripts de auditoría** (`npm run audit`) que verifican por código — no por revisión manual — que el catálogo respeta sus propias reglas: contraste, geometría, consistencia de tokens, cobertura del showcase, coherencia del menú de navegación y veracidad de las cifras de la portada.

## 2. Arquitectura

### 2.1 División en cuatro áreas

El código de `src/app` se divide en cuatro áreas con una regla de dependencia unidireccional, **forzada por ESLint** (`eslint.config.js`, regla `@typescript-eslint/no-restricted-imports`) y no solo por convención:

```
core/      → infraestructura de toda la aplicación (providers, stores, servicios)
shared/    → componentes, directivas, modelos y utilidades reutilizables
layout/    → el armazón visual (navbar, sidebar, layouts de página)
features/  → páginas concretas (aquí, el showcase)
```

| Regla | Consecuencia |
|---|---|
| `shared/` no puede importar de `features/` ni de `layout/` | Un componente reutilizable no puede depender de dónde se usa. |
| `core/` no puede importar de `features/` ni de `layout/` | La infraestructura no puede depender de la presentación. |
| `layout/` no puede importar de `features/` | El armazón no puede depender de una página concreta. |

`features/` no tiene restricciones: es la única área que puede importar de las otras tres. La regla está anclada a los cuatro directorios de nivel superior (`@core/*`, `@shared/*`, etc.) y no a un patrón de nombre — un `core/layout/` interno no dispara por accidente la regla de `layout/`.

Los cuatro alias de import (`@core`, `@shared`, `@layout`, `@features`) están declarados en `tsconfig.json` y apuntan a esos mismos directorios.

### 2.2 Standalone al 100%, sin `NgModule`

No existe un solo `NgModule` en el proyecto. Cada componente, directiva y pipe declara sus propios `imports`. El bootstrap (`src/main.ts`) llama a `bootstrapApplication(App, appConfig)`, y `appConfig` (`app.config.ts`) es donde vive toda la configuración a nivel de aplicación: el router, con `withComponentInputBinding`, `withInMemoryScrolling` (con `anchorScrolling` habilitado — el sidebar salta a secciones de una página, no solo a rutas) y `withViewTransitions`; y `provideCore()`, que agrupa lo que `core/` aporta al inyector.

### 2.3 Servicios sin `NgModule`: `@Service()`

Los servicios de estado (`ThemeStore`, `LayoutStore`, `ActiveRoute`, `NotificationFeed`, `ChartTheme`, `Notifications`, `ScrollLock`, `BrowserStorage`, y `PasswordStrengthEvaluator` dentro de `shared/`) usan el decorador `@Service()` de Angular 22, que los declara singleton de raíz sin necesidad de `providedIn: 'root'` explícito ni de listarlos en `provideCore()`. Solo lo que **sí** necesita un provider explícito —los iconos de Lucide y el `LOCALE_ID`— aparece en `core-providers.ts`.

### 2.4 Tokens de diseño en tres niveles

`src/styles.css` importa, en orden, `tokens/primitive.css` → `tokens/semantic.css` → `tokens/component.css`. La regla, verificada por `scripts/audit-consistency.mjs`, es que **un componente solo puede leer tokens de nivel 3** (`--control-height-md`, `--chart-series-1`, etc.), nunca un valor primitivo ni un hex literal. Esto es lo que hace que un tema oscuro sea cambiar el archivo semántico, no auditar cada hoja de estilos.

`styles/shell.css` documenta por qué las clases transversales que ahí viven (`.focus-ring`, `.touch-target`, `.tone-*`, `.modal-open`) están deliberadamente **fuera de `@layer`**: en la cascada de CSS, las reglas sin capa le ganan a `@layer utilities` de Tailwind, así que sobrescriben utilidades sin necesitar `!important` — razón por la cual `styles.css` importa Tailwind *antes* que este archivo.

### 2.5 El tema, antes del primer pintado

`src/index.html` incluye un script síncrono que aplica la clase `dark` a `<html>` **antes de que Angular arranque**, leyendo la misma llave de `localStorage` que escribe `BrowserStorage` (`seerp:theme`, en `core/theme/theme.model.ts`). Es la única pieza de estado que se aplica fuera de Angular, y solo el tema: pintar el fondo desde el primer frame importa; el estado del sidebar no, porque el sidebar no existe hasta que la aplicación se renderiza. La llave y el formato (JSON, por eso el `JSON.parse`) están duplicados a propósito en ese script, porque corre antes de que exista nada que importar.

### 2.6 Iconos: vocabulario cerrado, tree-shakable

`core/icons/lucide-icons.ts` registra un subconjunto explícito de `@lucide/angular` (`ICONS`) y deriva de ahí el tipo `IconName`, que es un *union type* literal — no `string`. `strictTemplates` rechaza en tiempo de compilación un `<app-icon name="...">` con un nombre no registrado, en vez de dejar un hueco vacío en producción. `app-icon` (`shared/components/media/icon`) es el único punto del sistema que conoce a Lucide directamente; cambiar de familia de iconos toca ese archivo y el catálogo, nada más.

## 3. Estructura del proyecto

```
src/
├── index.html                  # script de tema pre-pintado
├── main.ts                     # bootstrapApplication
├── styles.css                  # orden de imports: tokens → base → shell
├── styles/
│   ├── tokens/
│   │   ├── primitive.css       # nivel 1 — valores en bruto, sin significado
│   │   ├── semantic.css        # nivel 2 — superficies, tinta, tonos
│   │   └── component.css       # nivel 3 — lo único que un componente puede leer
│   ├── base.css                # reset y elementos base
│   ├── fonts.css
│   └── shell.css               # clases transversales, fuera de @layer
└── app/
    ├── app.ts / app.html       # raíz: <router-outlet> + toaster
    ├── app.config.ts           # providers a nivel de aplicación
    ├── app.routes.ts           # árbol de rutas
    │
    ├── core/                   # infraestructura — ver §2.1
    │   ├── charts/             # ChartTheme (Chart.js gobernado por tokens)
    │   ├── icons/              # catálogo de Lucide — ver §2.6
    │   ├── layout/             # ActiveRoute, LayoutStore, layout.model
    │   ├── notifications/      # NotificationFeed, notification.model
    │   ├── services/           # Notifications (toasts), ScrollLock
    │   ├── storage/            # BrowserStorage (localStorage tolerante a fallos)
    │   └── theme/              # ThemeStore, theme.model
    │
    ├── shared/                 # librería reutilizable — ver §4
    │   ├── components/         # 64 componentes, en 10 familias — ver tabla en §4
    │   ├── directives/         # Tooltip
    │   ├── models/             # Tone, StatusTone, ControlSize, ControlError
    │   └── utils/              # anchored-position, calendar, date-mask, dialog-behavior…
    │
    ├── layout/                 # el armazón — ver §2.1
    │   ├── components/         # Navbar, Sidebar, SidebarNavItem, PageHeader
    │   └── layouts/            # MainLayout, CenteredLayout
    │
    └── features/
        └── showcase/           # la única feature: el catálogo en sí
            ├── components/     # ShowcasePage, ShowcaseBlock, VariantGrid/Row
            ├── directives/     # CopyToken (copiar un token al portapapeles)
            ├── pages/          # portada, una página por familia y las plantillas — ver §7
            └── utils/          # contrast-ratio, token-catalog

scripts/                        # auditorías estáticas — ver §11
```

## 4. Componentes principales

Los 64 componentes compartidos viven en `shared/components/`, agrupados en 10 familias. Todos son standalone, `ChangeDetectionStrategy.OnPush` (por defecto en Angular 22) y usan `input()` / `output()` / `model()` en vez de decoradores `@Input()` / `@Output()`.

| Familia | Componentes | Responsabilidad |
|---|---|---|
| `actions` | `button`, `segmented-control`, `social-button`, `theme-toggle` | Controles de acción. `variant` y `size` son ejes ortogonales — ninguna variante trae su propio padding. |
| `forms` | 20 componentes: `field`, `input`, `textarea`, `select`, `checkbox`, `toggle-switch`, `radio-group`, `number-input`, `search-input`, `password-input`, `password-strength-meter`, `password-requirements`, `otp-input`, `file-upload`, `slider`, `rating`, `combobox`, `date-picker`, `date-range-picker`, `date-grid` | Controles de formulario. Todos comparten el contrato de `useFormControl` (`shared/utils/form-control.ts`) para `errorId`, `message` y `onBlur`. |
| `feedback` | `status-badge`, `badge`, `alert`, `progress`, `skeleton`, `empty-state`, `error-state`, `resend-timer` | Comunican estado y resultado. |
| `overlays` | `modal`, `confirm-dialog`, `drawer`, `dropdown-menu`, `notification-list` | Superficies flotantes. Comparten el comportamiento de `useDialog` (`shared/utils/dialog-behavior.ts`) — trampa de foco, bloqueo de scroll, Escape, devolución de foco. |
| `navigation` | `breadcrumb`, `tabs`, `tab-panel`, `accordion`, `accordion-item`, `stepper`, `pagination` | Moverse por la aplicación o por el contenido de una pantalla. |
| `data` | `data-table`, `table-toolbar`, `chart-canvas` | Tabla (sobre TanStack Table) y gráficos (sobre Chart.js). |
| `containers` | `section-card`, `stat-card`, `form-card`, `divider` | Envuelven contenido. |
| `media` | `icon`, `avatar`, `avatar-group`, `activity-item`, `timeline` | Identidad visual y multimedia. |
| `patterns` | `media-card`, `checklist-item`, `schedule-card`, `schedule-chip`, `calendar-cell` | Composiciones generalizadas — no traen vocabulario de negocio propio, a diferencia de las plantillas de `features/showcase/pages`. |
| `typography` | `code-block`, `code-list`, `kbd` | Texto técnico. |

### Primitivas compartidas detrás de varios componentes

Cuatro utilidades en `shared/utils/` existen porque más de un componente necesitaba exactamente el mismo comportamiento, y dos copias de una regla son dos respuestas a la misma pregunta:

- **`anchored-position.ts`** — posiciona un panel flotante contra un ancla, con volteo y ajuste a los bordes del viewport. Base de `dropdown-menu`, `tooltip`, `combobox`, `date-picker` y `date-range-picker`.
- **`dialog-behavior.ts`** (`useDialog`) — trampa de foco, bloqueo de scroll, Escape y devolución de foco. Base de `modal`, `confirm-dialog` y `drawer`.
- **`form-control.ts`** (`useFormControl`) — `errorId`, mensaje de error derivado y marcado de "touched" hacia Signal Forms. Compartido por los controles de `forms/`.
- **`calendar.ts`** / **`date-mask.ts`** — layout de mes en semanas completas y máscara de escritura `dd/mm/aaaa`. Compartidos por `date-picker`, `date-range-picker` y `date-grid`.

### `@angular/aria`: dónde se usa y dónde no

Las primitivas headless de `@angular/aria` se usan en `combobox`, `accordion`, `accordion-item`, `tabs` y `tab-panel`. **No** se usan en `date-grid`: se probaron primero (`Grid`, `GridRow`, `GridCell`) y se midieron dos huecos — el directivo mueve el `tabindex` pero nunca llama a `focus()`, y no ofrece forma de fijar la celda activa inicial — que lo hacían inviable para un calendario que tiene que abrir sobre el día ya elegido. Se conservó la semántica ARIA que la librería enseña (`role="grid"` / `row` / `gridcell`) y se escribió la navegación de teclado a mano. El razonamiento completo está documentado en el JSDoc de `date-grid.ts`.

## 5. Servicios y lógica de negocio

No hay lógica de negocio — es un catálogo de componentes. Los "servicios" son infraestructura de la aplicación anfitriona (estado de UI, no de dominio):

| Servicio | Ubicación | Responsabilidad |
|---|---|---|
| `ThemeStore` | `core/theme` | Preferencia de tema (claro/oscuro/sistema), persistencia y sincronización con `prefers-color-scheme`. |
| `LayoutStore` | `core/layout` | Estado del armazón: riel colapsado, cajón móvil abierto, submenús expandidos. Solo estado — sin efectos, sin DOM. |
| `ActiveRoute` | `core/layout` | La URL actual como signal (`Router.url` es una propiedad, no un signal), con coincidencia por ruta y por sección (`#fragment`). |
| `NotificationFeed` | `core/notifications` | El centro de notificaciones persistentes (la bandeja de la campana), con datos de ejemplo porque no hay backend. |
| `Notifications` | `core/services` | Toasts efímeros, unificados a través de `ngx-sonner`. Única puerta por la que el sistema emite un toast. |
| `ScrollLock` | `core/services` | Bloqueo de scroll del documento **contado por referencia**, para que dos overlays abiertos a la vez no se pisen al cerrarse. |
| `BrowserStorage` | `core/storage` | Acceso a `localStorage` tolerante a fallos (modo privado, cuota agotada): degrada a memoria en vez de romper la pantalla. |
| `ChartTheme` | `core/charts` | Colorea Chart.js con los tokens `--chart-*` del tema activo; asigna la paleta categórica del sistema en vez de dejar que Chart.js use la suya. |
| `PasswordStrengthEvaluator` | `shared/components/forms/password-strength-meter` | Evalúa la fortaleza de una contraseña con `zxcvbn`, cargado de forma perezosa (ver [§10](#10-dependencias-relevantes)). |

## 6. Modelos y contratos

| Modelo | Ubicación | Qué fija |
|---|---|---|
| `Tone` | `shared/models/tone.model.ts` | El vocabulario de matices de color del sistema (`neutral`, `blue`, `green`…). Un componente nunca nombra un matiz en su hoja de estilos: pone `data-tone` y una clase `.tone-*`. |
| `StatusTone` | `shared/models/status-tone.model.ts` | El *significado* de un estado (`success`, `warning`, `danger`…), no un color — mapea a un `Tone` a través de `STATUS_HUE`. |
| `ControlSize` | `shared/models/size.model.ts` | El eje de tamaño (`sm` / `md` / `lg`), deliberadamente ortogonal a `variant`. |
| `ControlError` | `shared/models/form-control.model.ts` | La forma mínima de un error de validación (`kind` + `message` opcional) que coincide con lo que emite Signal Forms sin atarse a sus tipos genéricos. |
| `NavItem` / `NavSection` | `layout/components/sidebar/navigation.model.ts` | El árbol de navegación: nodo con `route` y `fragment` opcional, o grupo con `children`. |
| `NotificationItem` | `core/notifications/notification.model.ts` | Una entrada persistente del centro de notificaciones (no confundir con los toasts efímeros). |
| `IsoDate` | `shared/utils/calendar.ts` | Alias de `string` para fechas en formato `YYYY-MM-DD`. Las fechas viajan como texto, nunca como `Date`, para evitar el desfase de un día que produce `new Date('2026-09-08')` al interpretarse como medianoche UTC. |

## 7. Routing y navegación

El árbol de rutas (`app.routes.ts`) tiene dos ramas paralelas — no anidadas — según si la pantalla lleva navegación:

- **`MainLayout`** (`path: ''`), para toda página con menú: `/inicio`, `/fundamentos`, `/datos`, `/superposiciones`, `/acciones`, `/formularios`, `/retroalimentacion`, `/navegacion`, `/contenedores`, `/shell`, `/panel`, `/clientes`, `/perfil`, `/patrones`.
- **`CenteredLayout`** (`path: 'acceso'`), para pantallas que se muestran solas.

Todas las rutas cargan con `loadComponent` (lazy). Los dos layouts se cargan de forma eager porque uno de los dos se renderiza en cada navegación — diferirlos solo añadiría una vuelta de red antes del primer pintado.

Las URLs están en español porque son interfaz de usuario; los ids de ruta, nombres de componente y archivos se mantienen en inglés, igual que el resto del código.

### Un solo submenú abierto

El sidebar es un acordeón de árbol completo: abrir un grupo cierra a todos los demás, incluidos los de otras secciones. Cada nodo recibe como «hermanos» los ids de primer nivel de **todo** el árbol (`Sidebar.topLevelIds`), no los de su propia sección. Sin eso, cuatro grupos abiertos a la vez obligaban a hacer scroll dentro del menú para ver lo que ya estaba abierto.

La rama que contiene la ruta activa se abre sola al navegar (`LayoutStore.openBranch`, disparado desde `sidebar-nav-item`), y puede cerrarse como cualquier otra: quien abre otro grupo está diciendo qué quiere ver.

### Navegación por sección, no por ruta

El sidebar (`layout/layouts/main-layout/main-navigation.config.ts`) no asigna una ruta a cada uno de los 64 componentes — asignaría una ruta a cada uno solo para satisfacer al menú, cuando cada página de familia es una sola historia contada de corrido. En su lugar, las hojas del menú apuntan a una ruta más un **`fragment`** (ancla), y la tarjeta que abre ese grupo dentro de la página lleva el `id` correspondiente. `MainLayout` fija el offset de scroll del router (`ViewportScroller.setOffset`) a la altura medida de la barra superior, para que el ancla no quede tapada.

`scripts/audit-navigation.mjs` comprueba en cada build que toda entrada del menú apunta a una ruta y a un ancla que existen, y que ninguna ancla de una página queda sin una entrada que la referencie.

## 8. Estado y programación reactiva

**Signals ante todo.** RxJS aparece en exactamente dos archivos de todo el proyecto, siempre en la frontera con una API que es Observable por naturaleza — nunca como mecanismo de estado propio:

- `core/layout/active-route.ts` — `toSignal(router.events.pipe(...))`, para exponer la URL como signal.
- `shared/components/forms/password-strength-meter/password-strength-meter.ts` — `debounceTime` sobre lo que se teclea.

Todo lo demás — stores, estado local de componente, estado derivado — es `signal()` / `computed()` / `effect()` / `linkedSignal()` donde aplica.

### Signal Forms: soporte, no uso end-to-end

Los controles de `forms/` **cumplen el contrato `FormValueControl`** de Signal Forms (Angular 22): exponen `value` como `model()` y aceptan `errors`, `touched`, `disabled` y `name`, que la directiva `formField` mantiene sincronizados. `shared/utils/field-touch.ts` resuelve el token `FORM_FIELD` para marcar el campo como tocado cuando el `blur` — que no burbujea — ocurre en un `<input>` nativo anidado dentro del elemento del componente.

Dicho lo anterior, **ninguna página del showcase construye un `form()` real**: cada componente se demuestra de forma standalone, con `[(value)]` y un `error` escrito a mano. Es coherente con lo que el proyecto es — un catálogo de componentes, no un formulario de negocio — y es también la razón por la que integrar estos controles en un `form()` de Signal Forms en la aplicación anfitriona no debería requerir cambios en el componente: los seams ya existen.

### `@Service()` en vez de `providedIn: 'root'`

Los nueve servicios del proyecto (ver [§5](#5-servicios-y-lógica-de-negocio)) usan el decorador `@Service()`, que en Angular 22 los declara singleton de raíz automáticamente.

## 9. Configuración

No hay `environments/`: el proyecto no tiene nada que configurar por entorno porque no consume ninguna API. La única configuración de build vive en `angular.json`:

| Configuración | Detalle |
|---|---|
| **Presupuestos de producción** | `initial`: 700 kB de aviso / 850 kB de error. `anyComponentStyle`: 4 kB de aviso / 8 kB de error. |
| **`outputHashing: 'all'`** | Solo en producción, para el cacheo de assets. |
| **Locale** | `es-MX`, registrado con `registerLocaleData` en `core-providers.ts` y fijado como `LOCALE_ID`. Gobierna formato de fechas, números y plurales. |
| **Alias de import** | `@core`, `@shared`, `@layout`, `@features` (`tsconfig.json`), reflejando las cuatro áreas de la arquitectura. |
| **Prefijo de selector** | `app`, forzado por ESLint (`@angular-eslint/component-selector` / `directive-selector`), no solo declarado en `angular.json`. |
| **TypeScript estricto** | `strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, más `strictTemplates`, `strictInjectionParameters` y `strictInputAccessModifiers` del lado de Angular. |

## 10. Dependencias relevantes

| Paquete | Para qué se usa |
|---|---|
| `@angular/aria` | Primitivas headless de accesibilidad — ver [§4](#4-componentes-principales). |
| `@lucide/angular` | Fuente del vocabulario de iconos (ver [§2.6](#26-iconos-vocabulario-cerrado-tree-shakable)). |
| `@tanstack/angular-table` | Motor de `data-table`: ordenamiento, paginado y modelo de filas, sin UI propia — la UI es del componente. |
| `chart.js` | Motor de `chart-canvas`, coloreado por `ChartTheme` en vez de por su paleta por defecto. |
| `@zxcvbn-ts/core` + `language-common` + `language-es-es` | Evaluación de fortaleza de contraseña en `password-strength-meter`, con diccionario en español. **Cargado de forma perezosa** (`import()` dinámico dentro de `password-strength-evaluator.ts`): no entra al bundle inicial. |
| `ngx-sonner` | Motor de toasts detrás de `Notifications` (`core/services/notification.ts`). |
| `tailwindcss` (v4) + `@tailwindcss/postcss` | Utilidades de bajo nivel; los tokens de diseño son la capa por encima, no un reemplazo. |
| `rxjs` | Solo en la frontera con APIs Observable — ver [§8](#8-estado-y-programación-reactiva). |
| `angular-eslint` + `typescript-eslint` | Además de estilo, **hacen cumplir la arquitectura**: el prefijo de selector y las fronteras entre `core/` / `shared/` / `layout/` / `features/` son reglas de lint, no acuerdos verbales. |

## 11. Observaciones técnicas

- **Sin `.spec.ts` y sin documentación previa, por decisión de alcance.** Este README es la primera documentación estructurada del proyecto — no reemplaza pruebas, que quedan fuera del alcance actual.

- **El servidor de desarrollo transfiere el paquete completo de Lucide (~48 MB) en cada recarga.** Es un costo exclusivo de desarrollo: `@lucide/angular` publica cada icono como un componente Angular completo (~12 MB de origen), y el *dev server* no puede aplicar tree-shaking sobre eso — producción sí lo hace, y el bundle inicial real (`~644 kB` en bruto, `~117 kB` de transferencia) no lo incluye entero. Se evaluó extraer solo los datos de trazo de los iconos usados (reduciendo esa carga a ~12 kB) y se revirtió deliberadamente: el costo es solo de desarrollo y no justificaba abandonar la forma documentada de consumir la librería.

- **`date-grid` no usa `@angular/aria` para su navegación de teclado**, a diferencia del resto de componentes con interacción compleja — ver [§4](#4-componentes-principales) para el razonamiento medido, no supuesto, detrás de esa excepción.

- **Fronteras de arquitectura verificables, no solo documentadas.** Tanto la separación en cuatro áreas (§2.1) como el sistema de tokens en tres niveles (§2.4) tienen un mecanismo que falla el build o el lint si se rompen — no dependen de que quien contribuye las recuerde.

---

<div align="center">

**Convenciones del repositorio:** identificadores en inglés, documentación (JSDoc/comentarios) en español de México · interfaz de usuario en español (México) · componentes standalone, sin `NgModule`.

</div>
