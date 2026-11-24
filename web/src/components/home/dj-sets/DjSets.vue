<template>
    <div id="dj-sets" class="home-root">
        <span class="home-title">{{title}}</span>
        <div class="home-content">
            <ul>
                <ReleaseEntry v-for="set in djSets" :key="set.title"
                    :title="set.title" :release-date="set.releaseDate" :artwork="set.artwork"
                    :player="set.player" :description="set.description">
                    <ol class="tracklist">
                        <li v-for="row in set.tracklist" :key="row.time" class="tracklist-row">
                            <span class="tracklist-time">{{row.time}}</span>
                            <span class="tracklist-text">{{row.text}}</span>
                            <span v-if="row.tag" class="tracklist-tag">[{{row.tag}}]</span>
                        </li>
                    </ol>
                </ReleaseEntry>
            </ul>
        </div>
    </div>
</template>

<script setup>

    import { onMounted } from "vue"
    import ReleaseEntry from "../release/ReleaseEntry.vue"

    const props = defineProps({
        scroll: {
            type: Boolean,
            default: false
        }
    })

    const title = "DJ SETS"

    const djSets = [
        {
            title: "Soriano Street Boulder LIVE mix - September 2023",
            releaseDate: "09-2023",
            player: "tracks/1640525379",
            artwork: "/assets/images/dj-sets/soriano-500.jpg",
            description: "Set performed at Soriano Street Boulder climbing festival - September 2023",
            tracklist: [
                { time: "00:00:00", text: "Alex Kogan – Imagine it (intro edit)" },
                { time: "00:04:00", text: "Sharam Jey & Betoko Ft. Ashibah – Gravity (ZAC & PACS Remix) / Alex Kogan – Imagine it (intro edit)", tag: "Ludik mashup" },
                { time: "00:10:00", text: "Patrick Ruprecht – Infinity System (Rafael Cerato Remix)" },
                { time: "00:15:25", text: "Fluke – Zion (Matrix Reloaded)" },
                { time: "00:19:50", text: "Juno Reactor – Mona Lisa Overdrive (Matrix Reloaded) / Infected Mushroom – Psycho", tag: "Ludik mashup" },
                { time: "00:22:26", text: "Infected Mushroom – Psycho", tag: "Ludik bootleg" },
                { time: "00:25:55", text: "Astrix – Deep Jungle Walk", tag: "Ludik bootleg" },
                { time: "00:33:03", text: "Prodigy – Voodoo People (Pendulum remix)" },
                { time: "00:37:40", text: "Noisia – Dustup", tag: "Ludik bootleg" },
                { time: "00:42:30", text: "Pendulum – Slam", tag: "Ludik bootleg" },
                { time: "00:48:25", text: "Prodigy – Smack my bitch up" },
                { time: "00:51:10", text: "Prodigy – Smack my bitch up / Noisia – Smack my bitch up (remix)", tag: "Ludik mashup" },
                { time: "00:54:20", text: "Claptone & Mylo – Drop The Pressure (Purple Disco Machine Remix)", tag: "Ludik bootleg" },
            ]
        }
    ]

    onMounted(() => {
        if (props.scroll) {
            const heading = document.querySelector("#dj-sets .home-title")
            heading && heading.scrollIntoView({ behavior: "smooth", block: "center" })
        }
    })

</script>

<style scoped lang="scss">
    .tracklist {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .tracklist-row {
        display: grid;
        grid-template-columns: auto 1fr auto;
        column-gap: 1em;
        align-items: baseline;
        padding: 0.4em 0;
        border-bottom: 1px solid rgba(#fff, 0.08);

        @include narrow-screen {
            grid-template-columns: auto 1fr;
            row-gap: 0.3em;
        }
    }

    .tracklist-time {
        font-family: monospace;
        color: rgba(#fff, 0.6);
    }

    .tracklist-text {
        color: #fff;
    }

    .tracklist-tag {
        font-size: 0.85em;
        color: rgba(#fff, 0.45);
        white-space: nowrap;

        @include narrow-screen {
            grid-column: 2;
            grid-row: 2;
        }
    }
</style>
