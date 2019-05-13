<template>
    <div id="albums" class="home-root">
        <span class="home-title">{{title}}</span>
        <div class="home-content">
            <ul>
                <li class="album-li" v-for="album in albums">
                    <img v-bind:src="album.artwork" alt="" class="album-artwork"><!-- important to remove spaces for inline-block
                    --><div v-html="album.spotify_iframe" class="iframe-wrapper"></div>
                    <div class="album-metadata">
                        <br><br>
                        <span class="album-title">{{album.title}}</span>
                        <br><br>
                        <span class="album-release">{{album.releaseDate}}</span>
                        <br><br>
                        <span class="home-text justify-text"><p>{{album.description}}</p></span>
                        <br><br>
                        <p class="album-link">
                            {{album.title}} is now <a v-bind:href="album.link" target="_blank">available on all platforms!</a>
                        </p>

                        <ul>
                            <li v-for="track in album.tracks" class="justify-text">
                                <div class="album-track-header">
                                    <div v-html="track.spotify_iframe" class="iframe-track-wrapper"></div>
                                </div>
                                <span class="home-text">{{track.description}}</span>
                            </li>
                        </ul>

                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>

    import { states, mutations } from "../../../store/storeUtils"

    export default {
        name: "Albums",

        props: {
            scroll: {
                type: Boolean,
                default: false
            }
        },

        data () {
            return {
                title: "ALBUMS",

                albums: [
                    {
                        title: "Positron - Chapter 1",
                        releaseDate: "01-2019",
                        spotify_iframe: `<iframe id="positronCh1IFrame" class="spotify-iframe" src="https://open.spotify.com/embed/album/3Y57dyjCLUsXUTmJwTE3Zt" width="100%" height="100%" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`,
                        artwork: "assets/images/albums/positron-ch1/Positron_Ch1_artwork_512_web.png",
                        description: `Positron is set in a post apocalyptic future. A young woman wakes up in an underground laboratory, surrounded by strange machinery. Upon reaching the surface, she finds a world in ruins...a world where the human beings are no longer in control.
                                    Along the path across the planet to gather information about her identity, she'll soon find out how much she is different from a normal human being and her key role in the fierce conflict which is devastating the world...`,
                        link: "https://song.link/album/s/3Y57dyjCLUsXUTmJwTE3Zt",
                        linkDisplay: "https://song.link/album/positron-chapter-1",

                        tracks: [
                            {
                                index: 0,
                                title: "Awake",
                                spotify_iframe: `<iframe src=\"https://open.spotify.com/embed/track/4Ip3bxWGYzm1YkeivvHVoc\" width="100%" height="100%" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`,
                                description: `In an empty, dark, underground laboratory suddenly a low hum signals power coming on. In the center of the room a young woman immersed in a liquid inside a life pod wakes up. She has no idea who she is or how she got there, all she can remembers is her name: Rebecca. Eventually she finds a way out to reach the surface: all around stands a post apocalyptic world completely in ruins.`
                            },
                            {
                                index: 1,
                                title: "Struggle",
                                spotify_iframe: `<iframe src="https://open.spotify.com/embed/track/743DsAWoKpPWxy2hyime1N" width="100%" height="100%" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`,
                                description: `While Rebecca explores this new world she is suddenly attacked by hostile biomechanical entities. To her surprise, she discovers she has fighting skills and eventually defeats them in combat.`
                            },
                            {
                                index: 2,
                                title: "Hunted",
                                spotify_iframe: `<iframe src="https://open.spotify.com/embed/track/38CooKBVpEYc5vysUyiweM" width="100%" height="100%" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`,
                                description: `As a result of defeating the biomechs they call reinforcements and start hunting her. Rebecca is forced to go on the run, not knowing why she has been attacked. Whilst on the run, Rebecca comes to realize that wherever she looks she is confronted by utter devastation. Eventually she is able to give the biomechs the slip.`
                            },
                            {
                                index: 3,
                                title: "Humans",
                                spotify_iframe: `<iframe src="https://open.spotify.com/embed/track/0P29QTywwRgmB4XQqUZisp" width="100%" height="100%" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`,
                                description: `Rebecca is found by an expeditionary force of humans. Unable to answer any of their questions, she is forced to follow them to their base. Upon arriving, Rebecca finds a very militarized city, occupied by the last surviving humans.`
                            },
                            {
                                index: 4,
                                title: "H-Tower",
                                spotify_iframe: `<iframe src="https://open.spotify.com/embed/track/5aO6mwqbmjKGDA5XS2LWnp" width="100%" height="100%" frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe>`,
                                description: `Looking for answers about herself in the human city, Rebecca finally meets a strange guy who suggests to her she finds the high-tech center known as H-Tower, where she will probably find answers to her questions. Helped by this guy, Rebecca eventually finds this mysterious building and starts the ascent: will she find the answers she is looking for?`
                            },
                        ]
                    }
                ]
            }
        },

        async mounted () {

            if (this.scroll) {

                $("#albums .home-title")[0].scrollIntoView({behavior: "smooth", block: "center"})

            }

        }
    }
</script>

<style scoped lang="scss">

    @import "../home-style";

    .album-li {
        display: block;
        margin-top: $home-wide-padding;
    }

    .iframe-wrapper {
        display: inline-block;
        width: calc( (100vw - 3 * #{$home-wide-padding}) * 0.5 );
        height: calc( (100vw - 3 * #{$home-wide-padding}) * 0.5 );

        @include narrow-screen {
            display: block;
            width: 100%;
            height: 350px;
        }
    }

    .album-artwork {
        display: inline-block;
        width: calc( (100vw - 3 * #{$home-wide-padding}) * 0.5 );
        height: calc( (100vw - 3 * #{$home-wide-padding}) * 0.5 );

        @include narrow-screen {
            display: block;
            width: 100%;
            height: auto;
        }
    }

    .album-metadata {
        position: relative;
        top: -4px;
        padding-top: 4px;
        padding-left: 1em;
        padding-right: 1em;
        padding-bottom: $home-wide-padding;
        width: 100%;
        color: lighten($silver-chalice2, 10%);
        background: black;

        .album-title {
            font-size: 1.5em;
            color: #fff;

            @include narrow-screen {
                font-size: 1.3em;
            }
        }

        .album-release {
            font-size: 1em;
            color: rgba(#fff, 0.6);
        }

        .album-link {
            font-size: 1em;
            line-height: 1.5em;
            text-align: left;
            text-justify: none;
        }

        a {
            text-decoration: none;
            color: $scifi-cyan-hover;

            &:hover {
                color: lighten($scifi-cyan-hover, 60%);
                text-shadow: 0 0 2px lighten($scifi-cyan-hover, 60%);
            }
        }
    }

    .iframe-track-wrapper {
        display: inline-block;
        width: calc( (100vw - 3 * #{$home-wide-padding}) * 0.5 );
        height: 6.5em;

        @include narrow-screen {
            display: block;
            width: 100%;
        }
    }

    .album-track-header {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        margin-top: 2em;
        margin-bottom: 0.5em;
    }

    .album-track-title {
        font-size: 1.2em;
        color: #fff;
        margin-left: 1em;
    }

</style>