<!--
    One release in the shared layout: artwork on the left, and a right column
    with a SoundCloud player followed by title, release date and description.
    The default slot renders full width below both columns for per-release
    extras (per-track text, tracklists, ...). Narrow screens stack everything.
-->
<template>
    <li class="release-li">
        <img :src="artwork" alt="" class="release-artwork">
        <div class="release-side">
            <div class="release-player">
                <SoundcloudPlayer :resource="player" :title="title" />
            </div>
            <div class="release-metadata">
                <span class="release-title">{{ title }}</span>
                <span class="release-date">{{ releaseDate }}</span>
                <p class="home-text justify-text release-description">{{ description }}</p>
            </div>
        </div>
        <div v-if="$slots.default" class="release-extra">
            <slot></slot>
        </div>
    </li>
</template>

<script setup>

    import SoundcloudPlayer from "./SoundcloudPlayer.vue"

    defineProps({
        title: { type: String, required: true },
        releaseDate: { type: String, required: true },
        artwork: { type: String, required: true },
        // api.soundcloud.com resource path, e.g. "tracks/1102903111"
        player: { type: String, required: true },
        description: { type: String, default: "" },
    })

</script>

<style scoped lang="scss">
    @use "sass:color";

    .release-li {
        display: grid;
        grid-template-columns: calc( (100vw - 3 * #{$home-wide-padding}) * 0.5 ) minmax(0, 1fr);
        grid-template-areas:
            "artwork side"
            "extra extra";
        align-items: start;
        margin-top: $home-wide-padding;
        color: color.adjust($silver-chalice2, $lightness: 10%);
        background: black;

        @include narrow-screen {
            grid-template-columns: minmax(0, 1fr);
            grid-template-areas:
                "artwork"
                "side"
                "extra";
        }
    }

    .release-artwork {
        grid-area: artwork;
        display: block;
        width: 100%;
        height: auto;
        aspect-ratio: 1;
        object-fit: cover;
    }

    .release-side {
        grid-area: side;
        min-width: 0;
    }

    .release-metadata {
        display: flex;
        flex-direction: column;
        gap: 1em;
        padding: 2em 1em 1em;
    }

    .release-extra {
        grid-area: extra;
        padding: 0 1em $home-wide-padding;
    }

    .release-title {
        font-size: 1.5em;
        color: #fff;

        @include narrow-screen {
            font-size: 1.3em;
        }
    }

    .release-date {
        color: rgba(#fff, 0.6);
    }

    .release-description {
        margin: 0;
    }
</style>
