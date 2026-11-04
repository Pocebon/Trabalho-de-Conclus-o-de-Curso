<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold">Motivos de Parada</div>
        <div class="text-grey-7 q-mt-xs">
          Cadastre e gerencie os motivos utilizados para justificar as paradas de produção.
        </div>
      </div>
      <q-btn color="primary" icon="add" label="Novo motivo" @click="abrirNovoMotivo" />
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
              placeholder="Buscar motivo..."
            >
              <template #prepend><q-icon name="search" /></template>
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

      <q-table
        flat
        :rows="motivos"
        :columns="colunas"
        row-key="id"
        :filter="filtro"
        :loading="loading"
        v-model:pagination="paginacao"
        no-data-label="Nenhum motivo cadastrado."
        no-results-label="Nenhum motivo encontrado."
        loading-label="Carregando motivos..."
        rows-per-page-label="Registros por página"
      >
        <template #body-cell-ativo="props">
          <q-td :props="props" class="text-center">
            <q-badge
              rounded
              :color="props.row.ativo ? 'positive' : 'grey-7'"
              :label="props.row.ativo ? 'Ativo' : 'Inativo'"
            />
          </q-td>
        </template>

        <template #body-cell-criado_em="props">
          <q-td :props="props">
            {{ formatarDataHora(props.row.criado_em) }}
          </q-td>
        </template>

        <template #body-cell-acoes="props">
          <q-td :props="props" class="text-center">
            <q-btn
              flat
              round
              dense
              color="primary"
              icon="edit"
              @click="abrirEdicao(props.row)"
            >
              <q-tooltip>Editar motivo</q-tooltip>
            </q-btn>

            <q-toggle
              :model-value="props.row.ativo"
              color="positive"
              class="q-ml-sm"
              :disable="alterandoStatusId === props.row.id"
              @update:model-value="alterarStatus(props.row, $event)"
            >
              <q-tooltip>
                {{ props.row.ativo ? 'Desativar motivo' : 'Ativar motivo' }}
              </q-tooltip>
            </q-toggle>
          </q-td>
        </template>

        <template #no-data>
          <div class="full-width row flex-center text-grey-6 q-gutter-sm q-pa-xl">
            <q-icon name="info" size="28px" />
            <span>Nenhum motivo encontrado.</span>
          </div>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogAberto" persistent>
      <q-card style="width: 500px; max-width: 90vw;">
        <q-card-section class="row items-center">
          <q-avatar
            :icon="modoEdicao ? 'edit' : 'add'"
            color="primary"
            text-color="white"
          />
          <div class="q-ml-md">
            <div class="text-h6">
              {{ modoEdicao ? 'Editar motivo' : 'Novo motivo' }}
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

        <q-form @submit.prevent="salvarMotivo">
          <q-card-section>
            <q-input
              v-model="formulario.descricao"
              outlined
              autofocus
              label="Descrição do motivo"
              maxlength="150"
              counter
              :disable="salvando"
              :rules="[
                valor => !!valor?.trim() || 'Informe a descrição do motivo.'
              ]"
            >
              <template #prepend><q-icon name="build" /></template>
            </q-input>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right" class="q-pa-md">
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
              :label="modoEdicao ? 'Salvar alterações' : 'Cadastrar'"
              :loading="salvando"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

const $q = useQuasar()

const motivos = ref([])
const filtro = ref('')
const loading = ref(false)
const salvando = ref(false)
const alterandoStatusId = ref(null)
const dialogAberto = ref(false)
const modoEdicao = ref(false)
const motivoSelecionadoId = ref(null)
const formulario = ref({ descricao: '' })

const paginacao = ref({
  sortBy: 'descricao',
  descending: false,
  page: 1,
  rowsPerPage: 10
})

const colunas = [
  { name: 'id', label: 'ID', field: 'id', align: 'left', sortable: true },
  { name: 'descricao', label: 'Descrição', field: 'descricao', align: 'left', sortable: true },
  { name: 'ativo', label: 'Situação', field: 'ativo', align: 'center', sortable: true },
  { name: 'criado_em', label: 'Cadastrado em', field: 'criado_em', align: 'left', sortable: true },
  { name: 'acoes', label: 'Ações', field: 'acoes', align: 'center' }
]

function mensagemErro(error, padrao) {
  return error.response?.data?.message || error.message || padrao
}

async function buscarMotivos() {
  loading.value = true
  try {
    const { data: dados } = await api.get('/motivos/todos')
    if (!dados?.success) {
      throw new Error(dados?.message || 'Erro ao buscar motivos.')
    }
    motivos.value = Array.isArray(dados.data) ? dados.data : []
  } catch (error) {
    console.error('Erro ao buscar motivos:', error)
    motivos.value = []
    $q.notify({
      type: 'negative',
      message: mensagemErro(error, 'Não foi possível carregar os motivos.')
    })
  } finally {
    loading.value = false
  }
}

function abrirNovoMotivo() {
  modoEdicao.value = false
  motivoSelecionadoId.value = null
  formulario.value.descricao = ''
  dialogAberto.value = true
}

function abrirEdicao(motivo) {
  modoEdicao.value = true
  motivoSelecionadoId.value = motivo.id
  formulario.value.descricao = motivo.descricao
  dialogAberto.value = true
}

function fecharDialog() {
  if (salvando.value) return
  limparDialog()
}

function limparDialog() {
  dialogAberto.value = false
  formulario.value.descricao = ''
  motivoSelecionadoId.value = null
  modoEdicao.value = false
}

async function salvarMotivo() {
  const descricao = formulario.value.descricao.trim()
  if (!descricao || salvando.value) return

  salvando.value = true
  try {
    const { data: dados } = modoEdicao.value
      ? await api.put(`/motivos/${motivoSelecionadoId.value}`, { descricao })
      : await api.post('/motivos', { descricao })

    if (!dados?.success) {
      throw new Error(dados?.message || 'Não foi possível salvar o motivo.')
    }

    $q.notify({
      type: 'positive',
      message: dados.message || 'Motivo salvo com sucesso.'
    })

    limparDialog()
    await buscarMotivos()
  } catch (error) {
    console.error('Erro ao salvar motivo:', error)
    $q.notify({
      type: 'negative',
      message: mensagemErro(error, 'Erro ao salvar motivo.')
    })
  } finally {
    salvando.value = false
  }
}

async function alterarStatus(motivo, novoStatus) {
  if (alterandoStatusId.value !== null) return

  const statusAnterior = motivo.ativo
  alterandoStatusId.value = motivo.id
  motivo.ativo = novoStatus

  try {
    const { data: dados } = await api.patch(`/motivos/${motivo.id}/status`, {
      ativo: novoStatus
    })

    if (!dados?.success) {
      throw new Error(dados?.message || 'Não foi possível alterar o status.')
    }

    $q.notify({
      type: 'positive',
      message: dados.message || 'Status atualizado com sucesso.'
    })
  } catch (error) {
    motivo.ativo = statusAnterior
    console.error('Erro ao alterar status:', error)
    $q.notify({
      type: 'negative',
      message: mensagemErro(error, 'Erro ao alterar o status.')
    })
  } finally {
    alterandoStatusId.value = null
  }
}

function formatarDataHora(valor) {
  if (!valor) return '-'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return '-'

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(data)
}

onMounted(buscarMotivos)
</script>

<style scoped>
.q-table tbody td {
  height: 58px;
}
</style>