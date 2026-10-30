
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

const router = useRouter()
const $q = useQuasar()

const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const carregando = ref(false)

const API_URL = 'http://localhost:3000/api'

async function autenticarNaAPI(credenciais) {
  const resposta = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credenciais)
  })

  const resultado = await resposta.json()

  if (!resposta.ok || !resultado.success) {
    throw new Error(
      resultado.message || 'E-mail ou senha inválidos.'
    )
  }

  return resultado
}

async function onLogin() {
  carregando.value = true

  try {
    const credenciais = {
      email: email.value.trim(),
      senha: senha.value
    }

    let response

    // Preserva a integração com o Electron.
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

    // Obtém o JWT caso a ponte Electron ainda não o retorne.
    let token = response.token

    if (!token) {
      const autenticacao = await autenticarNaAPI(credenciais)
      token = autenticacao.token
    }

    if (!token) {
      throw new Error('Não foi possível obter o token de autenticação.')
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
