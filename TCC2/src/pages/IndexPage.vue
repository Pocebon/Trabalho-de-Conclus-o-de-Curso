<template>
  <q-page class="q-pa-lg">

    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h4 text-weight-bold">
          Dashboard de Paradas
        </div>

        <div class="text-grey-7 q-mt-xs">
          Acompanhe os indicadores e analise as paradas
          registradas na produção.
        </div>
      </div>

      <q-btn
        color="primary"
        icon="refresh"
        label="Atualizar"
        :loading="loading"
        @click="buscarDados"
      />
    </div>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>

        <div class="row items-center q-mb-md">
          <q-icon
            name="filter_alt"
            size="24px"
            color="primary"
            class="q-mr-sm"
          />

          <div class="text-h6">
            Filtros
          </div>
        </div>

        <div class="row q-gutter-sm q-mb-md">
          <q-btn
            outline
            color="primary"
            label="Hoje"
            @click="selecionarHoje"
          />

          <q-btn
            outline
            color="primary"
            label="Últimos 7 dias"
            @click="selecionarUltimosDias(7)"
          />

          <q-btn
            outline
            color="primary"
            label="Últimos 30 dias"
            @click="selecionarUltimosDias(30)"
          />

          <q-btn
            flat
            color="grey-7"
            icon="restart_alt"
            label="Limpar"
            @click="limparFiltros"
          />
        </div>

        <div class="row q-col-gutter-md">

          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              v-model="filtros.dataInicial"
              outlined
              dense
              label="Data inicial"
              type="date"
              stack-label
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-input
              v-model="filtros.dataFinal"
              outlined
              dense
              label="Data final"
              type="date"
              stack-label
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="filtros.duracao"
              :options="opcoesDuracao"
              outlined
              dense
              emit-value
              map-options
              label="Duração"
            />
          </div>

          <div class="col-12 col-sm-6 col-md-3">
            <q-select
              v-model="filtros.motivo"
              :options="opcoesMotivos"
              outlined
              dense
              emit-value
              map-options
              label="Motivo"
            />
          </div>

        </div>

        <div class="q-mt-md text-caption text-grey-7">
          Exibindo
          <strong>{{ paradasFiltradas.length }}</strong>
          de
          <strong>{{ paradas.length }}</strong>
          paradas registradas.
        </div>

      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md q-mb-lg">

      <div class="col-12 col-sm-6 col-lg-4">
        <q-card flat bordered class="dashboard-card">
          <q-card-section>
            <div class="row items-center no-wrap">

              <q-avatar
                color="blue-1"
                text-color="primary"
                icon="precision_manufacturing"
                size="52px"
              />

              <div class="q-ml-md">
                <div class="text-grey-7">
                  Total de paradas
                </div>

                <div class="text-h4 text-weight-bold">
                  {{ totalParadas }}
                </div>
              </div>

            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-4">
        <q-card flat bordered class="dashboard-card">
          <q-card-section>
            <div class="row items-center no-wrap">

              <q-avatar
                color="orange-1"
                text-color="orange-9"
                icon="schedule"
                size="52px"
              />

              <div class="q-ml-md">
                <div class="text-grey-7">
                  Tempo total parado
                </div>

                <div class="text-h4 text-weight-bold">
                  {{ tempoTotalFormatado }}
                </div>
              </div>

            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-4">
        <q-card flat bordered class="dashboard-card">
          <q-card-section>
            <div class="row items-center no-wrap">

              <q-avatar
                color="purple-1"
                text-color="purple"
                icon="timer"
                size="52px"
              />

              <div class="q-ml-md">
                <div class="text-grey-7">
                  Tempo médio
                </div>

                <div class="text-h4 text-weight-bold">
                  {{ tempoMedioFormatado }}
                </div>
              </div>

            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-4">
        <q-card flat bordered class="dashboard-card">
          <q-card-section>
            <div class="row items-center no-wrap">

              <q-avatar
                color="green-1"
                text-color="positive"
                icon="check_circle"
                size="52px"
              />

              <div class="q-ml-md">
                <div class="text-grey-7">
                  Justificadas
                </div>

                <div class="text-h4 text-weight-bold text-positive">
                  {{ totalJustificadas }}
                </div>
              </div>

            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-4">
        <q-card flat bordered class="dashboard-card">
          <q-card-section>
            <div class="row items-center no-wrap">

              <q-avatar
                color="red-1"
                text-color="negative"
                icon="warning"
                size="52px"
              />

              <div class="q-ml-md">
                <div class="text-grey-7">
                  Não justificadas
                </div>

                <div class="text-h4 text-weight-bold text-negative">
                  {{ totalNaoJustificadas }}
                </div>
              </div>

            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-lg-4">
        <q-card flat bordered class="dashboard-card">
          <q-card-section>
            <div class="row items-center no-wrap">

              <q-avatar
                color="cyan-1"
                text-color="cyan-9"
                icon="build"
                size="52px"
              />

              <div class="q-ml-md motivo-card-text">
                <div class="text-grey-7">
                  Motivo mais frequente
                </div>

                <div class="text-h6 text-weight-bold ellipsis">
                  {{ motivoMaisFrequente }}
                </div>
              </div>

            </div>
          </q-card-section>
        </q-card>
      </div>

    </div>

    <div class="row q-col-gutter-md q-mb-lg">

      <div class="col-12 col-md-6">
        <q-card flat bordered class="chart-card">

          <q-card-section>
            <div class="row items-center">

              <q-icon
                name="bar_chart"
                color="primary"
                size="25px"
                class="q-mr-sm"
              />

              <div>
                <div class="text-h6">
                  Paradas por Motivo
                </div>

                <div class="text-caption text-grey-7">
                  Quantidade de paradas registradas para cada motivo.
                </div>
              </div>

            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>

            <div
              v-if="temDadosGraficoMotivos"
              class="chart-container"
            >
              <Bar
                :data="graficoParadasPorMotivo"
                :options="opcoesGraficoQuantidade"
              />
            </div>

            <div
              v-else
              class="empty-chart"
            >
              <q-icon
                name="bar_chart"
                size="48px"
                color="grey-5"
              />

              <div class="text-grey-6 q-mt-sm">
                Nenhuma parada justificada para exibir.
              </div>
            </div>

          </q-card-section>

        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card flat bordered class="chart-card">

          <q-card-section>
            <div class="row items-center">

              <q-icon
                name="schedule"
                color="orange-9"
                size="25px"
                class="q-mr-sm"
              />

              <div>
                <div class="text-h6">
                  Tempo Parado por Motivo
                </div>

                <div class="text-caption text-grey-7">
                  Tempo acumulado de parada para cada motivo.
                </div>
              </div>

            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>

            <div
              v-if="temDadosGraficoTempo"
              class="chart-container"
            >
              <Bar
                :data="graficoTempoPorMotivo"
                :options="opcoesGraficoTempo"
              />
            </div>

            <div
              v-else
              class="empty-chart"
            >
              <q-icon
                name="schedule"
                size="48px"
                color="grey-5"
              />

              <div class="text-grey-6 q-mt-sm">
                Nenhum tempo por motivo disponível.
              </div>
            </div>

          </q-card-section>

        </q-card>
      </div>

    </div>

    <q-card flat bordered>

      <q-card-section class="row items-center justify-between">

        <div>
          <div class="text-h6">
            Últimas Paradas
          </div>

          <div class="text-caption text-grey-7">
            Registros mais recentes considerando os filtros selecionados.
          </div>
        </div>

        <q-btn
          flat
          color="primary"
          icon-right="arrow_forward"
          label="Ver histórico"
          to="/historico"
        />

      </q-card-section>

      <q-separator />

      <q-list separator>

        <q-item
          v-for="parada in ultimasParadas"
          :key="parada.id"
        >

          <q-item-section avatar>

            <q-avatar
              :color="parada.justificada ? 'green-1' : 'red-1'"
              :text-color="parada.justificada ? 'positive' : 'negative'"
              :icon="parada.justificada ? 'check' : 'priority_high'"
            />

          </q-item-section>

          <q-item-section>

            <q-item-label>
              Parada #{{ parada.id }}
            </q-item-label>

            <q-item-label caption>
              {{ formatarDataHora(parada.inicio) }}
              •
              {{ formatarDuracao(parada.duracaoSegundos) }}
            </q-item-label>

            <q-item-label caption>
              {{ parada.motivo?.descricao || 'Motivo não informado' }}
            </q-item-label>

          </q-item-section>

          <q-item-section side>

            <q-badge
              :color="parada.justificada ? 'positive' : 'negative'"
              :label="parada.justificada ? 'Justificada' : 'Pendente'"
            />

          </q-item-section>

        </q-item>

        <q-item v-if="ultimasParadas.length === 0">
          <q-item-section>
            <q-item-label class="text-grey-6">
              Nenhuma parada encontrada para os filtros selecionados.
            </q-item-label>
          </q-item-section>
        </q-item>

      </q-list>

    </q-card>

  </q-page>
