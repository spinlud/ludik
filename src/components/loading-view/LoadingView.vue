<template>
    <div id="loading">
<!--        <loading-spinner></loading-spinner>-->

        <div class="blur-text-container">
            <div id="loadingText">
                <span class="blur-text">L</span>
                <span class="blur-text">O</span>
                <span class="blur-text">A</span>
                <span class="blur-text">D</span>
                <span class="blur-text">I</span>
                <span class="blur-text">N</span>
                <span class="blur-text">G</span>
            </div>

            <div id="startText" style="display: none;">
                <span class="blur-text">C</span>
                <span class="blur-text">L</span>
                <span class="blur-text">I</span>
                <span class="blur-text">C</span>
                <span class="blur-text">K</span>
                <!--            <span class="blur-text"> </span>-->
                <br>
                <span class="blur-text">T</span>
                <span class="blur-text">O</span>
                <span class="blur-text"> </span>
                <span class="blur-text">S</span>
                <span class="blur-text">T</span>
                <span class="blur-text">A</span>
                <span class="blur-text">R</span>
                <span class="blur-text">T</span>
            </div>
        </div>

        <div id="loadingMessage" v-html="message">
        </div>

    </div>
</template>

<script>

    import { states, mutations } from "../../store/storeUtils"
    import { isiOS } from "../shared/utils"
    import EventManager from "../shared/EventManager"
    import AudioManager from "../shared/AudioManager"
    import LoadingSpinner from "./LoadingSpinner.vue"

    const eventManager = new EventManager()
    const T = THREE // Imported only to initialize audio context
    const TAG = "[LoadingView]"

    export default {

        name: "LoadView",

        data () {

            return {
                message: isiOS() ?
                    `iOS<13 users warning: please make sure you have \"Motion & Orientation Access\" enabled in Settings -> Safari.<br><br>
                     This app uses WebGL and positional audio.
                     For the best experience Google Chrome and headphones are recommended.
                     `:
                    `This app uses WebGL and positional audio.<br>
                    For the best experience Google Chrome and headphones are recommended.`
            }

        },

        components: {
            loadingSpinner: LoadingSpinner
        },

        computed: {

            worldState () {

                return this.$store.state.worldState

            }

        },

        methods: {

            fadeOutLoadingText (time) {
                return new Promise(resolve => {
                    $("#loadingText").fadeOut(time || 1000, resolve)
                })
            },

            fadeInStartText (time) {
                return new Promise(resolve => {
                    $("#startText").fadeIn(time || 1000, resolve)
                })
            }

        },

        watch: {

            // watch for changes on worldState property from the Vuex store
            async worldState (newVal, oldVal) {

                if (newVal === states.world.init) {

                    await this.fadeOutLoadingText()
                    await this.fadeInStartText()

                    const listener = new T.AudioListener()
                    const sound = new T.Audio(listener)
                    sound.setBuffer(listener.context.createBuffer(1, 1, 22050))
                    sound.setVolume(0.00001)
                    sound.setLoop(false)

                    const onClick = async () => {

                        // iOS 13 request access to device motion data
                        if (isiOS() && DeviceOrientationEvent && typeof(DeviceOrientationEvent.requestPermission) === "function") {
                            const permissionState = await DeviceOrientationEvent.requestPermission()
                            if (permissionState !== "granted") {
                                // throw new Error("Device orientation access denied from the user")
                                return
                            }
                        }

                        AudioManager.resume() // enable AudioContext for website
                        listener.context.resume() // enable AudioContext for three.js
                        sound.play()

                        eventManager.removeBusEvents()
                        eventManager.removeDomEvents()

                        this.$store.commit(mutations.worldState, states.world.start)

                        // hide startText and display loadingText
                        setTimeout(() => {

                            $("#startText").css({opacity: 0, display: "none"})
                            $("#loadingText").css({opacity: 1, display: "block"})

                        }, 1000)

                    }

                    eventManager.addDomEvent(this.$el, "click", onClick)

                }

            }

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

    #loading {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 2;
        background: rgba(black, 0.3);
    }

    .blur-text-container {
        position: absolute;
        width: 100%;
        /*top: 60%;*/ // <-- when LoadingSpinner was visible
        top: 50%;
        text-align: center;
        color: #fff;
        cursor: default;
    }

    .blur-text {
        display: inline-block;
        margin: 0 2px;
        color: #fff;
        // font-family: 'Quattrocento Sans', sans-serif;
        font-family: neuropol;
        font-size: 1.2em;
        cursor: default;
        text-shadow: 0 0 8px white;
    }

    #loadingMessage {
        padding: 2em;
        font-size: 0.8em;
        line-height: 1em;
        text-align: center;
        text-justify: inter-word;
        color: $silver-chalice
    }

    @for $i from 1 through 7 {
        #loadingText span:nth-child(#{$i}) {
            -webkit-filter: blur(0px);
            filter: blur(0px);
            -webkit-animation: blur-text 1.5s #{($i - 1)*0.4}s infinite linear alternate;
            animation: blur-text 1.5s #{($i - 1)*0.4}s infinite linear alternate;
        }
    }

    @for $i from 1 through 22 {
        #startText span:nth-child(#{$i}) {
            -webkit-filter: blur(0px);
            filter: blur(0px);
            -webkit-animation: blur-text 1.5s #{($i - 1) * 0.2}s infinite linear alternate;
            animation: blur-text 1.5s #{($i - 1) * 0.2}s infinite linear alternate;
        }
    }

    @-webkit-keyframes blur-text {
        0% {
            -webkit-filter: blur(0px);
            filter: blur(0px);
        }
        100% {
            -webkit-filter: blur(2px);
            filter: blur(2px);
        }
    }

    @keyframes blur-text {
        0% {
            -webkit-filter: blur(0px);
            filter: blur(0px);
        }
        100% {
            -webkit-filter: blur(2px);
            filter: blur(2px);
        }
    }

</style>
