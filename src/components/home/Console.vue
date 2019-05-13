<template>
    <div id="homeConsole">
        <span id="homeConsoleMessage" class="home-console-text"></span>
        <img id="homeConsoleReload" src="../../../assets/images/icons/icons8-ruota-a-destra-filled-50.png" width="" alt="">
    </div>
</template>

<script>

    import { states, mutations } from "../../store/storeUtils"
    import AudioManager from "../shared/AudioManager"
    import EventManager from "../shared/EventManager"
    import { wait } from "../shared/utils"

    const TAG = "[Console]"
    const T = THREE
    const eventManager = new EventManager()

    export default {

        name: "Console",

        data () {

            return {

                reloadTyping: false

            }

        },

        computed: {

            homeState () {

                return this.$store.state.homeState

            }

        },

        watch: {

            homeState (newVal, oldVal) {

                switch (newVal) {

                    case states.home.start:
                        // Trigger animation only the first time
                        if (!this.isInitialized) {
                            setTimeout(this.displayConsoleMessage, 250)
                            eventManager.addDomEvent(document.getElementById("homeConsoleReload"), "click", this.reloadConsoleMessage)
                        }
                        break

                    case states.home.stop:
                        break

                }
            }

        },

        methods: {

            async displayConsoleMessage () {

                await AudioManager.resume()
                this.reloadTyping = false

                const homeConsoleMessage = $("#homeConsoleMessage")
                const soundVolume = 0.01
                const charTimeout = 40
                const phraseTimeoutShort = 200 // , : ;
                const phraseTimeoutLong = 1000 // . ! ?
                let message = ""

                const buffers = [
                    await this.audioManager.loadBuffer("assets/audio/data_beap_1_128cbr.mp3"),
                    await this.audioManager.loadBuffer("assets/audio/data_beap_2_128cbr.mp3"),
                    await this.audioManager.loadBuffer("assets/audio/data_beap_3_128cbr.mp3"),
                    await this.audioManager.loadBuffer("assets/audio/data_beap_4_128cbr.mp3")
                ]

                const phrases = [
                    `Hi, I am a developer/producer based in Rome.<br><br>`,
                    `This is an experimental website for my musical project LUDIK, I will add content as soon as available. Hope you will find something interesting!<br><br>`,
                    `For info, collaborations or just to say hi, feel free to `
                ]

                const appendGetInTouchLink = () => {

                    const elem = $("<span>get in touch! (ツ)_.\\m/</span>")
                        .css({color: "#1EA4F9"})
                        .hover(function () {
                            elem.css({color: "white", cursor: "pointer"})
                        }, function () {
                            elem.css({color: "#1EA4F9", cursor: "auto"})
                        })

                    const onClick = () => {
                        console.log("Scrolling!")
                        $("#homeFooter")[0].scrollIntoView({behavior: "smooth", block: "center"})
                    }

                    eventManager.addDomEvent(elem[0], "click", onClick)

                    elem.appendTo(homeConsoleMessage).hide().fadeIn(1000)

                }

                const playPhrase = async (phrase) => {

                    let char
                    homeConsoleMessage.html(message)

                    for (let i = 0; i < phrase.length; ++i) {

                        if (this.reloadTyping) {
                            return
                        }

                        char = phrase.charAt(i)

                        // Assumes an html tag
                        if (char === "<") {
                            const j = phrase.substr(i).indexOf(">")
                            char += phrase.substr(i + 1, j)
                            i += j
                        }

                        message += char
                        const buffer = buffers[i % buffers.length]
                        const sound = this.audioManager.createSoundFromBuffer(buffer, soundVolume)
                        char !== " " && sound.start()
                        homeConsoleMessage.html(message)

                        switch (char) {

                            case ",":
                            case ":":
                            case ";":
                                await wait(phraseTimeoutShort)
                                break

                            case ".":
                            case "!":
                            case "?":
                                await wait(phraseTimeoutLong)
                                break

                            default:
                                await wait(charTimeout)

                        }
                    }

                }

                for (let phrase of phrases) {
                    if (!this.reloadTyping) {
                        await playPhrase(phrase)
                    }
                }

                appendGetInTouchLink()

                // Trigger animation only the first time
                this.isInitialized = true

            },

            reloadConsoleMessage () {

                const phraseTimeout = 200

                this.reloadTyping = true

                setTimeout(async () => {
                    await this.displayConsoleMessage()
                }, phraseTimeout)
            },

            init () {

                this.audioManager = new AudioManager()
                this.isInitialized = false

            }

        },

        mounted () {

            this.init()

        },

        beforeDestroy () {

            eventManager.removeBusEvents()
            eventManager.removeDomEvents()

        }

    }
</script>

<style scoped lang="scss">

    @import "home-style";

    #homeConsole {
        position: relative;
        min-width: 100vw;
        padding: $home-wide-padding/2  $home-wide-padding;
        min-height: 16em;

        @include linear-gradient(
                        20deg,
                        rgba($scifi-cyan-hover, 0.1) 0%,
                        rgba($scifi-cyan-hover, 0.1) 35%,
                        rgba(lighten($scifi-cyan-hover, 70), 0.3) 45%,
                        rgba($scifi-cyan-hover, 0.1) 55%,
                        rgba($scifi-cyan-hover, 0.1) 100%
        );

        @include narrow-screen {
            padding: $home-narrow-padding;
            padding-top: 2 * $home-narrow-padding;
        };


        @include smartphone-portrait {
            min-height: 20em;
        };
    }

    .home-console-text {
        font-size: 1em;
        line-height: 1.2em;
        color: lighten($scifi-cyan-hover, 35);
        text-align: left;
        text-justify: none;
    }

    #homeConsoleReload {
        display: block;
        position: absolute;
        top: 1em;
        right: 1em;
        width: 2em;
        height: 2em;
        opacity: 0.7;

        &:hover {
            opacity: 1;
            cursor: pointer;
        }

        @include narrow-screen {
            top: calc(1em / 2);
            right: calc(1em / 2);
            width: 1.5em;
            height: 1.5em;
        }
    }

</style>