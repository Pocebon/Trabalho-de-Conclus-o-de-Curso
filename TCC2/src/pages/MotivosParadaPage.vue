<template>
  <q-page class="q-pa-lg">

    <!-- ==================================================
         CABEÇALHO
    =================================================== -->

    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold">
          Motivos de Parada
        </div>

        <div class="text-grey-7 q-mt-xs">
          Cadastre e gerencie os motivos utilizados para
          justificar as paradas de produção.
        </div>
      </div>

      <q-btn
        color="primary"
        icon="add"
        label="Novo motivo"
        @click="abrirNovoMotivo"
      />
    </div>

    <!-- ==================================================
         CARD PRINCIPAL
    =================================================== -->

    <q-card flat bordered>

      <!-- BUSCA E ATUALIZAÇÃO -->

      <q-card-section>
        <div class="row q-col-gutter-md items-center">

          <div class="col-12 col-md-8">
            <q-input
              v-model="filtro"
              outlined
              dense
              clearable
              debounce="300"
              placeholder="Buscar motivo..."
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
              :loading="loading"
              @click="buscarMotivos"
            />
          </div>

        </div>
      </q-card-section>

      <q-separator />

      <!-- ==================================================
           TABELA
      =================================================== -->

      <q-table
        flat
        :rows="motivos"
        :columns="colunas"
        row-key="id"
        :filter="filtro"
        :loading="loading"
        :pagination="paginacao"
        no-data-label="Nenhum motivo cadastrado."
        no-results-label="Nenhum motivo encontrado."
        loading-label="Carregando motivos..."
        rows-per-page-label="Registros por página"
      >

        <!-- SITUAÇÃO -->

        <template #body-cell-ativo="props">
          <q-td
            :props="props"
            class="text-center"
          >
            <q-badge
              rounded
              :color="props.row.ativo ? 'positive' : 'grey-7'"
              :label="props.row.ativo ? 'Ativo' : 'Inativo'"
            />
          </q-td>
        </template>

        <!-- DATA DE CADASTRO -->

        <template #body-cell-criado_em="props">
          <q-td :props="props">
            {{ formatarDataHora(props.row.criado_em) }}
          </q-td>
        </template>

        <!-- AÇÕES -->

        <template #body-cell-acoes="props">
          <q-td
            :props="props"
            class="text-center"
          >

            <!-- EDITAR -->

            <q-btn
              flat
              round
              dense
              color="primary"
              icon="edit"
              @click="abrirEdicao(props.row)"
            >
              <q-tooltip>
                Editar motivo
              </q-tooltip>
            </q-btn>

            <!-- ATIVAR / DESATIVAR -->

            <q-toggle
              :model-value="props.row.ativo"
              color="positive"
              class="q-ml-sm"
              @update:model-value="
                alterarStatus(
                  props.row,
                  $event
                )
              "
            >
              <q-tooltip>
                {{
                  props.row.ativo
                    ? 'Desativar motivo'
                    : 'Ativar motivo'
                }}
              </q-tooltip>
            </q-toggle>

          </q-td>
        </template>

        <!-- QUANDO NÃO EXISTEM DADOS -->

        <template #no-data>
          <div
            class="full-width row flex-center
                   text-grey-6 q-gutter-sm q-pa-xl"
          >
            <q-icon
              name="info"
              size="28px"
            />

            <span>
              Nenhum motivo encontrado.
            </span>
          </div>
        </template>

      </q-table>

    </q-card>

    <!-- ==================================================
         DIALOG CADASTRO / EDIÇÃO
    =================================================== -->

    <q-dialog
      v-model="dialogAberto"
      persistent
    >

      <q-card style="width: 500px; max-width: 90vw;">

        <!-- TÍTULO -->

        <q-card-section class="row items-center">

          <q-avatar
            :icon="modoEdicao ? 'edit' : 'add'"
            color="primary"
            text-color="white"
          />

          <div class="q-ml-md">
            <div class="text-h6">
              {{
                modoEdicao
                  ? 'Editar motivo'
                  : 'Novo motivo'
              }}
            </div>

            <div class="text-caption text-grey-7">
              {{
                modoEdicao
                  ? 'Altere a descrição do motivo de parada.'
                  : 'Informe o novo motivo de parada.'
              }}
            </div>
          </div>

        </q-card-section>

        <q-separator />

        <!-- FORMULÁRIO -->

        <q-form @submit="salvarMotivo">

          <q-card-section>

            <q-input
              ref="descricaoInput"
              v-model="formulario.descricao"
              outlined
              autofocus
              label="Descrição do motivo"
              maxlength="150"
              counter
              :disable="salvando"
              :rules="[
                valor =>
                  !!valor?.trim() ||
                  'Informe a descrição do motivo.'
              ]"
            >
              <template #prepend>
                <q-icon name="build" />
              </template>
            </q-input>

          </q-card-section>

          <q-separator />

          <!-- BOTÕES -->

          <q-card-actions
            align="right"
            class="q-pa-md"
          >

            <q-btn
              flat
              label="Cancelar"
              color="grey-7"
              :disable="salvando"
              @click="fecharDialog"
            />

            <q-btn
              unelevated
              type="submit"
              color="primary"
              icon="save"
              :label="
                modoEdicao
                  ? 'Salvar alterações'
                  : 'Cadastrar'
              "
              :loading="salvando"
            />

          </q-card-actions>

        </q-form>

      </q-card>

    </q-dialog>

  </q-page>
</template>

<script setup>
import {
  onMounted,
  ref
} from 'vue'

