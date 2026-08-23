<template>
    <div id="app">
        <div id="fixedBackground"></div>
        <mmenu v-show="isHomeVisible"></mmenu>
        <icons-sidebar></icons-sidebar>
        <world></world>
        <router-view></router-view>
    </div>
</template>

<script setup>

    import { computed } from "vue"
    import { useAppStore } from "@/stores/app"
    import Mmenu from "@/components/mmenu/Mmenu.vue"
    import IconsSidebar from "@/components/icons-sidebar/IconsSidebar.vue"
    import World from "@/components/world/World.vue"

    const store = useAppStore()

    const isHomeVisible = computed(() => store.isHomeVisible)

</script>

<style scoped lang="scss">

    #app {
        width: 100vw;
        min-height: 100vh;
    }

    #fixedBackground {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;

        background-color: black;

        background-image: url("/assets/images/SkyboxZ-1920_1080_70_10.jpg");
        background-size: cover;

        @include mobile-portrait {
            background-image: url("/assets/images/SkyboxZ-960_1600_70_10.jpg");
        }

        z-index: -1;
    }

    @keyframes animate-stars {
        from {
            background-position: 0 0, 0 0;
        }
        to {
            background-position: -1680px 0, 0 0;
        }
    }

</style>
