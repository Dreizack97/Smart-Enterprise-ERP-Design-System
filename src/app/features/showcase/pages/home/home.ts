import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconName } from '@core/icons/lucide-icons';
import { Badge } from '@shared/components/feedback/badge/badge';
import { SectionCard } from '@shared/components/containers/section-card/section-card';
import { StatCard } from '@shared/components/containers/stat-card/stat-card';
import { Icon } from '@shared/components/media/icon/icon';
import { Tone } from '@shared/models/tone.model';
import { PageHeader } from '@layout/components/page-header/page-header';

/** Una familia de `shared/components`, con la página donde se documenta. */
export interface Family {
  /** El nombre de la carpeta. Es la llave con la que el audit la comprueba. */
  readonly folder: string;

  readonly label: string;
  readonly icon: IconName;

  /** Cuántos componentes tiene la carpeta. Verificado por `audit-home.mjs`. */
  readonly count: number;

  /** A dónde lleva. Dos familias comparten página, y eso se dice, no se disimula. */
  readonly route: string;
  readonly fragment?: string;

  /** Qué resuelve, en una línea. */
  readonly summary: string;
}

/**
 * Las diez familias, con el conteo que de verdad tienen en disco.
 *
 * Escritas aquí y **comprobadas** por `scripts/audit-home.mjs` contra
 * `shared/components`: la portada es lo primero que alguien lee, y una portada
 * que promete sesenta y un componentes cuando hay sesenta y dos es peor que
 * una sin cifras. El audit falla la compilación antes de que la cifra mienta.
 *
 * `media` y `typography` no tienen página propia: se documentan dentro de
 * Contenedores, y la entrada lo dice con su `fragment` en lugar de fingir una
 * ruta que no existe.
 */
const FAMILIES: readonly Family[] = [
  {
    folder: 'actions',
    label: 'Acciones',
    icon: 'zap',
    count: 3,
    route: '/acciones',
    summary: 'Botones y control segmentado. Variante y tamaño son ejes separados.',
  },
  {
    folder: 'forms',
    label: 'Formularios',
    icon: 'pencil',
    count: 19,
    route: '/formularios',
    summary: 'La familia más grande: un solo campo, una sola forma de fallar.',
  },
  {
    folder: 'feedback',
    label: 'Retroalimentación',
    icon: 'info',
    count: 8,
    route: '/retroalimentacion',
    summary: 'Decir qué pasó, dónde pasó, y con el color que eso significa.',
  },
  {
    folder: 'overlays',
    label: 'Superposiciones',
    icon: 'copy',
    count: 5,
    route: '/superposiciones',
    summary: 'Diálogos, menús y paneles. Foco atrapado y devuelto donde estaba.',
  },
  {
    folder: 'navigation',
    label: 'Navegación',
    icon: 'list',
    count: 7,
    route: '/navegacion',
    summary: 'Moverse por la aplicación y por el contenido de una pantalla.',
  },
  {
    folder: 'data',
    label: 'Datos',
    icon: 'chart-column',
    count: 3,
    route: '/datos',
    summary: 'Tabla y gráficos. Ordenar en español no es un detalle.',
  },
  {
    folder: 'containers',
    label: 'Contenedores',
    icon: 'package',
    count: 4,
    route: '/contenedores',
    fragment: 'tarjetas',
    summary: 'Lo que envuelve al contenido: tarjetas, paneles, separadores.',
  },
  {
    folder: 'media',
    label: 'Multimedia',
    icon: 'image',
    count: 5,
    route: '/contenedores',
    fragment: 'identidad',
    summary: 'Iconos, avatares y cronologías. Se documenta con Contenedores.',
  },
  {
    folder: 'patterns',
    label: 'Patrones',
    icon: 'calendar',
    count: 5,
    route: '/patrones',
    summary: 'Composiciones generalizadas, sin vocabulario de negocio adentro.',
  },
  {
    folder: 'typography',
    label: 'Texto técnico',
    icon: 'code',
    count: 2,
    route: '/contenedores',
    fragment: 'tecnico',
    summary: 'Bloques de código y teclas. Se documenta con Contenedores.',
  },
];

