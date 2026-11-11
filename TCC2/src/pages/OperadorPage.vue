<template>
  <q-page class="q-pa-lg">
    
    <div class="q-mb-lg">

      <div class="text-h4 text-weight-bold">
        Monitoramento da Máquina
      </div>

      <div class="text-grey-7 q-mt-xs">
        Acompanhe o estado da máquina e aguarde
        os registros de parada.
      </div>

    </div>

    <q-card
      flat
      bordered
      class="q-mb-lg"
    >
      <q-card-section>

        <div class="row items-center">

          <q-avatar
            color="blue-1"
            text-color="primary"
            icon="person"
            size="55px"
          />

          <div class="q-ml-md">

            <div class="text-caption text-grey-7">
              Operador
            </div>

            <div class="text-h6 text-weight-bold">
              {{ usuario?.nome || 'Operador' }}
            </div>

          </div>

        </div>

      </q-card-section>
    </q-card>

    <div class="row q-col-gutter-md">

      <div class="col-12 col-md-6">

        <q-card
          flat
          bordered
          class="status-card"
        >
          <q-card-section>

            <div class="row items-center">

              <q-avatar
                color="green-1"
                text-color="positive"
                icon="precision_manufacturing"
                size="60px"
              />

              <div class="q-ml-md">

                <div class="text-caption text-grey-7">
                  Monitoramento
                </div>

                <div class="text-h5 text-weight-bold">
                  Ativo
                </div>

                <div class="text-caption text-grey-7">
                  Aguardando eventos da máquina
                </div>

              </div>

            </div>

          </q-card-section>
        </q-card>

      </div>

      <div class="col-12 col-md-6">

        <q-card
          flat
          bordered
          class="status-card"
        >
          <q-card-section>

            <div class="row items-center">

              <q-avatar
                color="blue-1"
                text-color="primary"
                icon="description"
                size="60px"
              />

              <div class="q-ml-md">

                <div class="text-caption text-grey-7">
                  Arquivo de monitoramento
                </div>

                <div class="text-h6 text-weight-bold">
                  Xilog Plus
                </div>

                <div class="text-caption text-grey-7">
                  Monitorando novos eventos
                </div>

              </div>

            </div>

          </q-card-section>
        </q-card>

      </div>

    </div>

    <q-card
      flat
      bordered
      class="q-mt-lg"
    >
      <q-card-section>

        <div class="row items-center no-wrap">

          <q-icon
            name="info"
            color="primary"
            size="32px"
            class="q-mr-md"
          />

          <div>

            <div class="text-weight-bold">
              Monitoramento automático
            </div>

            <div class="text-grey-7 q-mt-xs">
              Quando uma parada ultrapassar o tempo
              configurado, a tela de justificativa será
              exibida automaticamente.
            </div>

          </div>

        </div>

      </q-card-section>
    </q-card>

  </q-page>
</template>

<script setup>
import {
  ref,
  onMounted
} from 'vue'

const usuario =
  ref(null)

onMounted(() => {

  const usuarioSalvo =
    sessionStorage.getItem(
      'usuario'
    )

  if (usuarioSalvo) {

    try {

      usuario.value =
        JSON.parse(
          usuarioSalvo
        )

    } catch (error) {

      console.error(
        'Erro ao recuperar usuário:',
        error
      )
    }
  }
})
</script>

<style scoped>
.status-card {
  min-height: 130px;
}
</style>