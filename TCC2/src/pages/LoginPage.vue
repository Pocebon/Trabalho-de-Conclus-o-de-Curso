<template>
  <q-page class="login-page flex flex-center">
    <q-card class="login-card">
      <q-card-section class="text-center q-pb-none">
        <q-icon name="precision_manufacturing" size="64px" color="primary" />
        <div class="text-h6 q-mt-sm">Sistema de Monitoramento</div>
        <div class="text-caption text-grey">Paradas de Máquinas</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onLogin" class="q-gutter-md">
          <q-input
            v-model="email"
            label="E-mail"
            type="email"
            outlined
            dark
            color="primary"
            :rules="[val => !!val || 'Informe o e-mail']"
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
            :rules="[val => !!val || 'Informe a senha']"
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

const router = useRouter()
const email = ref('')
const senha = ref('')
const mostrarSenha = ref(false)
const carregando = ref(false)

async function onLogin () {
  carregando.value = true
  // autenticação será implementada aqui
  setTimeout(() => {
    carregando.value = false
    router.push('/dashboard')
  }, 1000)
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