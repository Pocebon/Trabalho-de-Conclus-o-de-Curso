<template>
  <q-dialog
    v-model="dialogOpen"
    persistent
  >
    <q-card
      style="width: 500px; max-width: 90vw"
    >
      <q-card-section>
        <div class="text-h6">
          Parada de máquina detectada
        </div>

        <div class="text-grey-7 q-mt-sm">
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

        <div
          v-if="operatorName"
          class="q-mb-md"
        >
          <strong>
            Operador:
          </strong>

          {{ operatorName }}
        </div>

        <q-select
          v-model="selectedReason"
          :options="reasons"
          label="Motivo da parada"
          outlined
          emit-value
          map-options
          :loading="loadingReasons"
          :disable="loadingReasons"
        />

        <q-input
          v-if="isOtherReason"
          v-model="observation"
          label="Informe o motivo"
          outlined
          class="q-mt-md"
        />

        <div
          v-if="alarms.length > 0"
          class="q-mt-md"
        >
          <div class="text-subtitle2 q-mb-xs">
            Alarmes registrados:
          </div>

          <div
            v-for="(alarm, index) in alarms"
            :key="index"
            class="text-grey-8"
          >
            {{
              alarm.message ||
              'Alarme sem descrição'
            }}
          </div>
        </div>

      </q-card-section>

      <q-card-actions align="right">

        <q-btn
          label="Registrar motivo"
          color="primary"
          :loading="saving"
          :disable="
            loadingReasons ||
            !selectedReason ||
            saving ||
            (
              isOtherReason &&
              !observation.trim()
            )
          "
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

import {
  useQuasar
} from 'quasar'

const $q = useQuasar()

const dialogOpen = ref(false)

const selectedReason = ref(null)

const observation = ref('')

const stopStartedAt = ref(null)

const paradaId = ref(null)

const operatorName = ref('')

const alarms = ref([])

const reasons = ref([])

const loadingReasons = ref(false)

const saving = ref(false)

let removeStopListener = null

// ==================================================
// MOTIVO SELECIONADO
// ==================================================

const selectedReasonObject =
  computed(() => {
    return reasons.value.find(
      reason =>
        reason.value ===
        selectedReason.value
    )
  })

// ==================================================
// VERIFICAR SE O MOTIVO É "OUTRO"
// ==================================================

const isOtherReason =
  computed(() => {
    return (
      selectedReasonObject
        .value
        ?.label
        ?.toLowerCase() ===
      'outro'
    )
  })

// ==================================================
// FORMATAR DATA/HORA DA PARADA
// ==================================================

const formattedStartedAt =
  computed(() => {
    if (!stopStartedAt.value) {
      return '-'
    }

    const [
      date,
      time
    ] =
      stopStartedAt
        .value
        .split(' ')

    if (!date || !time) {
      return stopStartedAt.value
    }

    const [
      year,
      month,
      day
    ] =
      date.split('-')

    return (
      `${day}/${month}/${year} ` +
      time
    )
  })

// ==================================================
// CARREGAR MOTIVOS
// ==================================================

async function loadReasons () {
  loadingReasons.value = true

  try {
    if (
      !window.electronAPI
        ?.getStopReasons
    ) {
      throw new Error(
        'API do Electron não disponível.'
      )
    }

    const response =
      await window
        .electronAPI
        .getStopReasons()

    if (!response.success) {
      throw new Error(
        response.message
      )
    }

    reasons.value =
      response.data.map(
        reason => ({
          label:
            reason.descricao,

          value:
            reason.id
        })
      )

  } catch (error) {
    console.error(
      'Erro ao carregar motivos:',
      error
    )

    $q.notify({
      type: 'negative',
      message:
        'Erro ao carregar motivos de parada.'
    })

  } finally {
    loadingReasons.value = false
  }
}

// ==================================================
// REGISTRAR JUSTIFICATIVA
// ==================================================

async function registerReason () {

  if (!paradaId.value) {
    $q.notify({
      type: 'negative',
      message:
        'Não foi possível identificar a parada.'
    })

    return
  }

  if (!selectedReason.value) {
    return
  }

  if (
    isOtherReason.value &&
    !observation.value.trim()
  ) {
    return
  }

  saving.value = true

  try {
    if (
      !window.electronAPI
        ?.registerStopReason
    ) {
      throw new Error(
        'API do Electron não disponível.'
      )
    }

    const response =
      await window
        .electronAPI
        .registerStopReason({
          paradaId:
            paradaId.value,

          reasonId:
            selectedReason.value,

          observation:
            observation.value.trim()
        })

    if (!response.success) {
      throw new Error(
        response.message
      )
    }

    $q.notify({
      type: 'positive',
      message:
        'Motivo registrado com sucesso.'
    })

    // LIMPAR MODAL
    dialogOpen.value = false

    paradaId.value = null

    stopStartedAt.value = null

    operatorName.value = ''

    selectedReason.value = null

    observation.value = ''

    alarms.value = []

  } catch (error) {
    console.error(
      'Erro ao registrar motivo:',
      error
    )

    $q.notify({
      type: 'negative',
      message:
        error.message ||
        'Erro ao registrar motivo da parada.'
    })

  } finally {
    saving.value = false
  }
}

// ==================================================
// ESCUTAR PARADA CONFIRMADA PELO ELECTRON
// ==================================================

onMounted(() => {

  if (
    window.electronAPI
      ?.onMachineStopConfirmed
  ) {
    removeStopListener =
      window
        .electronAPI
        .onMachineStopConfirmed(
          async stop => {

            console.log(
              'Parada recebida do Electron:',
              stop
            )

            paradaId.value =
              stop.paradaId

            stopStartedAt.value =
              stop.startedAt

            operatorName.value =
              stop.operadorNome || ''

            alarms.value =
              stop.alarms ?? []

            selectedReason.value =
              null

            observation.value =
              ''

            // Busca os motivos SOMENTE
            // quando existe uma parada.
            await loadReasons()

            dialogOpen.value = true
          }
        )
  }
})

// ==================================================
// REMOVER LISTENER
// ==================================================

onBeforeUnmount(() => {
  if (removeStopListener) {
    removeStopListener()
  }
})
</script>