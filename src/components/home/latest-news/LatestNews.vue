<template>
    <div id="latestNews" class="home-root">
        <span class="home-title">{{title}}</span>
        <div class="home-content">
                <div class="home-news home-text">
                    <img src="../../../../assets/images/icons/icons8-casco-da-astronauta-filled-50.png" class="news-icon" alt="">
                    Positron - Chapter 1 is now available on
                    <a href="https://song.link/album/s/3Y57dyjCLUsXUTmJwTE3Zt" target="_blank" class="home-link">all platforms!</a>
                </div>
                <div class="home-news home-text">
                    <img src="../../../../assets/images/icons/icons8-casco-da-astronauta-filled-50.png" class="news-icon" alt="">
                    Check out my
                    <a href="https://www.youtube.com/watch?v=o3JejEe-Sfk&list=PLBrmlueR-NQ3_xSNwpY1T4fethgCEhoN7" target="_blank" class="home-link">new playlist on youtube!</a>
                    <br><br>
                    <div class="iframe-wrapper">
                        <iframe id="positronCh1YoutubePlaylist" src="https://www.youtube.com/embed/videoseries?list=PLBrmlueR-NQ3_xSNwpY1T4fethgCEhoN7" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                </div>
                <div class="home-news home-text">
                    <img src="../../../../assets/images/icons/icons8-casco-da-astronauta-filled-50.png" class="news-icon" alt="">
                    My first album Positron - Chapter 1 has been released.
                    <a href="https://open.spotify.com/album/3Y57dyjCLUsXUTmJwTE3Zt?si=zJju7DWhS9S-0vie9pqB_g" target="_blank" class="home-link">Listen on Spotify!</a>
                    <br><br>
                    <p class="home-text-description justify-text">[Positron - Chapter 1 is set in a post apocalyptic future. A young woman wakes up in an underground laboratory, surrounded by strange machinery. Upon reaching the surface, she finds a world in ruins...a world where the human beings are no longer in control.
                        <router-link :to="{name: 'Albums', params: {scroll: true}}" class="home-link">Discover more about Positron - Chapter 1...</router-link>]</p>
                </div>
        </div>
    </div>
</template>

<script>

    import { states, mutations } from "../../../store/storeUtils"

    export default {

        name: "LatestNews",

        props: {
            scroll: {
                type: Boolean,
                default: false
            }
        },

        data () {
            return {
                title: "LATEST NEWS"
            }
        },

        mounted () {

            if (this.scroll) {

                $("#latestNews .home-title")[0].scrollIntoView({behavior: "smooth", block: "center"})

            }
        }

    }
</script>

<style scoped lang="scss">

    @import "../home-style";

    .home-news {
        width: 100%;

        margin-top: 1.5 * $home-wide-padding;

        @include narrow-screen {
            margin-top: 4 * $home-narrow-padding;
        }

        img.news-icon {
            position: relative;
            top: calc(1.5em / 4);
            margin-right: 4px;
            width: 1.5em;
            height: 1.5em;
            opacity: 0.7;
        }
    }

    .iframe-wrapper {
        position: relative;
        padding-bottom: 56.25%; /* 16:9 */
        padding-top: 25px;
        height: 0;

        iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
    }

</style>