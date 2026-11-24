<!--
    Compact SoundCloud widget for one api.soundcloud.com resource. Fills the
    width of its container at the widget's natural height: 166px for a track,
    tall enough for a playlist to list its tracks without scrolling.
-->
<template>
    <iframe class="soundcloud-player" :src="soundcloudPlayerSrc(resource)" :title="title"
        width="100%" :height="height" frameborder="no" scrolling="no" allow="autoplay"></iframe>
</template>

<script setup>

    import { computed } from "vue"
    import { soundcloudPlayerSrc } from "./soundcloud.js"

    const props = defineProps({
        // api.soundcloud.com resource path, e.g. "tracks/1102903111"
        resource: { type: String, required: true },
        title: { type: String, required: true },
    })

    const TRACK_HEIGHT = 166
    const PLAYLIST_HEIGHT = 450

    const height = computed(() => props.resource.startsWith("playlists/") ? PLAYLIST_HEIGHT : TRACK_HEIGHT)

</script>

<style scoped>
    .soundcloud-player {
        display: block;
    }
</style>
