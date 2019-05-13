/**
 * ---------------------------------------------------------------------------------------
 * router.js
 * ---------------------------------------------------------------------------------------
 */

import Vue from "vue-runtime-alias"
import Router from "vue-router-alias"
import { store } from "../store/store"

import Home from "../components/home/Home.vue"
import LatestNews from "../components/home/latest-news/LatestNews.vue"
import Albums from "../components/home/albums/Albums.vue"
import Singles from "../components/home/singles/Singles.vue"
import About from "../components/home/about/About.vue"


Vue.use(Router)

const TAG = "[Router]"

const router = new Router({

    routes: [

        {
            // no name, default goes to LatestNews
            path: "/",
            component: Home,

            children: [
                {
                    path: "",
                    name: "LatestNews",
                    component: LatestNews,
                    props: true
                },
                {
                    path: "albums",
                    name: "Albums",
                    component: Albums,
                    props: true
                },
                {
                    path: "singles",
                    name: "Singles",
                    component: Singles,
                    props: true
                },
                {
                    path: "about",
                    name: "About",
                    component: About,
                    props: true
                },
                {
                    path: "*",
                    redirect: {name: "LatestNews"}
                }
            ]
        },
        {
            path: "*",
            redirect: "/"
        }

    ]
})


router.beforeEach((to, from, next) => {

    // if app is not initialized or home is in stop, redirect to root
    if (to.path !== "/" && (!store.getters.isAppInitialized || !store.getters.isHomeVisible)) {
        next("/")
    }
    else {
        next()
    }

})

export { router }

