<template>
  <router-view />

  <StopReasonDialog />
</template>

<script setup>
import StopReasonDialog
  from './components/StopReasonDialog.vue'
</script>