import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Trivial placeholder store to prove Pinia is wired.
export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})
