<template>
  <q-dialog
    v-model="dialogOpen"
    persistent
  >
    <q-card style="width: 500px; max-width: 90vw">

      <q-card-section>
        <div class="text-h6">
          Parada de máquina detectada
        </div>

        <div
          class="text-grey-7 q-mt-sm"
        >
          A máquina permanece parada
          acima do tempo permitido.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>

        <div class="q-mb-md">
          <strong>
            Início da parada:
          </strong>

          {{ formattedStartedAt }}
        </div>

        <q-select
          v-model="selectedReason"
          :options="reasons"
          label="Motivo da parada"
          outlined
          emit-value
          map-options
        />

        <q-input
          v-if="selectedReason === 'Outro'"
          v-model="observation"
          label="Informe o motivo"
          outlined
          class="q-mt-md"
        />

      </q-card-section>

      <q-card-actions
        align="right"
      >

        <q-btn
          label="Registrar motivo"
          color="primary"
          :disable="!selectedReason"
          @click="registerReason"
        />

      </q-card-actions>

    </q-card>
  </q-dialog>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'

const dialogOpen = ref(false)

const selectedReason = ref(null)

const observation = ref('')

const stopStartedAt = ref(null)

let removeStopListener = null

const reasons = [
  {
    label: 'Falta de material',
    value: 'Falta de material'
  },
  {
    label: 'Ajuste de máquina',
    value: 'Ajuste de máquina'
  },
  {
    label: 'Manutenção',
    value: 'Manutenção'
  },
  {
    label: 'Troca de ferramenta',
    value: 'Troca de ferramenta'
  },
  {
    label: 'Limpeza',
    value: 'Limpeza'
  },
  {
    label: 'Problema operacional',
    value: 'Problema operacional'
  },
  {
    label: 'Outro',
    value: 'Outro'
  }
]

const formattedStartedAt = computed(
  () => {
    if (!stopStartedAt.value) {
      return '-'
    }

    return new Date(
      stopStartedAt.value
    ).toLocaleString('pt-BR')
  }
)

function registerReason () {
  console.log(
    'Motivo selecionado:',
    selectedReason.value
  )

  console.log(
    'Observação:',
    observation.value
  )

  dialogOpen.value = false

  selectedReason.value = null
  observation.value = ''
}

onMounted(() => {
  if (
    window.electronAPI
      ?.onMachineStopConfirmed
  ) {
    removeStopListener =
      window.electronAPI
        .onMachineStopConfirmed(
          (stop) => {
            console.log(
              'Parada recebida do Electron:',
              stop
            )

            stopStartedAt.value =
              stop.startedAt

            dialogOpen.value = true
          }
        )
  }
})

onBeforeUnmount(() => {
  if (removeStopListener) {
    removeStopListener()
  }
})
</script>