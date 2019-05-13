<template>
    <div id="scifiMenu">

        <div id="verticalLineLeft" class="vertical-line"></div>
        <div id="verticalLineRight" class="vertical-line"></div>
        <div id="scifiMenuOverlay"></div>

        <ul>
            <li v-for="route in routes">
                <scifi-menu-svg v-bind:route="route"></scifi-menu-svg>
            </li>
        </ul>

    </div>
</template>

<script>

    import ScifiMenuSVG from "./ScifiMenuSVG.vue"

    export default {

        name: "ScifiMenu",

        components: {

            scifiMenuSvg: ScifiMenuSVG

        },

        data () {
            return {

                title: "L U D I K",

                routes: [
                    {
                        id: "homeRoute",
                        path: "/",
                        name: "LatestNews",
                        displayName: "Home"
                    },
                    {
                        id: "albumsRoute",
                        path: "albums",
                        name: "Albums",
                        displayName: "Albums"
                    },
                    {
                        id: "singlesRoute",
                        path: "singles",
                        name: "Singles",
                        displayName: "Singles"
                    },
                    {
                        id: "abouteRoute",
                        path: "about",
                        name: "About",
                        displayName: "About"
                    },
                ]
            }
        },
    }
</script>

<style scoped lang="scss">

    @import "../../styles/base/reset";
    @import "../../styles/base/typography";
    @import "../../styles/helpers/variables";
    @import "../../styles/helpers/colors";
    @import "../../styles/helpers/mixins";

    #scifiMenu {
        position: relative;
        width: 100vw;
    }

    .vertical-line {
        width: 1px;
        height: 100%;
        background: $scifi-cyan-hover;
        @include box-shadow(0, 0, 4px, lighten($scifi-cyan-hover, 30%));
    }

    #verticalLineLeft {
        position: absolute;
        top: 0;
        left: 25vw;

        @include smartphone-portrait {
            left: 12.5vw;
        }
    }

    #verticalLineRight {
        position: absolute;
        top: 0;
        right: 25vw;

        @include smartphone-portrait {
            right: 12.5vw;
        }
    }

    #scifiMenuOverlay {
        position: absolute;
        top: 0;
        left: calc(25vw + 1px);
        width: calc(50vw - 2px);
        height: 100%;
        background: rgba(black, $home-bg-opacity);

        @include smartphone-portrait {
            left: calc(12.5vw + 1px);
            width: calc(100vw - 25vw - 2px);
        }
    }

</style>