</template>

<script setup>
import {
  computed,
  onMounted,
  ref
} from 'vue'

import {
  useQuasar
} from 'quasar'

import {
  Bar
} from 'vue-chartjs'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
)

const $q = useQuasar()

const API_URL = 'http://localhost:3000/api'

const paradas = ref([])
const motivos = ref([])
const loading = ref(false)

const filtros = ref({
  dataInicial: '',
  dataFinal: '',
  duracao: 'todas',
  motivo: 'todos'
})

const opcoesDuracao = [
  {
    label: 'Todas as durações',
    value: 'todas'
  },
  {
    label: 'Até 1 minuto',
    value: 'ate-1'
  },
  {
    label: '1 a 5 minutos',
    value: '1-5'
  },
  {
    label: '5 a 10 minutos',
    value: '5-10'
  },
  {
    label: '10 a 30 minutos',
    value: '10-30'
  },
  {
    label: 'Acima de 30 minutos',
    value: 'acima-30'
  }
]

const opcoesMotivos = computed(() => {
  return [
    {
      label: 'Todos os motivos',
      value: 'todos'
    },

    ...motivos.value.map(motivo => ({
      label: motivo.descricao,
      value: motivo.id
    }))
  ]
})

const paradasFiltradas = computed(() => {
  return paradas.value.filter(parada => {

    if (parada.inicio) {
      const dataParada = obterDataLocal(parada.inicio)

      if (
        filtros.value.dataInicial &&
        dataParada < filtros.value.dataInicial
      ) {
        return false
      }

      if (
        filtros.value.dataFinal &&
        dataParada > filtros.value.dataFinal
      ) {
        return false
      }
    }

    const duracao =
      parada.duracaoSegundos === null ||
      parada.duracaoSegundos === undefined
        ? null
        : Number(parada.duracaoSegundos)

    switch (filtros.value.duracao) {

      case 'ate-1':
        if (
          duracao === null ||
          duracao > 60
        ) {
          return false
        }
        break

      case '1-5':
        if (
          duracao === null ||
          duracao <= 60 ||
          duracao > 300
        ) {
          return false
        }
        break

      case '5-10':
        if (
          duracao === null ||
          duracao <= 300 ||
          duracao > 600
        ) {
          return false
        }
        break

      case '10-30':
        if (
          duracao === null ||
          duracao <= 600 ||
          duracao > 1800
        ) {
          return false
        }
        break

      case 'acima-30':
        if (
          duracao === null ||
          duracao <= 1800
        ) {
          return false
        }
        break
    }

    if (filtros.value.motivo !== 'todos') {
      if (
        Number(parada.motivo?.id) !==
        Number(filtros.value.motivo)
      ) {
        return false
      }
    }

    return true
  })
})

