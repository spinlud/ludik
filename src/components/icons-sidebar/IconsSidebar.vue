<template>

    <div id="iconsSidebar" v-bind:class="{'sidebar-close': !isSidebarOpen}">
        <div id="iconsSidebarHandle">
            <div id="iconsSidebarHandleIcon" v-on:click="toggleSidebar" v-bind:class="{'close-handle': isSidebarOpen, 'open-handle': !isSidebarOpen}"></div>
        </div>
        <a href="https://open.spotify.com/artist/0lMpvELTTsVuCMeAQWuzpN?si=6dWnTikrTvS5DcjY-2MKgg" target="_blank" id="spotifyLink" class="icon-link"></a>
        <a href="https://www.youtube.com/playlist?list=PLBrmlueR-NQ3_xSNwpY1T4fethgCEhoN7" target="_blank" id="youtubeLink" class="icon-link"></a>
        <a href="https://twitter.com/LUDIK02229712" target="_blank" id="twitterLink" class="icon-link"></a>
        <a href="https://www.facebook.com/LUDIK-363454581126098" target="_blank" id="facebookLink" class="icon-link"></a>
        <a href="https://www.instagram.com/ludik.music/?hl=it" target="_blank" id="instagramLink" class="icon-link"></a>
        <a href="mailto:ludovico.fabbri@gmail.com" target="_blank" id="mailLink" class="icon-link"></a>
        <a href="" target="_blank" id="githubLink" class="icon-link"></a>
    </div>

</template>

<script>
    export default {
        name: "IconsSidebar",

        data () {
            return {
                isSidebarOpen: false
            }
        },

        methods: {

            toggleSidebar () {
                this.isSidebarOpen = !this.isSidebarOpen
            }

        }
    }
</script>

<style scoped lang="scss">

    @import "../../styles/base/reset";
    @import "../../styles/base/typography";
    @import "../../styles/helpers/variables";
    @import "../../styles/helpers/colors";
    @import "../../styles/helpers/mixins";

    #iconsSidebar {
        position: fixed;
        top: 2 * $header-height;
        right: 0;

        display: flex;
        flex-direction:column;
        justify-content:space-around;
        align-items: center;

        margin-top: auto;
        margin-bottom: auto;

        width: $sidebar-width;
        height: calc(100vh - 4 * #{$header-height});

        background: rgba(black, 0.4);

        @include border-radius(1em 0 0 1em);

        @include transition(0.8s ease-in-out);

        @include narrow-screen {
            display: none;
        }

        z-index: 4;
    }

    .sidebar-close {
        @include transform(translate(#{$sidebar-width}, 0));
    }

    #iconsSidebarHandle {
        position: absolute;
        top: calc(50% - #{$sidebar-handle-height} * 0.5);
        left: -$sidebar-handle-width;

        display: flex;
        align-items: center;
        justify-content: center;

        width: $sidebar-handle-width;
        height: $sidebar-handle-height;

        background: rgba(black, 0.4);

        @include border-radius(1em 0 0 1em);
    }

    #iconsSidebarHandleIcon {
        display: block;
        border: 0;
        padding: 0;
        width: 2em;
        height: 2em;

        background-size:     cover;
        background-repeat:   no-repeat;
        background-position: center center;

        opacity: 0.4;

        &:hover {
            opacity: 1;
            cursor: pointer;
        }
    }

    .close-handle {
        background-image: url(../../../assets/images/icons/icons8-double-right-50.png);
    }

    .open-handle {
        background-image: url(../../../assets/images/icons/icons8-double-left-50.png);
    }

    .icon-link {

        width: 2em;
        height: 2em;

        background-size:     cover;
        background-repeat:   no-repeat;
        background-position: center center;

        opacity: 0.4;

        &:hover {
            opacity: 1;
        }

    }

    #spotifyLink {
        background-image: url(../../../assets/images/icons/icons8-spotify-filled-50.png);
    }

    #youtubeLink {
        background-image: url(../../../assets/images/icons/icons8-youtube-squared-50.png);
    }

    #twitterLink {
        background-image: url(../../../assets/images/icons/icons8-twitter-squared-filled-50.png);
    }

    #facebookLink {
        background-image: url(../../../assets/images/icons/icons8-facebook-circled-filled-50.png);
    }

    #instagramLink {
        background-image: url(../../../assets/images/icons/icons8-instagram-filled-50.png);
    }

    #mailLink {
        background-image: url(../../../assets/images/icons/icons8-post-filled-50.png);
    }

    #githubLink {
        background-image: url(../../../assets/images/icons/icons8-github-filled-50.png);
    }

</style>