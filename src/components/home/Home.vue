<template>
    <div id="home">
        <home-close v-show="isHomeVisible"></home-close>
        <home-header></home-header>
        <div id="homeContent" v-show="isHomeVisible">
            <separator></separator>
            <console></console>
            <separator></separator>
            <router-view></router-view>
            <separator></separator>
            <scifi-menu></scifi-menu>
            <separator></separator>
            <home-footer></home-footer>
        </div>
    </div>
</template>

<script setup>

    import { computed } from "vue"
    import { useAppStore } from "@/stores/app"
    import HomeClose from "./HomeClose.vue"
    import HomeHeader from "./HomeHeader.vue"
    import HomeFooter from "./HomeFooter.vue"
    import Separator from "./Separator.vue"
    import Console from "./Console.vue"
    import ScifiMenu from "./ScifiMenu.vue"

    const store = useAppStore()

    const isHomeVisible = computed(() => store.isHomeVisible)

</script>

<style scoped lang="scss">

    canvas {
        display: block;
        margin: 0;
        padding: 0;
        border: 0;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        outline: none;
        -webkit-tap-highlight-color: rgba(255, 255, 255, 0); /* mobile webkit */
    }

    #home {
        width: 100vw;
        z-index: 1;
    }

    #homeContent {
        width: 100%;
    }

</style>