const totalParadas = computed(() => {
  return paradasFiltradas.value.length
})

const totalJustificadas = computed(() => {
  return paradasFiltradas.value.filter(
    parada => parada.justificada
  ).length
})

const totalNaoJustificadas = computed(() => {
  return paradasFiltradas.value.filter(
    parada => !parada.justificada
  ).length
})

const tempoTotalSegundos = computed(() => {
  return paradasFiltradas.value.reduce(
    (total, parada) => {
      return total + Number(parada.duracaoSegundos || 0)
    },
    0
  )
})

const tempoTotalFormatado = computed(() => {
  return formatarDuracao(tempoTotalSegundos.value)
})

const tempoMedioSegundos = computed(() => {

  const registros = paradasFiltradas.value.filter(
    parada =>
      parada.duracaoSegundos !== null &&
      parada.duracaoSegundos !== undefined
  )

  if (registros.length === 0) {
    return 0
  }

  const total = registros.reduce(
    (soma, parada) =>
      soma + Number(parada.duracaoSegundos),
    0
  )

  return Math.round(total / registros.length)
})

const tempoMedioFormatado = computed(() => {
  return formatarDuracao(tempoMedioSegundos.value)
})

const resumoMotivos = computed(() => {

  const mapa = {}

  paradasFiltradas.value.forEach(parada => {

    if (!parada.motivo?.descricao) {
      return
    }

    const nome = parada.motivo.descricao

    if (!mapa[nome]) {
      mapa[nome] = {
        motivo: nome,
        quantidade: 0,
        tempoSegundos: 0
      }
    }

    mapa[nome].quantidade += 1

    mapa[nome].tempoSegundos +=
      Number(parada.duracaoSegundos || 0)
  })

  return Object.values(mapa)
})

