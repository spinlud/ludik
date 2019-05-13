/**
 * ---------------------------------------------------------------------------------------
 * states.js
 * ---------------------------------------------------------------------------------------
 */

const states = {

    app: {
        init: "APP_INIT",
        loading: "APP_LOADING",
        idle: "APP_IDLE"
    },

    world: {
        init: "WORLD_INIT",
        start: "WORLD_START",
        stop: "WORLD_STOP"
    },

    home: {
        start: "HOME_START",
        stop: "HOME_STOP"
    }

}

const mutations = {

    appState: "changeAppState",

    worldState: "changeWorldState",

    homeState: "changeHomeState"

}

export { states, mutations }