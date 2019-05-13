/**
 * ---------------------------------------------------------------------------------------
 * app.js
 * ---------------------------------------------------------------------------------------
 */

import "./styles/base/_reset.scss"
import "./styles/base/_base.scss"

import Vue from "vue-runtime-alias"
import { router } from "./router/router"
import { store } from "./store/store"
import App from "./App.vue"
import smoothScroll from "smoothscroll-polyfill" // polyfill to support scrollIntoView also on ios mobile

require("stereo-panner-node").polyfill()
smoothScroll.polyfill()

new Vue({
    el: '#content',
    store: store,
    router: router,
    render: h => h(App)
})
