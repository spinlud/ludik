<template>
    <div id="app">
        <div id="fixedBackground"></div>
        <mmenu v-show="isHomeVisible"></mmenu>
        <icons-sidebar></icons-sidebar>
        <load-view v-show="isAppLoading"></load-view>
        <world></world>
        <router-view></router-view>
    </div>
</template>

<script>

    import { states, mutations } from "./store/storeUtils"
    import Mmenu from "./components/mmenu/Mmenu.vue"
    import IconsSidebar from "./components/icons-sidebar/IconsSidebar.vue"
    import LoadView from "./components/loading-view/LoadingView.vue"
    import World from "./components/world/World.vue"

    const TAG = "[App]"

    export default {

        name: "App",

        components: {
            mmenu: Mmenu,
            iconsSidebar: IconsSidebar,
            loadView: LoadView,
            world: World,
        },

        computed: {

            isAppInitialized () {

                return this.$store.getters.isAppInitialized

            },

            isAppLoading () {

                return this.$store.getters.isAppLoading

            },

            isHomeVisible () {

                return this.$store.getters.isHomeVisible

            },

            worldState () {

                return this.$store.state.worldState

            },

            homeState () {

                return this.$store.state.homeState

            }

        },

        methods: {


        },

        watch: {

            worldState (newVal, oldVal) {

                switch (newVal) {

                    case states.world.stop:
                        this.$store.commit(mutations.homeState, states.home.start)
                        break

                }

            },

            homeState (newVal, oldVal) {

                switch (newVal) {

                    case states.home.stop:
                        this.$store.commit(mutations.worldState, states.world.start)
                        break

                }

            }

        },

        mounted () {

            // // DELETE
            // this.$store.commit(mutations.homeState, states.home.start)

        }

    }
</script>

<style scoped lang="scss">

    @import "./styles/base/reset";
    @import "./styles/base/typography";
    @import "./styles/helpers/variables";
    @import "./styles/helpers/colors";
    @import "./styles/helpers/mixins";

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

        background-image: url("../assets/images/SkyboxZ-1920_1080_70_10.jpg");
        background-size: cover;

        @include mobile-portrait {
            background-image: url("../assets/images/SkyboxZ-960_1600_70_10.jpg");
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