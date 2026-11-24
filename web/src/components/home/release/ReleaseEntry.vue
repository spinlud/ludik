<!--
    One release in the shared layout: artwork next to a SoundCloud player,
    then title, release date and description. The default slot renders below
    the description for per-release extras (per-track text, tracklists, ...).
-->
<template>
    <li class="release-li">
        <img :src="artwork" alt="" class="release-artwork"><!-- no whitespace between inline-blocks
        --><div class="release-player">
            <iframe :src="soundcloudPlayerSrc(player, { visual: false })" :title="title" width="100%" height="100%" frameborder="no" scrolling="no" allow="autoplay"></iframe>
        </div>
        <div class="release-metadata">
            <span class="release-title">{{ title }}</span>
            <span class="release-date">{{ releaseDate }}</span>
            <p class="home-text justify-text release-description">{{ description }}</p>
            <slot></slot>
        </div>
    </li>
</template>

<script setup>

    import { soundcloudPlayerSrc } from "./soundcloud.js"

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
        display: block;
        margin-top: $home-wide-padding;
    }

    .release-artwork,
    .release-player {
        display: inline-block;
        vertical-align: top;
        width: calc( (100vw - 3 * #{$home-wide-padding}) * 0.5 );
        height: calc( (100vw - 3 * #{$home-wide-padding}) * 0.5 );
    }

    .release-artwork {
        @include narrow-screen {
            display: block;
            width: 100%;
            height: auto;
        }
    }

    .release-player {
        @include narrow-screen {
            display: block;
            width: 100%;
            height: 350px;
        }
    }

    .release-metadata {
        display: flex;
        flex-direction: column;
        gap: 1em;
        padding: 2em 1em $home-wide-padding;
        color: color.adjust($silver-chalice2, $lightness: 10%);
        background: black;
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
