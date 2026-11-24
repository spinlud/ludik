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
                <li class="mymenu-link" v-on:click="onDjSetsClick"><a>DJ Sets</a></li>
                <li class="mymenu-link" v-on:click="onAboutClick"><a>About</a></li>
                <li class="mymenu-link" v-on:click="onSpaceshipClick"><a>Spaceship</a></li>
            </ul>
        </nav>
    </div>
</template>

<script setup>

    import { onMounted, onBeforeUnmount } from "vue"
    import { useRouter } from "vue-router"
    import Mmenu from "mmenu-js"
    import "mmenu-js/dist/mmenu.css"
    import { useAppStore } from "@/stores/app"
    import { states } from "@/stores/storeUtils"
    import EventManager from "../shared/EventManager"

    const router = useRouter()
    const store = useAppStore()

    let mmenu = null
    let eventManager = null

    function onHomeClick () {
        mmenu.close()
        router.push({ name: "LatestNews", query: { scroll: "true" } })
    }

    function onAlbumsClick () {
        mmenu.close()
        router.push({ name: "Albums", query: { scroll: "true" } })
    }

    function onSinglesClick () {
        mmenu.close()
        router.push({ name: "Singles", query: { scroll: "true" } })
    }

    function onDjSetsClick () {
        mmenu.close()
        router.push({ name: "DjSets", query: { scroll: "true" } })
    }

    function onAboutClick () {
        mmenu.close()
        router.push({ name: "About", query: { scroll: "true" } })
    }

    function onSpaceshipClick () {
        mmenu.close()
        store.changeHomeState(states.home.stop)
        store.changeWorldState(states.world.start)
    }

    function init () {

        const hamburgerBtn = document.getElementById("hamburger")

        eventManager = new EventManager()

        mmenu = new Mmenu(
            "#myMenu",
            {
                // v8 extensions ["position-left", "position-front"] map to the
                // single v9 offCanvas position "left-front".
                offCanvas: {
                    position: "left-front"
                },

                hooks: {

                    "open:after": () => {

                        setTimeout(function () {
                            hamburgerBtn.classList.add("open-translate")

                            setTimeout(function () {
                                hamburgerBtn.classList.add("open-rotate")
                            }, 200)

                        }, 0)

                    },

                    "close:after": () => {

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
            mmenu.open()
            e.preventDefault()
            e.stopPropagation()
        }

        eventManager.addDomEvent(hamburgerBtn, "click", onHamburgerClick)

    }

    onMounted(() => {
        init()
    })

    onBeforeUnmount(() => {
        eventManager && eventManager.removeDomEvents()
        eventManager && eventManager.removeBusEvents()
    })

</script>

<style scoped lang="scss">

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
