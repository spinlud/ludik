<template>
    <div class="separator"></div>
</template>

<script setup>
// Thin glowing horizontal divider.
</script>

<style scoped lang="scss">

    .separator {
        width: 100%;
        height: 1px;
        background: $scifi-cyan-hover;
        @include box-shadow(0, 0, 4px, lighten($scifi-cyan-hover, 30%));
    }

</style>
