<template>
    <div id="singles" class="home-root">
        <span class="home-title">SINGLES</span>
        <div class="home-content">
            <ul>
                <ReleaseEntry v-for="single in singles" :key="single.title"
                    :title="single.title" :release-date="single.releaseDate" :artwork="single.artwork"
                    :player="single.player" :description="single.description" />
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

    const singles = [
        {
            title: "The Rise Of The Zombies",
            releaseDate: "08-2021",
            player: "tracks/1102903111",
            artwork: "/assets/images/singles/the-rise-of-the-zombies-500.jpg",
            description: "Song for the #tombjam competition! Zombies are coming! (ツ)_.\\m/"
        }
    ]

    onMounted(() => {
        if (props.scroll) {
            const title = document.querySelector("#singles .home-title")
            title && title.scrollIntoView({ behavior: "smooth", block: "center" })
        }
    })

</script>

<style scoped lang="scss">
</style>
