
import { defineRouter } from '#q-app/wrappers'

import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory
} from 'vue-router'

import routes from './routes'

export default defineRouter(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  Router.beforeEach((to) => {
    const usuarioSalvo = sessionStorage.getItem('usuario')
    const token = sessionStorage.getItem('token')

    let usuario = null

    if (usuarioSalvo) {
      try {
        usuario = JSON.parse(usuarioSalvo)
      } catch (error) {
        console.error('Sessão inválida:', error)

        sessionStorage.removeItem('usuario')
        sessionStorage.removeItem('token')
      }
    }

    if (to.meta.public) {
      if (usuario && token) {
        if (usuario.perfil === 'gestor') {
          return '/dashboard'
        }

        if (usuario.perfil === 'operador') {
          return '/operador'
        }
      }

      return true
    }

    if (to.meta.requiresAuth && (!usuario || !token)) {
      return '/'
    }

    if (to.meta.perfil && usuario?.perfil !== to.meta.perfil) {
      if (usuario?.perfil === 'operador') {
        return '/operador'
      }

      if (usuario?.perfil === 'gestor') {
        return '/dashboard'
      }

      return '/'
    }

    return true
  })

  return Router
})