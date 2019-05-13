<template>
    <div>
        <div id="hamburger">
            <span></span>
            <span></span>
            <span></span>
        </div>

        <nav id="myMenu">
            <ul id="menu-list">
                <li class="mymenu-link" v-on:click="onHomeClick"><a>Home</a></li>
                <li class="mymenu-link" v-on:click="onAlbumsClick"><a>Albums</a></li>
                <li class="mymenu-link" v-on:click="onSinglesClick"><a>Singles</a></li>
                <li class="mymenu-link" v-on:click="onAboutClick"><a>About</a></li>
                <li class="mymenu-link" v-on:click="onSpaceshipClick"><a>Spaceship</a></li>
            </ul>
        </nav>
    </div>
</template>

<script>

    import { states, mutations } from "../../store/storeUtils"
    import EventManager from "../shared/EventManager"
    import "../../../src/libs/mmenu-js_8.0.6/dist/mmenu.js"
    import "../../../src/libs/mmenu-js_8.0.6/dist/mmenu.css"
    import "../../../src/libs/mmenu-js_8.0.6/dist/extensions/positioning/mmenu.positioning.css"

    export default {

        name: "Mmenu",

        methods: {

            onHomeClick () {

                this.mmenu.close()
                this.$router.push({name: "LatestNews", params: {scroll: true}})

            },

            onAlbumsClick () {

                this.mmenu.close()
                this.$router.push({name: "Albums", params: {scroll: true}})

            },

            onSinglesClick () {

                this.mmenu.close()
                this.$router.push({name: "Singles", params: {scroll: true}})

            },

            onAboutClick () {

                this.mmenu.close()
                this.$router.push({name: "About", params: {scroll: true}})

            },

            onSpaceshipClick () {

                this.mmenu.close()
                this.$store.commit(mutations.homeState, states.home.stop)
                this.$store.commit(mutations.worldState, states.world.start)

            },

            init () {

                const hamburgerBtn = document.getElementById("hamburger")

                this.eventManager = new EventManager()

                this.mmenu = new Mmenu(

                    document.getElementById("myMenu"),

                    {
                        extensions: [
                            "position-left",
                            "position-front"
                        ],

                        hooks: {

                            "open:finish": () => {

                                setTimeout(function () {
                                    hamburgerBtn.classList.add("open-translate")

                                    setTimeout(function () {
                                        hamburgerBtn.classList.add("open-rotate")
                                    }, 200)

                                }, 0)

                            },

                            "close:finish": () => {

                                setTimeout(function () {
                                    hamburgerBtn.classList.remove("open-rotate")

                                    setTimeout(function () {
                                        hamburgerBtn.classList.remove("open-translate")
                                    }, 200)

                                }, 0)

                            }
                        }
                    }
                )

                const onHamburgerClick = (e) => {

                    this.mmenu.open()
                    e.preventDefault()
                    e.stopPropagation()

                }

                this.eventManager.addDomEvent(hamburgerBtn, "click", onHamburgerClick)

            }

        },

        mounted () {

            this.init()

        },

        beforeDestroy () {

            this.eventManager.removeDomEvents()
            this.eventManager.removeBusEvents()

        }
    }
</script>

<style scoped lang="scss">

    @import "../../styles/helpers/variables";
    @import "../../styles/helpers/mixins";

    .mymenu-link {
        &:hover {
            cursor: pointer;
        }
    }

    #hamburger {
        position: fixed;
        top: calc((#{$header-height} - #{$hamburger-height}) * 0.5);
        left: 0;
        margin-left: $hamburger-margin;
        margin-right: $hamburger-margin;
        width: $hamburger-width;
        height: $hamburger-height;
        cursor: pointer;
        z-index: 999;

        @include narrow-screen {
            top: calc((#{$header-height-smartphone} - #{$hamburger-height-smartphone}) * 0.5);
            margin-left: $hamburger-margin-smartphone;
            margin-right: $hamburger-margin-smartphone;
            width: $hamburger-width-smartphone;
            height: $hamburger-height-smartphone;
        }

        &:hover span {
            box-shadow: 0 0 4px white;

            @include narrow-screen {
                box-shadow: 0 0 2px white;
            }
        }

    }

    #hamburger span {
        display: block;
        position: absolute;
        height: 2px;
        width: 100%;
        background: #fff;
        left: 0;

        @include transition(all .2s linear);

        &:nth-child(2) {
            @include transition(width 0s .2s);
        }
    }

    #hamburger span:nth-child(1) {
        top: 0;
    }

    #hamburger span:nth-child(2) {
        top: calc((#{$hamburger-height} - 2px) * 0.5);

        @include narrow-screen {
            top: calc((#{$hamburger-height-smartphone} - 2px) * 0.5);
        }
    }

    #hamburger span:nth-child(3) {
        top: calc(#{$hamburger-height} - 2px);

        @include narrow-screen {
            top: calc(#{$hamburger-height-smartphone} - 2px);
        }
    }

    #hamburger.open-translate span:nth-child(1) {
        top: calc((#{$hamburger-height} - 2px) * 0.5);

        @include narrow-screen {
            top: calc((#{$hamburger-height-smartphone} - 2px) * 0.5);
        }
    }


    #hamburger.open-rotate span:nth-child(1) {
        @include rotate(45);
    }

    #hamburger.open-translate span:nth-child(2) {
        width: 0;
    }

    #hamburger.open-translate span:nth-child(3) {
        top: calc((#{$hamburger-height} - 2px) * 0.5);

        @include narrow-screen {
            top: calc((#{$hamburger-height-smartphone} - 2px) * 0.5);
        }
    }

    #hamburger.open-rotate span:nth-child(3) {
        @include rotate(-45);
    }

</style>