const motivoMaisFrequente = computed(() => {

  if (resumoMotivos.value.length === 0) {
    return 'Não informado'
  }

  const ordenados = [...resumoMotivos.value].sort(
    (a, b) => b.quantidade - a.quantidade
  )

  return ordenados[0].motivo
})

const dadosQuantidadePorMotivo = computed(() => {
  return [...resumoMotivos.value].sort(
    (a, b) => b.quantidade - a.quantidade
  )
})

const graficoParadasPorMotivo = computed(() => {
  return {
    labels: dadosQuantidadePorMotivo.value.map(
      item => item.motivo
    ),

    datasets: [
      {
        label: 'Quantidade de paradas',

        data: dadosQuantidadePorMotivo.value.map(
          item => item.quantidade
        ),

        backgroundColor:
          'rgba(25, 118, 210, 0.72)',

        borderColor:
          'rgb(25, 118, 210)',

        borderWidth: 1,

        borderRadius: 5,

        maxBarThickness: 55,

        categoryPercentage: 0.75,

        barPercentage: 0.75
      }
    ]
  }
})

const temDadosGraficoMotivos = computed(() => {
  return dadosQuantidadePorMotivo.value.length > 0
})

const dadosTempoPorMotivo = computed(() => {
  return [...resumoMotivos.value]
    .filter(item => item.tempoSegundos > 0)
    .sort(
      (a, b) =>
        b.tempoSegundos - a.tempoSegundos
    )
})

const graficoTempoPorMotivo = computed(() => {
  return {
    labels: dadosTempoPorMotivo.value.map(
      item => item.motivo
    ),

    datasets: [
      {
        label: 'Tempo parado',

        data: dadosTempoPorMotivo.value.map(
          item => item.tempoSegundos
        ),

        backgroundColor:
          'rgba(245, 124, 0, 0.72)',

        borderColor:
          'rgb(245, 124, 0)',

        borderWidth: 1,

        borderRadius: 5,

        maxBarThickness: 55,

        categoryPercentage: 0.75,

        barPercentage: 0.75
      }
    ]
  }
})

const temDadosGraficoTempo = computed(() => {
  return dadosTempoPorMotivo.value.length > 0
})

const opcoesGraficoQuantidade = {
  responsive: true,

  maintainAspectRatio: false,

  animation: {
    duration: 500
  },

  interaction: {
    intersect: false,
    mode: 'index'
  },

  plugins: {

    legend: {
      display: false
    },

    tooltip: {
      callbacks: {

        label: context => {

          const quantidade = Number(context.raw)

          if (quantidade === 1) {
            return '1 parada'
          }

          return `${quantidade} paradas`
        }
      }
    }
  },

  scales: {

    y: {
      beginAtZero: true,

      ticks: {
        precision: 0,
        stepSize: 1
      },

      title: {
        display: true,
        text: 'Quantidade'
      },

      grid: {
        color: 'rgba(0, 0, 0, 0.08)'
      }
    },

    x: {

      grid: {
        display: false
      },

      ticks: {
        maxRotation: 35,
        minRotation: 0,
        autoSkip: false
      }
    }
  }
}

const opcoesGraficoTempo = {
  responsive: true,

  maintainAspectRatio: false,

  animation: {
    duration: 500
  },

  interaction: {
    intersect: false,
    mode: 'index'
  },

  plugins: {

    legend: {
      display: false
    },

    tooltip: {
      callbacks: {

        label: context => {
          return (
            'Tempo parado: ' +
            formatarDuracao(Number(context.raw))
          )
        }
      }
    }
  },

  scales: {

    y: {
      beginAtZero: true,

      title: {
        display: true,
        text: 'Tempo parado'
      },

      ticks: {

        callback: value => {
          return formatarEscalaTempo(Number(value))
        }
      },

      grid: {
        color: 'rgba(0, 0, 0, 0.08)'
      }
    },

    x: {

      grid: {
        display: false
      },

      ticks: {
        maxRotation: 35,
        minRotation: 0,
        autoSkip: false
      }
    }
  }
}

const ultimasParadas = computed(() => {

  return [...paradasFiltradas.value]
    .sort(
      (a, b) =>
        new Date(b.inicio) -
        new Date(a.inicio)
    )
    .slice(0, 5)
})

