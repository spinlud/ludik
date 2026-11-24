<template>
    <div class="separator"></div>
</template>

<script setup>
// Thin glowing horizontal divider.
</script>

<style scoped lang="scss">
    @use "sass:color";

    .separator {
        width: 100%;
        height: 1px;
        background: $scifi-cyan-hover;
        @include box-shadow(0, 0, 4px, color.adjust($scifi-cyan-hover, $lightness: 30%));
    }

</style>
