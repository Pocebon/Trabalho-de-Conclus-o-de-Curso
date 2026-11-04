
<template>
  <q-page class="q-pa-lg">
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold">
          Histórico de Paradas
        </div>

        <div class="text-grey-7 q-mt-xs">
          Consulte as paradas registradas pela máquina.
        </div>
      </div>

      <q-btn
        color="primary"
        icon="refresh"
        label="Atualizar"
        :loading="loading"
        @click="buscarParadas"
      />
    </div>

    <!-- CARDS -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="full-height">
          <q-card-section>
            <div class="text-grey-7">
              Total de paradas
            </div>

            <div class="text-h4 text-weight-bold q-mt-sm">
              {{ paradas.length }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="full-height">
          <q-card-section>
            <div class="text-grey-7">
              Justificadas
            </div>

            <div class="text-h4 text-weight-bold text-positive q-mt-sm">
              {{ totalJustificadas }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="full-height">
          <q-card-section>
            <div class="text-grey-7">
              Não justificadas
            </div>

            <div class="text-h4 text-weight-bold text-negative q-mt-sm">
              {{ totalNaoJustificadas }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="full-height">
          <q-card-section>
            <div class="text-grey-7">
              Tempo total parado
            </div>

            <div class="text-h4 text-weight-bold q-mt-sm">
              {{ tempoTotalFormatado }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-card flat bordered>
      <q-table
        title="Paradas registradas"
        :rows="paradas"
        :columns="columns"
        row-key="id"
        :loading="loading"
        :filter="filtro"
        :pagination="pagination"
        no-data-label="Nenhuma parada encontrada."
        no-results-label="Nenhuma parada encontrada para a pesquisa."
      >
        <template #top-right>
          <q-input
            v-model="filtro"
            dense
            outlined
            debounce="300"
            placeholder="Pesquisar"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
        </template>

        <template #body-cell-situacao="props">
          <q-td :props="props">
            <q-badge
              v-if="props.row.justificada"
              color="positive"
              label="Justificada"
            />

            <q-badge
              v-else
              color="negative"
              label="Não justificada"
            />
          </q-td>
        </template>

        <!-- MOTIVO -->
        <template #body-cell-motivo="props">
          <q-td :props="props">
            <span v-if="props.row.motivo">
              {{ props.row.motivo.descricao }}
            </span>

            <span v-else class="text-grey-6">
              Não informado
            </span>
          </q-td>
        </template>
      </q-table>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

const $q = useQuasar()

const paradas = ref([])
const loading = ref(false)
const filtro = ref('')

const pagination = ref({
  sortBy: 'id',
  descending: true,
  page: 1,
  rowsPerPage: 10
})


const columns = [
  {
    name: 'id',
    label: 'ID',
    field: 'id',
    align: 'left',
    sortable: true
  },
  {
    name: 'data',
    label: 'Data',
    field: row => formatarData(row.inicio),
    align: 'left',
    sortable: true
  },
  {
    name: 'inicio',
    label: 'Início',
    field: row => formatarHora(row.inicio),
    align: 'left'
  },
  {
    name: 'fim',
    label: 'Fim',
    field: row => formatarHora(row.fim),
    align: 'left'
  },
  {
    name: 'duracao',
    label: 'Duração',
    field: row => formatarDuracao(row.duracaoSegundos),
    align: 'left'
  },
  {
    name: 'operador',
    label: 'Operador',
    field: row => row.operador?.nome || '-',
    align: 'left'
  },
  {
    name: 'motivo',
    label: 'Motivo',
    field: row => row.motivo?.descricao || '',
    align: 'left'
  },
  {
    name: 'situacao',
    label: 'Situação',
    field: 'justificada',
    align: 'center'
  }
]


const totalJustificadas = computed(() => {
  return paradas.value.filter(
    parada => parada.justificada
  ).length
})

const totalNaoJustificadas = computed(() => {
  return paradas.value.filter(
    parada => !parada.justificada
  ).length
})

const tempoTotalSegundos = computed(() => {
  return paradas.value.reduce((total, parada) => {
    return total + Number(parada.duracaoSegundos || 0)
  }, 0)
})

const tempoTotalFormatado = computed(() => {
  return formatarDuracao(tempoTotalSegundos.value)
})

async function buscarParadas () {
  loading.value = true

  try {
    const { data: result } = await api.get('/paradas')

    if (!result?.success) {
      throw new Error(
        result?.message || 'Erro ao consultar paradas.'
      )
    }

    paradas.value = result.data || []
  } catch (error) {
    console.error('Erro ao carregar histórico:', error)

    paradas.value = []

    $q.notify({
      type: 'negative',
      message: error.response?.data?.message ||
        'Não foi possível carregar o histórico de paradas.'
    })
  } finally {
    loading.value = false
  }
}

function formatarData (valor) {
  if (!valor) return '-'

  const data = new Date(valor)

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(data)
}

function formatarHora (valor) {
  if (!valor) return '-'

  const data = new Date(valor)

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(data)
}

function formatarDuracao (segundos) {
  if (segundos === null || segundos === undefined) {
    return '-'
  }

  const total = Number(segundos)

  const horas = Math.floor(total / 3600)
  const minutos = Math.floor((total % 3600) / 60)
  const segundosRestantes = total % 60

  if (horas > 0) {
    return `${horas}h ${minutos}min ${segundosRestantes}s`
  }

  if (minutos > 0) {
    return `${minutos}min ${segundosRestantes}s`
  }

  return `${segundosRestantes}s`
}

onMounted(() => {
  buscarParadas()
})
</script>