<template>
    <div id="homeClose">
        <div id="homeCloseButton" v-on:click="onClick">
            <span></span>
            <span></span>
        </div>
    </div>
</template>

<script>

    import { states, mutations } from "../../store/storeUtils"

    export default {

        name: "HomeClose",

        methods: {

            onClick () {

                this.$store.commit(mutations.homeState, states.home.stop)
                this.$store.commit(mutations.worldState, states.world.start)

            }

        }
    }
</script>

<style scoped lang="scss">

    @import "../../styles/helpers/variables";
    @import "../../styles/helpers/colors";
    @import "../../styles/helpers/mixins";

    #homeClose {
        position: fixed;
        top: 0;
        right: 0;
        margin: 0;

        width: $header-height;
        height: $header-height;
        line-height: $header-height;
        text-align: center;
        -moz-box-sizing: border-box;
        box-sizing: border-box;
        // background: red;

        @include narrow-screen {
            height: $header-height-smartphone;
            line-height: $header-height-smartphone;
        }

        z-index: 999;

    }

    #homeCloseButton {
        position: absolute;
        top: calc((#{$header-height} - #{$hamburger-height}) * 0.5);
        right: $hamburger-margin;
        width: $hamburger-width;
        height: $hamburger-height;

        // background: #333;

        cursor: pointer;

        @include narrow-screen {
            top: calc((#{$header-height-smartphone} - #{$hamburger-height-smartphone}) * 0.5);
            right: $hamburger-margin-smartphone;
            width: $hamburger-width-smartphone;
            height: $hamburger-height-smartphone;
        }

        span {
            display: block;
            position: absolute;
            top: 50%;
            left: 0;
            height: 2px;
            width: 100%;
            background: white;

            &:nth-child(1) {
                @include rotate(-45);
            }

            &:nth-child(2) {
                @include rotate(45);
            }
        }

        &:hover span {
            box-shadow: 0 0 4px white;

            @include narrow-screen {
                box-shadow: 0 0 2px white;
            }

            &:nth-child(1) {
                @include animation(0, 2s, spin1)
            }

            &:nth-child(2) {
                @include animation(0, 2s, spin2)
            }
        }
    }

    @include keyframes(spin1) {
        from {
            @include rotate(45)
        }
        to {
            @include rotate(225)
        }
    }

    @include keyframes(spin2) {
        from {
            @include rotate(-45)
        }
        to {
            @include rotate(135)
        }
    }

</style>