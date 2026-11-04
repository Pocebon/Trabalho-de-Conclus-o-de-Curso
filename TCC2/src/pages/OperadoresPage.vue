
<template>
  <q-page class="q-pa-md q-pa-lg-lg">
    <div class="row items-center justify-between q-mb-lg q-col-gutter-md">
      <div class="col-12 col-sm">
        <div class="text-h4 text-weight-bold">
          Gerenciamento de Operadores
        </div>
        <div class="text-grey-7 q-mt-xs">
          Cadastre e gerencie os operadores da máquina de corte.
        </div>
      </div>

      <div class="col-12 col-sm-auto">
        <q-btn
          color="primary"
          icon="person_add"
          label="Novo operador"
          @click="abrirCadastro"
        />
      </div>
    </div>

    <q-card flat bordered>
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-12 col-md-8">
            <q-input
              v-model="filtro"
              outlined
              dense
              clearable
              debounce="300"
              placeholder="Buscar operador por nome ou e-mail..."
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-12 col-md-4 text-right">
            <q-btn
              flat
              color="primary"
              icon="refresh"
              label="Atualizar"
              :loading="carregando"
              @click="buscarOperadores"
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-table
        flat
        :rows="operadores"
        :columns="colunas"
        row-key="id"
        :filter="filtro"
        :loading="carregando"
        :pagination="{ rowsPerPage: 10 }"
        no-data-label="Nenhum operador cadastrado."
        no-results-label="Nenhum operador encontrado."
        loading-label="Carregando operadores..."
        rows-per-page-label="Registros por página"
      >
        <template #body-cell-ativo="props">
          <q-td :props="props">
            <q-badge
              :color="props.row.ativo ? 'positive' : 'grey-7'"
              :label="props.row.ativo ? 'Ativo' : 'Inativo'"
            />
          </q-td>
        </template>

        <template #body-cell-criado_em="props">
          <q-td :props="props">
            {{ formatarData(props.row.criado_em) }}
          </q-td>
        </template>

        <template #body-cell-acoes="props">
          <q-td :props="props">
            <div class="row no-wrap justify-center q-gutter-xs">
              <q-btn
                flat
                round
                dense
                color="primary"
                icon="edit"
                @click="abrirEdicao(props.row)"
              >
                <q-tooltip>Editar operador</q-tooltip>
              </q-btn>

              <q-btn
                flat
                round
                dense
                color="secondary"
                icon="lock_reset"
                @click="abrirRedefinicao(props.row)"
              >
                <q-tooltip>Redefinir senha</q-tooltip>
              </q-btn>

              <q-btn
                flat
                round
                dense
                :color="props.row.ativo ? 'negative' : 'positive'"
                :icon="props.row.ativo ? 'person_off' : 'person'"
                @click="confirmarStatus(props.row)"
              >
                <q-tooltip>
                  {{ props.row.ativo ? 'Inativar' : 'Ativar' }}
                </q-tooltip>
              </q-btn>
            </div>
          </q-td>
        </template>
      </q-table>
    </q-card>

    <!-- CADASTRO E EDIÇÃO -->
    <q-dialog v-model="dialogFormulario" persistent>
      <q-card style="width: 500px; max-width: 95vw">
        <q-card-section class="row items-center">
          <div class="text-h6">
            {{ editando ? 'Editar operador' : 'Novo operador' }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-form @submit="salvarOperador">
          <q-card-section class="q-gutter-md">
            <q-input
              v-model.trim="formulario.nome"
              outlined
              label="Nome completo"
              maxlength="100"
              :rules="[v => !!v || 'Informe o nome']"
            />

            <q-input
              v-model.trim="formulario.email"
              outlined
              type="email"
              label="E-mail"
              maxlength="100"
              :rules="[
                v => !!v || 'Informe o e-mail',
                v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
                  || 'Informe um e-mail válido'
              ]"
            />

            <q-input
              v-if="!editando"
              v-model="formulario.senha"
              outlined
              :type="mostrarSenha ? 'text' : 'password'"
              label="Senha inicial"
              :rules="[
                v => (v && v.length >= 8 && v.length <= 72)
                  || 'A senha deve ter entre 8 e 72 caracteres'
              ]"
            >
              <template #append>
                <q-icon
                  :name="mostrarSenha ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="mostrarSenha = !mostrarSenha"
                />
              </template>
            </q-input>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn flat label="Cancelar" v-close-popup />
            <q-btn
              type="submit"
              color="primary"
              label="Salvar"
              :loading="salvando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>

    <!-- REDEFINIÇÃO DE SENHA -->
    <q-dialog v-model="dialogSenha" persistent>
      <q-card style="width: 440px; max-width: 95vw">
        <q-card-section class="row items-center">
          <div class="text-h6">Redefinir senha</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <div class="q-mb-md">
            Operador: <strong>{{ operadorSelecionado?.nome }}</strong>
          </div>

          <q-form @submit="redefinirSenha">
            <q-input
              v-model="novaSenha"
              outlined
              :type="mostrarSenha ? 'text' : 'password'"
              label="Nova senha"
              :rules="[
                v => (v && v.length >= 8 && v.length <= 72)
                  || 'A senha deve ter entre 8 e 72 caracteres'
              ]"
            >
              <template #append>
                <q-icon
                  :name="mostrarSenha ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="mostrarSenha = !mostrarSenha"
                />
              </template>
            </q-input>

            <q-card-actions align="right" class="q-pt-md">
              <q-btn flat label="Cancelar" v-close-popup />
              <q-btn
                type="submit"
                color="primary"
                label="Redefinir"
                :loading="salvando"
              />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