import {
  useQuasar
} from 'quasar'

const $q = useQuasar()

const API_URL =
  'http://localhost:3000/api'

// ==================================================
// ESTADO
// ==================================================

const motivos = ref([])

const filtro = ref('')

const loading = ref(false)

const salvando = ref(false)

const dialogAberto = ref(false)

const modoEdicao = ref(false)

const motivoSelecionadoId = ref(null)

const descricaoInput = ref(null)

const formulario = ref({
  descricao: ''
})

// ==================================================
// PAGINAÇÃO
// ==================================================

const paginacao = ref({
  sortBy: 'descricao',
  descending: false,
  page: 1,
  rowsPerPage: 10
})

// ==================================================
// COLUNAS
// ==================================================

const colunas = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'left',
    sortable: true
  },

  {
    name: 'descricao',
    label: 'Descrição',
    field: 'descricao',
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
    label: 'Cadastrado em',
    field: 'criado_em',
    align: 'left',
    sortable: true
  },

  {
    name: 'acoes',
    label: 'Ações',
    field: 'acoes',
    align: 'center'
  }
]

// ==================================================
// BUSCAR TODOS OS MOTIVOS
// ==================================================

async function buscarMotivos () {

  loading.value = true

  try {

    const resposta = await fetch(
      `${API_URL}/motivos/todos`
    )

    const dados =
      await resposta.json()

    if (
      !resposta.ok ||
      !dados.success
    ) {
      throw new Error(
        dados.message ||
        'Erro ao buscar motivos.'
      )
    }

    motivos.value =
      dados.data || []

  } catch (error) {

    console.error(
      'Erro ao buscar motivos:',
      error
    )

    $q.notify({
      type: 'negative',
      message:
        'Não foi possível carregar os motivos.'
    })

  } finally {

    loading.value = false
  }
}

// ==================================================
// ABRIR NOVO MOTIVO
// ==================================================

function abrirNovoMotivo () {

  modoEdicao.value = false

  motivoSelecionadoId.value =
    null

  formulario.value.descricao =
    ''

  dialogAberto.value = true
}

// ==================================================
// ABRIR EDIÇÃO
// ==================================================

function abrirEdicao (motivo) {

  modoEdicao.value = true

  motivoSelecionadoId.value =
    motivo.id

  formulario.value.descricao =
    motivo.descricao

  dialogAberto.value = true
}

// ==================================================
// FECHAR DIALOG
// ==================================================

function fecharDialog () {

  if (salvando.value) {
    return
  }

  dialogAberto.value = false

  formulario.value.descricao =
    ''

  motivoSelecionadoId.value =
    null

  modoEdicao.value = false
}

// ==================================================
// SALVAR
// ==================================================

async function salvarMotivo () {

  const descricao =
    formulario.value.descricao.trim()

  if (!descricao) {
    return
  }

  salvando.value = true

  try {

    let resposta

    // ----------------------------------------------
    // EDIÇÃO
    // ----------------------------------------------

    if (modoEdicao.value) {

      resposta = await fetch(
        `${API_URL}/motivos/${motivoSelecionadoId.value}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            descricao
          })
        }
      )

    // ----------------------------------------------
    // CADASTRO
    // ----------------------------------------------

    } else {

      resposta = await fetch(
        `${API_URL}/motivos`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            descricao
          })
        }
      )
    }

    const dados =
      await resposta.json()

    if (
      !resposta.ok ||
      !dados.success
    ) {
      throw new Error(
        dados.message ||
        'Não foi possível salvar o motivo.'
      )
    }

    $q.notify({
      type: 'positive',
      message:
        dados.message ||
        'Motivo salvo com sucesso.'
    })

    fecharDialog()

    await buscarMotivos()

  } catch (error) {

    console.error(
      'Erro ao salvar motivo:',
      error
    )

    $q.notify({
      type: 'negative',
      message:
        error.message ||
        'Erro ao salvar motivo.'
    })

  } finally {

    salvando.value = false
  }
}

// ==================================================
// ALTERAR STATUS
// ==================================================

async function alterarStatus (
  motivo,
  novoStatus
) {

  const statusAnterior =
    motivo.ativo

  try {

    // Atualização visual imediata
    motivo.ativo = novoStatus

    const resposta =
      await fetch(
        `${API_URL}/motivos/${motivo.id}/status`,
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            ativo: novoStatus
          })
        }
      )

    const dados =
      await resposta.json()

    if (
      !resposta.ok ||
      !dados.success
    ) {
      throw new Error(
        dados.message ||
        'Não foi possível alterar o status.'
      )
    }

    $q.notify({
      type: 'positive',
      message:
        dados.message ||
        'Status atualizado com sucesso.'
    })

  } catch (error) {

    // Se der erro, volta o toggle
    motivo.ativo =
      statusAnterior

    console.error(
      'Erro ao alterar status:',
      error
    )

    $q.notify({
      type: 'negative',
      message:
        error.message ||
        'Erro ao alterar o status.'
    })
  }
}

// ==================================================
// DATA
// ==================================================

function formatarDataHora (valor) {

  if (!valor) {
    return '-'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone:
        'America/Sao_Paulo',

      day: '2-digit',
      month: '2-digit',
      year: 'numeric',

      hour: '2-digit',
      minute: '2-digit',

      hour12: false
    }
  ).format(
    new Date(valor)
  )
}

// ==================================================
// INICIALIZAÇÃO
// ==================================================

onMounted(() => {
  buscarMotivos()
})
</script>

<style scoped>
.q-table tbody td {
  height: 58px;
}
</style>