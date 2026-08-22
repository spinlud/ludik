/**
 * ---------------------------------------------------------------------------------------
 * app store
 *
 * Ported from the Vuex 3 store. The state machine drives the 3D World intro / Home
 * visibility. While the World is stubbed, the app boots directly into the visible Home
 * view: `appState` starts idle (initialized) and `homeState` starts at `start`.
 * ---------------------------------------------------------------------------------------
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { states } from './storeUtils'

export const useAppStore = defineStore('app', () => {

    // Boot directly into the visible Home view while the 3D World intro is stubbed.
    const appState = ref(states.app.idle)
    const homeState = ref(states.home.start)
    const worldState = ref(states.world.stop)

    const isAppInitialized = computed(
        () => appState.value === states.app.init || appState.value === states.app.idle
    )
    const isAppLoading = computed(() => appState.value === states.app.loading)
    const isHomeVisible = computed(() => homeState.value === states.home.start)

    function changeAppState (value) {
        appState.value = value
    }

    function changeHomeState (value) {
        homeState.value = value
    }

    function changeWorldState (value) {
        worldState.value = value
    }

    return {
        appState,
        homeState,
        worldState,
        isAppInitialized,
        isAppLoading,
        isHomeVisible,
        changeAppState,
        changeHomeState,
        changeWorldState
    }

})