const $q = useQuasar()
const router = useRouter()

const API_URL = 'https://tcc-paradas-api.onrender.com/api'

const operadores = ref([])
const filtro = ref('')
const carregando = ref(false)
const salvando = ref(false)

const dialogFormulario = ref(false)
const dialogSenha = ref(false)
const editando = ref(false)
const mostrarSenha = ref(false)

const operadorSelecionado = ref(null)
const novaSenha = ref('')

const formulario = ref({
  nome: '',
  email: '',
  senha: ''
})

const colunas = [
  {
    name: 'nome',
    label: 'Nome',
    field: 'nome',
    align: 'left',
    sortable: true
  },
  {
    name: 'email',
    label: 'E-mail',
    field: 'email',
    align: 'left',
    sortable: true
  },
  {
    name: 'ativo',
    label: 'Situação',
    field: 'ativo',
    align: 'center',
    sortable: true
  },
  {
    name: 'criado_em',
    label: 'Cadastro',
    field: 'criado_em',
    align: 'left',
    sortable: true
  },
  {
    name: 'acoes',
    label: 'Ações',
    field: 'id',
    align: 'center'
  }
]

function formatarData(valor) {
  if (!valor) return '-'

  const data = new Date(valor)

  return Number.isNaN(data.getTime())
    ? '-'
    : data.toLocaleDateString('pt-BR')
}

function obterToken() {
  return sessionStorage.getItem('token')
}

async function requisicao(caminho, opcoes = {}) {
  const token = obterToken()

  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(opcoes.headers || {})
    }
  })

  const resultado = await resposta.json()

  if (resposta.status === 401) {
    sessionStorage.removeItem('usuario')
    sessionStorage.removeItem('token')
    await router.replace('/')
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  if (!resposta.ok || !resultado.success) {
    throw new Error(
      resultado.message || 'Não foi possível concluir a operação.'
    )
  }

  return resultado
}

function notificarErro(erro) {
  $q.notify({
    type: 'negative',
    message: erro.message || 'Ocorreu um erro inesperado.'
  })
}

async function buscarOperadores() {
  carregando.value = true

  try {
    const resultado = await requisicao('/operadores')
    operadores.value = resultado.data || []
  } catch (erro) {
    notificarErro(erro)
  } finally {
    carregando.value = false
  }
}

function abrirCadastro() {
  editando.value = false
  mostrarSenha.value = false
  operadorSelecionado.value = null

  formulario.value = {
    nome: '',
    email: '',
    senha: ''
  }

  dialogFormulario.value = true
}

function abrirEdicao(operador) {
  editando.value = true
  mostrarSenha.value = false
  operadorSelecionado.value = operador

  formulario.value = {
    nome: operador.nome,
    email: operador.email,
    senha: ''
  }

  dialogFormulario.value = true
}

async function salvarOperador() {
  salvando.value = true

  try {
    const caminho = editando.value
      ? `/operadores/${operadorSelecionado.value.id}`
      : '/operadores'

    const corpo = {
      nome: formulario.value.nome,
      email: formulario.value.email
    }

    if (!editando.value) {
      corpo.senha = formulario.value.senha
    }

    const resultado = await requisicao(caminho, {
      method: editando.value ? 'PUT' : 'POST',
      body: JSON.stringify(corpo)
    })

    $q.notify({
      type: 'positive',
      message: resultado.message
    })

    dialogFormulario.value = false
    await buscarOperadores()
  } catch (erro) {
    notificarErro(erro)
  } finally {
    salvando.value = false
  }
}

function confirmarStatus(operador) {
  const acao = operador.ativo ? 'inativar' : 'ativar'

  $q.dialog({
    title: operador.ativo ? 'Inativar operador' : 'Ativar operador',
    message: `Deseja realmente ${acao} ${operador.nome}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      const resultado = await requisicao(
        `/operadores/${operador.id}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            ativo: !operador.ativo
          })
        }
      )

      $q.notify({
        type: 'positive',
        message: resultado.message
      })

      await buscarOperadores()
    } catch (erro) {
      notificarErro(erro)
    }
  })
}

function abrirRedefinicao(operador) {
  operadorSelecionado.value = operador
  novaSenha.value = ''
  mostrarSenha.value = false
  dialogSenha.value = true
}

async function redefinirSenha() {
  salvando.value = true

  try {
    const resultado = await requisicao(
      `/operadores/${operadorSelecionado.value.id}/senha`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          senha: novaSenha.value
        })
      }
    )

    $q.notify({
      type: 'positive',
      message: resultado.message
    })

    dialogSenha.value = false
    novaSenha.value = ''
  } catch (erro) {
    notificarErro(erro)
  } finally {
    salvando.value = false
  }
}

onMounted(buscarOperadores)
</script>