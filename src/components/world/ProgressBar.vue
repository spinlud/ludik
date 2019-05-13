<template>
    <div id="progressBar">

        <div id="outer">
            <div id="inner"></div>
        </div>

    </div>
</template>

<script>

    const TWEEN = require("@tweenjs/tween.js")

    export default {

        name: "ProgressBar",

        methods: {

            progress () {

                const fill = document.getElementById("inner")
                let v = 0

                let id = setInterval(() => {

                    if (v >= 100) {
                        clearInterval(id)
                        return
                    }

                    v += 1
                    fill.style.width = `${v}%`

                }, 50)

            },

            tween () {

                const fill = document.getElementById("inner")
                const from = {v: 0.0}

                new TWEEN.Tween(from)
                    .to({v: 100.0}, 4000)
                    .onUpdate(() => {
                        fill.style.width = `${from.v}%`
                    })
                    .start()

            }

        },

        mounted () {

            const animate = () => {

                requestAnimationFrame(animate)
                TWEEN.update()

            }

            animate()
            // this.progress()
            this.tween()
        }


    }
</script>

<style scoped lang="scss">

    @import "../../styles/base/reset";
    @import "../../styles/base/typography";
    @import "../../styles/helpers/variables";
    @import "../../styles/helpers/colors";
    @import "../../styles/helpers/mixins";

    #progressBar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: transparent;
    }

    #container {
        position: relative;
        width: 10em;
        top: 50%;
        left: 50%;
        transform: translate3d(-50%, -50%, 0);
    }


    #outer {
        display: block;
        position: fixed;
        bottom: 2em;
        left: calc(50% - 5em);
        width: 10em;
        height: 0.5em;
        background: transparent;
        border: 1px solid white;
        overflow: hidden;
        box-shadow: -2px 0 4px 0 rgba(white, 0.6);

        @include border-radius(0.4em);

        #inner {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 50%;
            box-shadow: 0 0 2px 1px white inset;
            @include linear-gradient(to bottom, $deep-cerulean)
        }
    }

</style>