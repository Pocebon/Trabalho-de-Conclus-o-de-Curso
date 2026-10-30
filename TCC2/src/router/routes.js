
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),

    children: [
      {
        path: '',
        name: 'login',
        component: () => import('pages/LoginPage.vue'),
        meta: { public: true }
      },

      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('pages/IndexPage.vue'),
        meta: {
          requiresAuth: true,
          perfil: 'gestor'
        }
      },

      {
        path: 'historico',
        name: 'historico',
        component: () => import('pages/HistoricoParadasPage.vue'),
        meta: {
          requiresAuth: true,
          perfil: 'gestor'
        }
      },

      {
        path: 'motivos',
        name: 'motivos',
        component: () => import('pages/MotivosParadaPage.vue'),
        meta: {
          requiresAuth: true,
          perfil: 'gestor'
        }
      },

      {
        path: 'gestor/operadores',
        name: 'gerenciar-operadores',
        component: () => import('pages/OperadoresPage.vue'),
        meta: {
          requiresAuth: true,
          perfil: 'gestor'
        }
      },

      {
        path: 'operador',
        name: 'operador',
        component: () => import('pages/OperadorPage.vue'),
        meta: {
          requiresAuth: true,
          perfil: 'operador'
        }
      }
    ]
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
