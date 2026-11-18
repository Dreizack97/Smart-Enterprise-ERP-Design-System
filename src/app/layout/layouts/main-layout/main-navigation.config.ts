import { NavSection } from '@layout/components/sidebar/navigation.model';

/**
 * El árbol de navegación del catálogo.
 *
 * ## Cómo está organizado
 *
 * Secciones en el nivel superior — fundamentos, componentes, armazón,
 * plantillas — y dentro de las familias de componentes, un submenú por
 * **grupo de componentes que responden a la misma pregunta**: campos de
 * texto juntos, selección junta, fechas juntas. Sesenta y un componentes en
 * una sola lista plana es un índice, no un menú; agruparlos es lo que
 * permite que alguien que necesita «una fecha» la encuentre sin saber que el
 * componente se llama `date-range-picker`.
 *
 * Las familias reflejan `shared/components/`, para que el menú y las
 * carpetas se mantengan como una sola estructura y no como dos que se
 * desalinean.
 *
 * ## Por qué las hojas son anclas y no rutas
 *
 * Cada familia es una página que cuenta una sola historia — por qué estos
 * controles comparten altura, por qué estos colores significan esto — y una
 * ruta por componente cortaría la historia en sesenta y un fragmentos para
 * complacer al menú. Así que las hojas apuntan **dentro** de la página, a la
 * tarjeta que abre su grupo, y la tarjeta lleva el `anchor` correspondiente.
 * `scripts/audit-navigation.mjs` comprueba que cada una de esas anclas
 * exista.
 */
export const NAV_SECTIONS: readonly NavSection[] = [
  {
    items: [{ id: 'home', label: 'Inicio', icon: 'house', route: '/inicio' }],
  },
  {
    title: 'Fundamentos',
    items: [
      {
        id: 'foundations',
        label: 'Fundamentos',
        icon: 'layout-grid',
        children: [
          { id: 'foundations-color', label: 'Color', route: '/fundamentos', fragment: 'color' },
          {
            id: 'foundations-type',
            label: 'Tipografía',
            route: '/fundamentos',
            fragment: 'tipografia',
          },
          {
            id: 'foundations-shape',
            label: 'Forma y movimiento',
            route: '/fundamentos',
            fragment: 'forma',
          },
          {
            id: 'foundations-icons',
            label: 'Iconografía',
            route: '/fundamentos',
            fragment: 'iconografia',
          },
        ],
      },
    ],
  },
  {
    title: 'Componentes',
    items: [
      {
        id: 'actions',
        label: 'Acciones',
        icon: 'zap',
        children: [
          { id: 'actions-button', label: 'Botones', route: '/acciones', fragment: 'botones' },
          {
            id: 'actions-segmented',
            label: 'Control segmentado',
            route: '/acciones',
            fragment: 'segmentado',
          },
        ],
      },
      {
        id: 'forms',
        label: 'Formularios',
        icon: 'pencil',
        children: [
          { id: 'forms-field', label: 'El campo', route: '/formularios', fragment: 'campo' },
          { id: 'forms-text', label: 'Texto y números', route: '/formularios', fragment: 'texto' },
          {
            id: 'forms-choice',
            label: 'Selección',
            route: '/formularios',
            fragment: 'seleccion',
          },
          {
            id: 'forms-security',
            label: 'Contraseña y verificación',
            route: '/formularios',
            fragment: 'seguridad',
          },
          {
            id: 'forms-measure',
            label: 'Archivos y medida',
            route: '/formularios',
            fragment: 'medida',
          },
          { id: 'forms-dates', label: 'Fechas', route: '/formularios', fragment: 'fechas' },
        ],
      },
      {
        id: 'feedback',
        label: 'Retroalimentación',
        icon: 'info',
        children: [
          {
            id: 'feedback-badges',
            label: 'Distintivos',
            route: '/retroalimentacion',
            fragment: 'distintivos',
          },
          {
            id: 'feedback-messages',
            label: 'Mensajes y vacíos',
            route: '/retroalimentacion',
            fragment: 'mensajes',
          },
          {
            id: 'feedback-progress',
            label: 'Progreso y espera',
            route: '/retroalimentacion',
            fragment: 'progreso',
          },
        ],
      },
      {
        id: 'overlays',
        label: 'Superposiciones',
        icon: 'copy',
        children: [
          {
            id: 'overlays-dialogs',
            label: 'Diálogos',
            route: '/superposiciones',
            fragment: 'dialogos',
          },
          {
            id: 'overlays-menus',
            label: 'Menús y ayudas',
            route: '/superposiciones',
            fragment: 'menus',
          },
          {
            id: 'overlays-panels',
            label: 'Paneles y avisos',
            route: '/superposiciones',
            fragment: 'paneles',
          },
        ],
      },
      {
        id: 'navigation',
        label: 'Navegación',
        icon: 'list',
        children: [
          {
            id: 'navigation-place',
            label: 'Dónde se está',
            route: '/navegacion',
            fragment: 'ubicacion',
          },
          {
            id: 'navigation-sections',
            label: 'Secciones',
            route: '/navegacion',
            fragment: 'secciones',
          },
          {
            id: 'navigation-progress',
            label: 'Recorrido',
            route: '/navegacion',
            fragment: 'recorrido',
          },
        ],
      },
      {
        id: 'data',
        label: 'Datos',
        icon: 'chart-column',
        children: [
          { id: 'data-table', label: 'Tabla', route: '/datos', fragment: 'tabla' },
          { id: 'data-charts', label: 'Gráficos', route: '/datos', fragment: 'graficos' },
        ],
      },
      {
        id: 'containers',
        label: 'Contenedores y multimedia',
        icon: 'package',
        children: [
          {
            id: 'containers-cards',
            label: 'Tarjetas',
            route: '/contenedores',
            fragment: 'tarjetas',
          },
          {
            id: 'containers-identity',
            label: 'Identidad',
            route: '/contenedores',
            fragment: 'identidad',
          },
          {
            id: 'containers-history',
            label: 'Cronología',
            route: '/contenedores',
            fragment: 'cronologia',
          },
          {
            id: 'containers-code',
            label: 'Texto técnico',
            route: '/contenedores',
            fragment: 'tecnico',
          },
        ],
      },
      {
        id: 'patterns',
        label: 'Patrones',
        icon: 'calendar',
        children: [
          { id: 'patterns-cards', label: 'Fichas', route: '/patrones', fragment: 'fichas' },
          { id: 'patterns-agenda', label: 'Agenda', route: '/patrones', fragment: 'agenda' },
        ],
      },
    ],
  },
  {
    title: 'Armazón',
    items: [
      {
        id: 'shell',
        label: 'Shell',
        icon: 'layout-grid',
        children: [
          { id: 'shell-frame', label: 'Marco', route: '/shell', fragment: 'marco' },
          {
            id: 'shell-header',
            label: 'Encabezado de página',
            route: '/shell',
            fragment: 'encabezado',
          },
          { id: 'shell-centered', label: 'Marco centrado', route: '/shell', fragment: 'centrado' },
        ],
      },
    ],
  },
  {
    title: 'Plantillas',
    items: [
      { id: 'template-access', label: 'Acceso', icon: 'lock', route: '/acceso' },
      { id: 'template-panel', label: 'Panel', icon: 'chart-pie', route: '/panel' },
      { id: 'template-list', label: 'Listado', icon: 'users', route: '/clientes' },
      { id: 'template-profile', label: 'Perfil', icon: 'user', route: '/perfil' },
      { id: 'template-mail', label: 'Correo', icon: 'mail', route: '/correo' },
    ],
  },
];
