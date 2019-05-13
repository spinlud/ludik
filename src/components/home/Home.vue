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

<script>

    import { states, mutations } from "../../store/storeUtils"
    import AudioManager from "../shared/AudioManager"
    import EventManager from "../shared/EventManager"
    import HomeClose from "./HomeClose.vue"
    import HomeHeader from "./HomeHeader.vue"
    import HomeFooter from "./HomeFooter.vue"
    import Separator from "./Separator.vue"
    import Console from "./Console.vue"
    import ScifiMenu from "./ScifiMenu.vue"

    const eventManager = new EventManager()
    const TAG = "[Home]"

    export default {

        name: "Home",

        components: {

            homeClose: HomeClose,
            homeHeader: HomeHeader,
            homeFooter: HomeFooter,
            separator: Separator,
            console: Console,
            scifiMenu: ScifiMenu

        },

        computed: {

            isHomeVisible () {

                return this.$store.getters.isHomeVisible

            },

            homeState () {

                return this.$store.state.homeState

            }

        },

        watch: {

            homeState (newVal, oldVal) {

                switch (newVal) {

                    case states.home.start:
                        AudioManager.resume()
                        this.$el.style.display = "block"
                        break

                    case states.home.stop:
                        AudioManager.suspend()
                        this.$el.style.display = "none"
                        break

                }
            }

        },

        mounted () {


        },

        beforeDestroy () {

            eventManager.removeBusEvents()
            eventManager.removeDomEvents()
            console.log(TAG, "beforeDestroy")

        }

    }

</script>

<style scoped lang="scss">

    @import "../../styles/base/reset";
    @import "../../styles/base/typography";
    @import "../../styles/helpers/variables";
    @import "../../styles/helpers/colors";
    @import "../../styles/helpers/mixins";

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