/**
 * ---------------------------------------------------------------------------------------
 * store.js
 * ---------------------------------------------------------------------------------------
 */

import Vue from "vue-runtime-alias"
import Vuex from "vuex-alias"
import { states, mutations } from "./storeUtils"

Vue.use(Vuex)

const store = new Vuex.Store({

    state: {

        appState: states.app.loading,

        homeState: states.home.stop,

        worldState: states.world.stop

    },

    mutations: {

        [mutations.appState] (state, appState) {
            state.appState = appState
        },

        [mutations.homeState] (state, homeState) {
            state.homeState = homeState
        },

        [mutations.worldState] (state, worldState) {
            state.worldState = worldState
        }

    },

    getters: {

        isAppInitialized: state => state.appState === states.app.init || state.appState === states.app.idle,

        isAppLoading: state => state.appState === states.app.loading,

        isHomeVisible: state => state.homeState === states.home.start

    }
})

export { store }