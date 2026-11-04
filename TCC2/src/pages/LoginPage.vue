
<template>
  <q-page class="login-page flex flex-center">
    <q-card class="login-card">
      <q-card-section class="text-center q-pb-none">
        <q-icon
          name="precision_manufacturing"
          size="64px"
          color="primary"
        />

        <div class="text-h6 q-mt-sm">
          Sistema de Monitoramento
        </div>

        <div class="text-caption text-grey">
          Paradas de Máquinas
        </div>
      </q-card-section>

      <q-card-section>
        <q-form
          @submit="onLogin"
          class="q-gutter-md"
        >
          <q-input
            v-model="email"
            label="E-mail"
            type="email"
            outlined
            dark
            color="primary"
            autocomplete="username"
            :rules="[
              val => !!val || 'Informe o e-mail'
            ]"
          >
            <template #prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="senha"
            label="Senha"
            :type="mostrarSenha ? 'text' : 'password'"
            outlined
            dark
            color="primary"
            autocomplete="current-password"
            :rules="[
              val => !!val || 'Informe a senha'
            ]"
          >
            <template #prepend>
              <q-icon name="lock" />
            </template>

            <template #append>
              <q-icon
                :name="mostrarSenha ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="mostrarSenha = !mostrarSenha"
              />
            </template>
          </q-input>

          <q-btn
            type="submit"
            label="Entrar"
            color="primary"
            class="full-width"
            size="lg"
            :loading="carregando"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

const router = useRouter()
const $q = useQuasar()

const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const carregando = ref(false)

// Autenticação pela API centralizada no axios.js
async function autenticarNaAPI(credenciais) {
  try {
    const { data } = await api.post('/auth/login', credenciais)

    if (!data?.success) {
      throw new Error(
        data?.message || 'E-mail ou senha inválidos.'
      )
    }

    return data
  } catch (error) {
    if (error.response) {
      throw new Error(
        error.response.data?.message ||
        'E-mail ou senha inválidos.'
      )
    }

    if (error.code === 'ECONNABORTED') {
      throw new Error(
        'A conexão demorou muito. Tente novamente.'
      )
    }

    if (error.code === 'ERR_NETWORK') {
      throw new Error(
        'Não foi possível conectar ao servidor. Verifique sua internet.'
      )
    }

    throw error
  }
}

async function onLogin() {
  if (carregando.value) return

  carregando.value = true

  try {
    const credenciais = {
      email: email.value.trim(),
      senha: senha.value
    }

    let response

    // Mantém a integração com o aplicativo Electron.
    if (window.electronAPI?.loginUser) {
      response = await window.electronAPI.loginUser(credenciais)
    } else {
      response = await autenticarNaAPI(credenciais)
    }

    if (!response?.success || !response.user) {
      throw new Error(
        response?.message || 'E-mail ou senha inválidos.'
      )
    }

    // Mantém a recuperação do JWT utilizada no projeto.
    let token = response.token

    if (!token) {
      const autenticacao = await autenticarNaAPI(credenciais)
      token = autenticacao.token
    }

    if (!token) {
      throw new Error(
        'Não foi possível obter o token de autenticação.'
      )
    }

    if (!['gestor', 'operador'].includes(response.user.perfil)) {
      throw new Error('Perfil de usuário inválido.')
    }

    sessionStorage.setItem(
      'usuario',
      JSON.stringify(response.user)
    )

    sessionStorage.setItem('token', token)

    $q.notify({
      type: 'positive',
      message: `Bem-vindo, ${response.user.nome}!`
    })

    if (response.user.perfil === 'gestor') {
      await router.push('/dashboard')
    } else {
      await router.push('/operador')
    }
  } catch (error) {
    console.error('Erro no login:', error)

    $q.notify({
      type: 'negative',
      message: error.message || 'Erro ao realizar login.'
    })
  } finally {
    carregando.value = false
  }
}
</script>

<style scoped>
.login-page {
  background-color: #1a1a2e;
  min-height: 100vh;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background-color: #16213e;
  border-radius: 12px;
  padding: 1rem;
}
</style>