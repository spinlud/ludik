/**
 * ---------------------------------------------------------------------------------------
 * app store
 *
 * The state machine drives the 3D World intro / Home visibility. The app boots into the
 * loading view while the World loads its assets: `appState` starts at `loading` and
 * `homeState` starts at `stop`, so the Home view stays hidden until the user exits the
 * World.
 * ---------------------------------------------------------------------------------------
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { states } from './storeUtils'

export const useAppStore = defineStore('app', () => {

    // Boot into the loading view; the Home view is revealed only when the World stops.
    const appState = ref(states.app.loading)
    const homeState = ref(states.home.stop)
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
