
<template>
  <q-layout view="lHh Lpr lFf">
    <!-- CABEÇALHO -->
    <q-header elevated>
      <q-toolbar>
        <q-btn
          v-if="usuario"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Monitoramento de Paradas
        </q-toolbar-title>

        <div class="row items-center q-gutter-sm">
          <q-icon
            name="precision_manufacturing"
            size="24px"
          />

          <span class="gt-xs">
            Sistema de Monitoramento
          </span>
        </div>
      </q-toolbar>
    </q-header>

    <!-- MENU LATERAL -->
    <q-drawer
      v-if="usuario"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="270"
    >
      <div class="column full-height">
        <!-- USUÁRIO LOGADO -->
        <div class="q-pa-lg">
          <div class="row items-center no-wrap">
            <q-avatar
              color="primary"
              text-color="white"
              icon="person"
              size="48px"
            />

            <div class="q-ml-md usuario-info">
              <div class="text-weight-bold ellipsis">
                {{ usuario.nome }}
              </div>

              <div class="text-caption text-grey-7">
                {{ nomePerfil }}
              </div>
            </div>
          </div>
        </div>

        <q-separator />

        <!-- OPÇÕES DO MENU -->
        <q-list padding class="q-mt-sm">
          <q-item-label
            header
            class="text-uppercase text-grey-7"
          >
            Menu
          </q-item-label>

          <!-- MENU DO GESTOR -->
          <template v-if="usuario.perfil === 'gestor'">
            <q-item
              clickable
              v-ripple
              to="/dashboard"
              exact
            >
              <q-item-section avatar>
                <q-icon name="dashboard" />
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  Dashboard
                </q-item-label>

                <q-item-label caption>
                  Visão geral da produção
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              clickable
              v-ripple
              to="/historico"
            >
              <q-item-section avatar>
                <q-icon name="history" />
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  Histórico de Paradas
                </q-item-label>

                <q-item-label caption>
                  Consulte as ocorrências
                </q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              clickable
              v-ripple
              to="/motivos"
            >
              <q-item-section avatar>
                <q-icon name="build_circle" />
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  Motivos de Parada
                </q-item-label>

                <q-item-label caption>
                  Gerencie os motivos
                </q-item-label>
              </q-item-section>
            </q-item>

            <!-- NOVO: GERENCIAMENTO DE OPERADORES -->
            <q-item
              clickable
              v-ripple
              to="/gestor/operadores"
            >
              <q-item-section avatar>
                <q-icon name="groups" />
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  Operadores
                </q-item-label>

                <q-item-label caption>
                  Gerencie os operadores
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>

          <!-- MENU DO OPERADOR -->
          <template v-if="usuario.perfil === 'operador'">
            <q-item
              clickable
              v-ripple
              to="/operador"
              exact
            >
              <q-item-section avatar>
                <q-icon name="precision_manufacturing" />
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  Monitoramento
                </q-item-label>

                <q-item-label caption>
                  Acompanhe a máquina
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-list>

        <q-space />

        <q-separator />

        <!-- SAIR -->
        <q-list padding>
          <q-item
            clickable
            v-ripple
            @click="sair"
          >
            <q-item-section avatar>
              <q-icon
                name="logout"
                color="negative"
              />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-negative">
                Sair
              </q-item-label>

              <q-item-label caption>
                Encerrar sessão
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <!-- CONTEÚDO -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()

const leftDrawerOpen = ref(false)
const usuario = ref(null)

function carregarUsuario() {
  const usuarioSalvo = sessionStorage.getItem('usuario')

  if (!usuarioSalvo) {
    usuario.value = null
    return
  }

  try {
    usuario.value = JSON.parse(usuarioSalvo)
  } catch (error) {
    console.error('Erro ao recuperar usuário:', error)

    sessionStorage.removeItem('usuario')
    sessionStorage.removeItem('token')

    usuario.value = null
  }
}

carregarUsuario()

watch(
  () => route.fullPath,
  () => {
    carregarUsuario()
  }
)

const nomePerfil = computed(() => {
  if (usuario.value?.perfil === 'gestor') {
    return 'Gestor'
  }

  if (usuario.value?.perfil === 'operador') {
    return 'Operador'
  }

  return ''
})

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

async function sair() {
  try {
    if (window.electronAPI?.logoutUser) {
      await window.electronAPI.logoutUser()
    }

    sessionStorage.removeItem('usuario')
    sessionStorage.removeItem('token')

    usuario.value = null
    leftDrawerOpen.value = false

    $q.notify({
      type: 'positive',
      message: 'Sessão encerrada com sucesso.'
    })

    await router.push('/')
  } catch (error) {
    console.error('Erro ao realizar logout:', error)

    $q.notify({
      type: 'negative',
      message: 'Não foi possível encerrar a sessão.'
    })
  }
}
</script>

<style scoped>
.usuario-info {
  min-width: 0;
  flex: 1;
}
</style>
