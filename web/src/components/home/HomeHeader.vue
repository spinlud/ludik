<template>
    <div id="homeHeader">
        <span id="homeHeaderTitle">LUDIK</span>
    </div>
</template>

<script setup>
// Static placeholder for the animated WebGL (three.js + postprocessing) header.
// The 3D header is rebuilt in a later ticket.
</script>

<style scoped lang="scss">

    #homeHeader {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 100vw;
        height: 24em;

        @include narrow-screen {
            height: 16em;
        }
    }

    #homeHeaderTitle {
        font-family: neuropol, "Helvetica Neue", "Helvetica", sans-serif;
        font-size: 6em;
        letter-spacing: 0.25em;
        color: lighten($scifi-cyan-hover, 40%);
        text-shadow:
            0 0 8px $scifi-cyan-hover,
            0 0 24px $scifi-cyan-hover;

        @include narrow-screen {
            font-size: 3em;
        }
    }

</style>
