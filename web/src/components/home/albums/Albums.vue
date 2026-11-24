<template>
    <div id="albums" class="home-root">
        <span class="home-title">{{title}}</span>
        <div class="home-content">
            <ul>
                <ReleaseEntry v-for="album in albums" :key="album.title"
                    :title="album.title" :release-date="album.releaseDate" :artwork="album.artwork"
                    :player="album.player" :description="album.description">
                    <ul class="album-tracks">
                        <li v-for="track in album.tracks" :key="track.index" class="justify-text">
                            <span class="album-track-title">{{track.index + 1}}. {{track.title}}</span>
                            <div v-if="layoutB" class="album-track-player">
                                <iframe :src="soundcloudPlayerSrc(track.player, { visual: false })" :title="track.title" width="100%" height="100%" frameborder="no" scrolling="no" allow="autoplay"></iframe>
                            </div>
                            <span class="home-text">{{track.description}}</span>
                        </li>
                    </ul>
                </ReleaseEntry>
            </ul>
        </div>
    </div>
</template>

<script setup>

    import { computed, onMounted } from "vue"
    import { useRoute } from "vue-router"
    import ReleaseEntry from "../release/ReleaseEntry.vue"
    import { soundcloudPlayerSrc } from "../release/soundcloud.js"

    const props = defineProps({
        scroll: {
            type: Boolean,
            default: false
        }
    })

    const title = "ALBUMS"

    // Layout (b) adds a compact SoundCloud player under each track.
    const route = useRoute()
    const layoutB = computed(() => route.query.layout === "b")

    const albums = [
        {
            title: "Positron - Chapter 1",
            releaseDate: "01-2019",
            player: "playlists/687008079",
            artwork: "/assets/images/albums/positron-ch1/Positron_Ch1_artwork_512_web.png",
            description: `Positron is set in a post apocalyptic future. A young woman wakes up in an underground laboratory, surrounded by strange machinery. Upon reaching the surface, she finds a world in ruins...a world where the human beings are no longer in control.
                        Along the path across the planet to gather information about her identity, she'll soon find out how much she is different from a normal human being and her key role in the fierce conflict which is devastating the world...`,

            tracks: [
                {
                    index: 0,
                    title: "Awake",
                    player: "tracks/559868439",
                    description: `In an empty, dark, underground laboratory suddenly a low hum signals power coming on. In the center of the room a young woman immersed in a liquid inside a life pod wakes up. She has no idea who she is or how she got there, all she can remembers is her name: Rebecca. Eventually she finds a way out to reach the surface: all around stands a post apocalyptic world completely in ruins.`
                },
                {
                    index: 1,
                    title: "Struggle",
                    player: "tracks/559868427",
                    description: `While Rebecca explores this new world she is suddenly attacked by hostile biomechanical entities. To her surprise, she discovers she has fighting skills and eventually defeats them in combat.`
                },
                {
                    index: 2,
                    title: "Hunted",
                    player: "tracks/559868409",
                    description: `As a result of defeating the biomechs they call reinforcements and start hunting her. Rebecca is forced to go on the run, not knowing why she has been attacked. Whilst on the run, Rebecca comes to realize that wherever she looks she is confronted by utter devastation. Eventually she is able to give the biomechs the slip.`
                },
                {
                    index: 3,
                    title: "Humans",
                    player: "tracks/559868391",
                    description: `Rebecca is found by an expeditionary force of humans. Unable to answer any of their questions, she is forced to follow them to their base. Upon arriving, Rebecca finds a very militarized city, occupied by the last surviving humans.`
                },
                {
                    index: 4,
                    title: "H-Tower",
                    player: "tracks/559868373",
                    description: `Looking for answers about herself in the human city, Rebecca finally meets a strange guy who suggests to her she finds the high-tech center known as H-Tower, where she will probably find answers to her questions. Helped by this guy, Rebecca eventually finds this mysterious building and starts the ascent: will she find the answers she is looking for?`
                },
            ]
        }
    ]

    onMounted(() => {
        if (props.scroll) {
            const title = document.querySelector("#albums .home-title")
            title && title.scrollIntoView({ behavior: "smooth", block: "center" })
        }
    })

</script>

<style scoped lang="scss">
    .album-tracks li {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        margin-top: 2em;
    }

    .album-track-title {
        font-size: 1.2em;
        color: #fff;
    }

    .album-track-player {
        height: 166px;
    }
</style>