/** Una plantilla: una pantalla completa armada solo con piezas del sistema. */
interface Template {
  readonly label: string;
  readonly icon: IconName;
  readonly route: string;
  readonly summary: string;
}

const TEMPLATES: readonly Template[] = [
  {
    label: 'Acceso',
    icon: 'lock',
    route: '/acceso',
    summary: 'Entrar, registrarse y verificar un código, en tres pasos.',
  },
  {
    label: 'Panel',
    icon: 'chart-pie',
    route: '/panel',
    summary: 'Indicadores, gráficos y actividad reciente.',
  },
  {
    label: 'Listado',
    icon: 'users',
    route: '/clientes',
    summary: 'Tabla con filtros, orden, paginación y detalle en un panel.',
  },
  {
    label: 'Perfil',
    icon: 'user',
    route: '/perfil',
    summary: 'Cuenta, seguridad y preferencias. Se llega desde el menú de cuenta.',
  },
];

/** Una regla del sistema, con el mecanismo que impide romperla. */
interface Principle {
  readonly title: string;
  readonly body: string;
  readonly icon: IconName;
  readonly tone: Tone;
}

/**
 * Los principios, cada uno con lo que los hace cumplirse.
 *
 * Ninguno es una aspiración: los cuatro tienen detrás un linter, un script o
 * un tipo que falla la compilación. Eso es lo que se está documentando —no que
 * el sistema sea coherente, sino por qué no puede dejar de serlo.
 */
const PRINCIPLES: readonly Principle[] = [
  {
    icon: 'layout-grid',
    tone: 'blue',
    title: 'Tokens en tres niveles',
    body: 'Primitivo alimenta a semántico, y semántico a componente. Un componente solo lee el tercer nivel: nunca un hex, nunca un valor en bruto. Lo verifica «audit:consistency».',
  },
  {
    icon: 'shield',
    tone: 'green',
    title: 'Accesibilidad como requisito',
    body: 'Foco visible, objetivo táctil de 44 px, «prefers-reduced-motion» y las primitivas de @angular/aria donde el patrón lo pide. El contraste de cada rol de tinta se mide, no se afirma.',
  },
  {
    icon: 'package',
    tone: 'purple',
    title: 'Ejes ortogonales',
    body: 'Variante, tamaño y tono son independientes. Ninguna variante trae su propio relleno, que es lo que permite que un botón, un campo y un select se alineen en una barra.',
  },
  {
    icon: 'code',
    tone: 'orange',
    title: 'Fronteras que fallan solas',
    body: 'core, shared, layout y features tienen una regla de dependencia que ESLint hace cumplir. No es un acuerdo verbal: importar de más rompe el lint.',
  },
];

/**
 * La portada del catálogo: qué es este sistema y por dónde se entra.
 *
 * Sustituye al andamiaje «En construcción» que ocupaba `/inicio` desde la fase
 * 4. Es la única página que habla del sistema como un todo — el resto
 * documenta una familia cada una — así que su trabajo es responder tres cosas
 * en el primer vistazo: de qué tamaño es, cómo está organizado, y bajo qué
 * reglas.
 *
 * ## Las cifras se comprueban
 *
 * Los conteos por familia están escritos en `FAMILIES` y `scripts/audit-home.mjs`
 * los compara contra las carpetas de `shared/components`. Es el mismo
 * razonamiento que hace que Fundamentos lea los tokens del documento en vez de
 * repetirlos: una segunda copia que nadie compara es una copia que se
 * desalinea, y aquí la comparación la hace el audit en cada `npm run audit`.
 */
@Component({
  selector: 'app-home',
  imports: [Badge, Icon, PageHeader, RouterLink, SectionCard, StatCard],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  protected readonly families = FAMILIES;
  protected readonly templates = TEMPLATES;
  protected readonly principles = PRINCIPLES;

  /** El total sale de la suma, no de un número escrito aparte. */
  protected readonly componentCount = FAMILIES.reduce((total, family) => total + family.count, 0);

  protected readonly familyCount = FAMILIES.length;
}
