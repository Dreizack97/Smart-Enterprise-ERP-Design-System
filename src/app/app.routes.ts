import { Routes } from '@angular/router';
import { CenteredLayout } from '@layout/layouts/centered-layout/centered-layout';
import { MainLayout } from '@layout/layouts/main-layout/main-layout';

/**
 * Las rutas del catálogo.
 *
 * Dos marcos, uno junto al otro y no anidados: `main-layout` para todo lo
 * que lleva navegación, `centered-layout` para las pantallas que están
 * solas. Una pantalla sin menú no es una pantalla dentro del menú, así que
 * tampoco es hija de él.
 *
 * Todo es perezoso. Los marcos no: uno de los dos carga en cada navegación,
 * así que diferirlos solo agregaría una vuelta de red antes del primer
 * pintado.
 *
 * Las rutas están en español porque la URL es interfaz de usuario. Los ids
 * de ruta, los nombres de componente y los archivos se quedan en inglés,
 * igual que el resto del código.
 */
export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio · Sistema de Diseño',
        loadComponent: () => import('@features/showcase/pages/home/home').then((m) => m.Home),
      },
      {
        path: 'fundamentos',
        title: 'Fundamentos · Sistema de Diseño',
        loadComponent: () =>
          import('@features/showcase/pages/foundations/foundations').then((m) => m.Foundations),
      },
      {
        path: 'datos',
        title: 'Datos · Sistema de Diseño',
        loadComponent: () => import('@features/showcase/pages/data/data').then((m) => m.Data),
      },
      {
        path: 'superposiciones',
        title: 'Superposiciones · Sistema de Diseño',
        loadComponent: () =>
          import('@features/showcase/pages/overlays/overlays').then((m) => m.Overlays),
      },
      {
        path: 'acciones',
        title: 'Acciones · Sistema de Diseño',
        loadComponent: () =>
          import('@features/showcase/pages/actions/actions').then((m) => m.Actions),
      },
      {
        path: 'formularios',
        title: 'Formularios · Sistema de Diseño',
        loadComponent: () => import('@features/showcase/pages/forms/forms').then((m) => m.Forms),
      },
      {
        path: 'retroalimentacion',
        title: 'Retroalimentación · Sistema de Diseño',
        loadComponent: () =>
          import('@features/showcase/pages/feedback/feedback').then((m) => m.Feedback),
      },
      {
        path: 'navegacion',
        title: 'Navegación · Sistema de Diseño',
        loadComponent: () =>
          import('@features/showcase/pages/navigation/navigation').then((m) => m.Navigation),
      },
      {
        path: 'contenedores',
        title: 'Contenedores y multimedia · Sistema de Diseño',
        loadComponent: () =>
          import('@features/showcase/pages/containers/containers').then((m) => m.Containers),
      },
      {
        path: 'shell',
        title: 'Shell · Sistema de Diseño',
        loadComponent: () => import('@features/showcase/pages/shell/shell').then((m) => m.Shell),
      },
      {
        path: 'panel',
        title: 'Panel · Sistema de Diseño',
        loadComponent: () =>
          import('@features/showcase/pages/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'clientes',
        title: 'Listado · Sistema de Diseño',
        loadComponent: () =>
          import('@features/showcase/pages/clients/clients').then((m) => m.Clients),
      },
      {
        path: 'perfil',
        title: 'Perfil · Sistema de Diseño',
        loadComponent: () =>
          import('@features/showcase/pages/profile/profile').then((m) => m.Profile),
      },
      {
        path: 'patrones',
        title: 'Patrones · Sistema de Diseño',
        loadComponent: () =>
          import('@features/showcase/pages/patterns/patterns').then((m) => m.Patterns),
      },
    ],
  },
  {
    path: 'acceso',
    component: CenteredLayout,
    children: [
      {
        path: '',
        title: 'Acceso · Sistema de Diseño',
        loadComponent: () => import('@features/showcase/pages/access/access').then((m) => m.Access),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
