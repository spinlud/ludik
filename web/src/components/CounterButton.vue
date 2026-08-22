<template>
  <button class="counter" type="button" @click="counter.increment()">
    count is {{ counter.count }} (double: {{ counter.doubleCount }})
  </button>
</template>

<script setup>
import { useCounterStore } from '../stores/counter'

const counter = useCounterStore()
</script>

<style lang="scss" scoped>
$counter-accent: #42b883;

.counter {
  padding: 0.6em 1.2em;
  border: 1px solid $counter-accent;
  border-radius: 8px;
  background: transparent;
  color: $counter-accent;
  cursor: pointer;

  &:hover {
    background: rgba($counter-accent, 0.1);
  }
}
</style>