async function buscarDados () {

  loading.value = true

  try {

    const [
      respostaParadas,
      respostaMotivos
    ] = await Promise.all([
      fetch(`${API_URL}/paradas`),
      fetch(`${API_URL}/motivos`)
    ])

    const dadosParadas =
      await respostaParadas.json()

    const dadosMotivos =
      await respostaMotivos.json()

    if (
      !respostaParadas.ok ||
      !dadosParadas.success
    ) {
      throw new Error(
        dadosParadas.message ||
        'Erro ao carregar paradas.'
      )
    }

    if (
      !respostaMotivos.ok ||
      !dadosMotivos.success
    ) {
      throw new Error(
        dadosMotivos.message ||
        'Erro ao carregar motivos.'
      )
    }

    paradas.value =
      dadosParadas.data || []

    motivos.value =
      dadosMotivos.data || []

  } catch (error) {

    console.error(
      'Erro ao carregar dashboard:',
      error
    )

    $q.notify({
      type: 'negative',
      message:
        'Não foi possível carregar os dados do dashboard.'
    })

  } finally {

    loading.value = false
  }
}

function selecionarHoje () {

  const hoje = formatarDataInput(
    new Date()
  )

  filtros.value.dataInicial = hoje
  filtros.value.dataFinal = hoje
}

function selecionarUltimosDias (dias) {

  const fim = new Date()
  const inicio = new Date()

  inicio.setDate(
    inicio.getDate() - (dias - 1)
  )

  filtros.value.dataInicial =
    formatarDataInput(inicio)

  filtros.value.dataFinal =
    formatarDataInput(fim)
}

function limparFiltros () {

  filtros.value = {
    dataInicial: '',
    dataFinal: '',
    duracao: 'todas',
    motivo: 'todos'
  }
}

function formatarDataInput (data) {

  const ano = data.getFullYear()

  const mes = String(
    data.getMonth() + 1
  ).padStart(2, '0')

  const dia = String(
    data.getDate()
  ).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

function obterDataLocal (valor) {

  const data = new Date(valor)

  const partes =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    ).formatToParts(data)

  const valores = {}

  partes.forEach(parte => {
    valores[parte.type] = parte.value
  })

  return (
    `${valores.year}-` +
    `${valores.month}-` +
    `${valores.day}`
  )
}

function formatarDataHora (valor) {

  if (!valor) {
    return '-'
  }

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      timeZone: 'America/Sao_Paulo',

      day: '2-digit',
      month: '2-digit',
      year: 'numeric',

      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',

      hour12: false
    }
  ).format(new Date(valor))
}

function formatarDuracao (segundos) {

  if (
    segundos === null ||
    segundos === undefined
  ) {
    return '-'
  }

  const total = Math.max(
    0,
    Math.round(Number(segundos))
  )

  const horas =
    Math.floor(total / 3600)

  const minutos =
    Math.floor(
      (total % 3600) / 60
    )

  const segundosRestantes =
    total % 60

  if (horas > 0) {
    return (
      `${horas}h ` +
      `${minutos}min ` +
      `${segundosRestantes}s`
    )
  }

  if (minutos > 0) {
    return (
      `${minutos}min ` +
      `${segundosRestantes}s`
    )
  }

  return `${segundosRestantes}s`
}

function formatarEscalaTempo (segundos) {

  const total = Number(segundos)

  if (total >= 3600) {

    const horas =
      total / 3600

    if (Number.isInteger(horas)) {
      return `${horas}h`
    }

    return `${horas.toFixed(1)}h`
  }

  if (total >= 60) {

    const minutos =
      total / 60

    if (Number.isInteger(minutos)) {
      return `${minutos}min`
    }

    return `${minutos.toFixed(1)}min`
  }

  return `${Math.round(total)}s`
}

onMounted(() => {
  buscarDados()
})
</script>

<style scoped>

.dashboard-card {
  min-height: 110px;
}

.motivo-card-text {
  min-width: 0;
}

.chart-card {
  height: 100%;
}

.chart-container {
  position: relative;

  width: 100%;

  height: 275px;
}

.empty-chart {
  height: 275px;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;
}

@media (max-width: 1023px) {

  .chart-container {
    height: 300px;
  }

  .empty-chart {
    height: 300px;
  }
}

@media (max-width: 599px) {

  .chart-container {
    height: 280px;
  }

  .empty-chart {
    height: 280px;
  }
}

</style>