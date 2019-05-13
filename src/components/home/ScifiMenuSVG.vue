<template>
    <svg v-bind:id="`${route.id}`" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
         x="0px" y="0px"
         viewBox="0 0 1000 1000" style="enable-background:new 0 0 1000 1000;" xml:space="preserve">

        <defs>

            <filter id="red-glow" filterUnits="userSpaceOnUse"
            x="-50%" y="-50%" width="200%" height="200%">
                <!-- blur the text at different levels-->
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur5"/>
                <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur10"/>
                <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur20"/>
                <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur30"/>
                <feGaussianBlur in="SourceGraphic" stdDeviation="50" result="blur50"/>
                <!-- merge all the blurs except for the first one -->
                <feMerge result="blur-merged">
                <feMergeNode in="blur10"/>
                <feMergeNode in="blur20"/>
                <feMergeNode in="blur30"/>
                <feMergeNode in="blur50"/>
                </feMerge>
                <!-- recolour the merged blurs red-->
                <feColorMatrix result="red-blur" in="blur-merged" type="matrix"
                    values="1 0 0 0 0
                    0 0.06 0 0 0
                    0 0 0.44 0 0
                    0 0 0 1 0"></feColorMatrix>
                <feMerge>
                <feMergeNode in="red-blur"/>       <!-- largest blurs coloured red -->
                <feMergeNode in="blur5"/>          <!-- smallest blur left white -->
                <feMergeNode in="SourceGraphic"/>  <!-- original white text -->
                </feMerge>
            </filter>

            <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>

        <!-- Stroke ring -->
        <circle class="ring st0" cx="500" cy="500" r="302.8">
            <!--<animateTransform attributeType="xml"-->
            <!--attributeName="transform"-->
            <!--type="rotate"-->
            <!--from="0 500 500"-->
            <!--to="360 500 500"-->
            <!--dur="100s"-->
            <!--repeatCount="indefinite"></animateTransform>-->
        </circle>

        <!-- Inner ring -->
        <circle class="ring st1" cx="500" cy="500" r="237.7">
            <animateTransform attributeType="xml"
                              attributeName="transform"
                              type="rotate"
                              from="0 500 500"
                              to="360 500 500"
                              dur="40s"
                              repeatCount="indefinite"></animateTransform>
        </circle>

        <!-- Outer ring -->
        <circle class="ring st2" cx="500" cy="500" r="366.8" transform="rotate(0 500 500)">
            <animateTransform attributeType="xml"
                              attributeName="transform"
                              type="rotate"
                              from="0 500 500"
                              to="-360 500 500"
                              dur="50s"
                              repeatCount="indefinite"></animateTransform>
        </circle>

        <!-- Outer thin ring -->
        <circle class="ring st3" cx="500" cy="500" r="385.1"></circle>

        <text class="svg-text" x="50%" y="50%" text-anchor="middle" dy=".3em">{{route.displayName}}</text>

    </svg>
</template>

<script>

    import EventManager from "../shared/EventManager"
    const eventManager = new EventManager()
    const TAG = "[ScifiMenuSVG]"

    export default {

        name: "ScifiMenuSVG",

        props: [
            "route"
        ],

        mounted () {

            const onClick = () => {
                // this.$router.push(this.route.path)
                this.$router.push({name: this.route.name, params: {scroll: true}})
            }

            eventManager.addDomEvent(this.$el, "click", onClick)

        }
    }

</script>

<style scoped lang="scss">

    @import "../../styles/base/reset";
    @import "../../styles/base/typography";
    @import "../../styles/helpers/variables";
    @import "../../styles/helpers/colors";
    @import "../../styles/helpers/mixins";

    svg {
        display: block;
        position: relative;
        left: 35vw;
        width: 30vw;
        height: 30vw;

        @include smartphone-portrait {
            left: 20vw;
            width: 60vw;
            height: 60vw;
        }

        &:hover {
            cursor: pointer;
        }

        &:hover .ring {
            stroke: lighten($scifi-cyan-hover, 30%) !important;
            filter: url(#glow);
        }

        &:hover .st0 {
            stroke: lighten($scifi-cyan-hover, 50%) !important;
            animation-play-state: running;
        }

        &:hover .svg-text {
            stroke: lighten($scifi-cyan-hover, 60%);
            filter: url(#glow);
        }
    }

    .st0, .st1, .st2, .st3 {
        fill: none;
        stroke-width: 42;
        stroke-miterlimit: 10;
    }

    .st0 {
        stroke: lighten($scifi-cyan-hover, 15%);
        stroke-dasharray: 12.1947,12.1947,12.1947,12.1947,12.1947,12.1947;

        animation-name: spin;
        animation-duration: 10000ms;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
        transform-origin: 500px 500px;
        animation-play-state: paused;
    }

    .st1 {
        stroke: $scifi-cyan-hover;
        stroke-dasharray: 50,90,200,30,40,0;
    }

    .st2 {
        stroke: $scifi-cyan-hover;
        stroke-linecap: square;
        stroke-dasharray: 120, 20, 110, 20, 140;
    }

    .st3 {
        stroke: $scifi-cyan-hover;
        stroke-width: 16;
        stroke-linecap: square;
    }

    /*svg:hover .st0 {*/
        /*animation-play-state: running;*/
    /*}*/

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(-360deg);
        }
    }

    .svg-text {
        margin: auto;
        font-size: 4em;
        /*font-family: outerspace-militia;*/
        font-family: neuropol;
        fill: lighten($scifi-cyan-hover, 40%);
    }


</style>