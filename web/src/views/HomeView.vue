<template>
  <main class="home">
    <h1>Ludik — Vite scaffold</h1>
    <p>Fresh Vite + Vue 3 shell. Pinia, vue-router and Dart Sass are wired.</p>
    <CounterButton />
  </main>
</template>

<script setup>
import CounterButton from '../components/CounterButton.vue'
</script>

<style lang="scss" scoped>
$home-max-width: 720px;

.home {
  max-width: $home-max-width;
  margin: 0 auto;

  h1 {
    font-weight: 700;
  }
}
</style>
