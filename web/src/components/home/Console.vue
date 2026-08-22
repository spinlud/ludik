<template>
    <div id="homeConsole">
        <span id="homeConsoleMessage" ref="messageRef" class="home-console-text"></span>
        <img id="homeConsoleReload" ref="reloadRef" src="/assets/images/icons/icons8-ruota-a-destra-filled-50.png" alt="">
    </div>
</template>

<script setup>

    import { ref, onMounted, onBeforeUnmount } from "vue"
    import AudioManager from "../shared/AudioManager"
    import EventManager from "../shared/EventManager"
    import { wait } from "../shared/utils"

    const messageRef = ref(null)
    const reloadRef = ref(null)

    const eventManager = new EventManager()
    const audioManager = new AudioManager()

    let reloadTyping = false
    let isInitialized = false

    async function displayConsoleMessage () {

        // Fire-and-forget: the app boots into a visible Home without a user gesture, so the
        // AudioContext stays suspended and `resume()` would never settle. Don't block the
        // typing on it — the beeps stay silent until the first gesture (restored in #80).
        AudioManager.resume().catch(() => {})
        reloadTyping = false

        const homeConsoleMessage = messageRef.value
        const soundVolume = 0.01
        const charTimeout = 40
        const phraseTimeoutShort = 200 // , : ;
        const phraseTimeoutLong = 1000 // . ! ?
        let message = ""

        const buffers = [
            await audioManager.loadBuffer("/assets/audio/data_beap_1_128cbr.mp3"),
            await audioManager.loadBuffer("/assets/audio/data_beap_2_128cbr.mp3"),
            await audioManager.loadBuffer("/assets/audio/data_beap_3_128cbr.mp3"),
            await audioManager.loadBuffer("/assets/audio/data_beap_4_128cbr.mp3")
        ]

        const phrases = [
            `Hi, I am a developer/producer based in Rome.<br><br>`,
            `This is an experimental website for my musical project LUDIK, I will add content as soon as available. Hope you will find something interesting!<br><br>`,
            `For info, collaborations or just to say hi, feel free to `
        ]

        const appendGetInTouchLink = () => {

            const elem = document.createElement("span")
            elem.textContent = "get in touch! (ツ)_.\\m/"
            elem.style.color = "#1EA4F9"
            elem.style.opacity = "0"
            elem.style.transition = "opacity 1s ease-in-out"

            const onMouseEnter = () => {
                elem.style.color = "white"
                elem.style.cursor = "pointer"
            }

            const onMouseLeave = () => {
                elem.style.color = "#1EA4F9"
                elem.style.cursor = "auto"
            }

            const onClick = () => {
                const footer = document.getElementById("homeFooter")
                footer && footer.scrollIntoView({ behavior: "smooth", block: "center" })
            }

            eventManager.addDomEvent(elem, "mouseenter", onMouseEnter)
            eventManager.addDomEvent(elem, "mouseleave", onMouseLeave)
            eventManager.addDomEvent(elem, "click", onClick)

            homeConsoleMessage.appendChild(elem)
            // Trigger the fade-in on the next frame.
            requestAnimationFrame(() => { elem.style.opacity = "1" })

        }

        const playPhrase = async (phrase) => {

            let char
            homeConsoleMessage.innerHTML = message

            for (let i = 0; i < phrase.length; ++i) {

                if (reloadTyping) {
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
                if (char !== " ") {
                    try {
                        const buffer = buffers[i % buffers.length]
                        const sound = audioManager.createSoundFromBuffer(buffer, soundVolume)
                        sound.start()
                    } catch (e) {
                        // Ignore audio errors (e.g. suspended context) so typing continues.
                    }
                }
                homeConsoleMessage.innerHTML = message

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
            if (!reloadTyping) {
                await playPhrase(phrase)
            }
        }

        appendGetInTouchLink()

        // Trigger animation only the first time
        isInitialized = true

    }

    function reloadConsoleMessage () {

        const phraseTimeout = 200

        reloadTyping = true

        setTimeout(async () => {
            await displayConsoleMessage()
        }, phraseTimeout)
    }

    onMounted(() => {
        // Home boots directly visible while the World intro is stubbed, so start the
        // typing animation on mount instead of waiting for a homeState transition.
        if (!isInitialized) {
            setTimeout(displayConsoleMessage, 250)
            eventManager.addDomEvent(reloadRef.value, "click", reloadConsoleMessage)
        }
    })

    onBeforeUnmount(() => {
        eventManager.removeBusEvents()
        eventManager.removeDomEvents()
    })

</script>

<style scoped lang="scss">

    #homeConsole {
        position: relative;
        min-width: 100vw;
        padding: math.div($home-wide-padding, 2) $home-wide-padding;
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
