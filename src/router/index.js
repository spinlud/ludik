import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '@/stores/app'

import Home from '@/components/home/Home.vue'
import LatestNews from '@/components/home/latest-news/LatestNews.vue'
import Albums from '@/components/home/albums/Albums.vue'
import Singles from '@/components/home/singles/Singles.vue'
import DjSets from '@/components/home/dj-sets/DjSets.vue'
import About from '@/components/home/about/About.vue'

// The `scroll` flag travels as a query param (vue-router no longer forwards
// params that are not part of the path) and is mapped to a boolean prop.
const scrollProps = (route) => ({ scroll: route.query.scroll === 'true' })

const routes = [
    {
        // no name, default goes to LatestNews
        path: '/',
        component: Home,
        children: [
            {
                path: '',
                name: 'LatestNews',
                component: LatestNews,
                props: scrollProps
            },
            {
                path: 'albums',
                name: 'Albums',
                component: Albums,
                props: scrollProps
            },
            {
                path: 'singles',
                name: 'Singles',
                component: Singles,
                props: scrollProps
            },
            {
                path: 'dj-sets',
                name: 'DjSets',
                component: DjSets,
                props: scrollProps
            },
            {
                path: 'about',
                name: 'About',
                component: About,
                props: scrollProps
            },
            {
                path: ':pathMatch(.*)*',
                redirect: { name: 'LatestNews' }
            }
        ]
    },
    {
        path: '/:catchAll(.*)*',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to) => {

    // if app is not initialized or home is in stop, redirect to root
    const store = useAppStore()

    if (to.path !== '/' && (!store.isAppInitialized || !store.isHomeVisible)) {
        return '/'
    }

})

export default router
