<template>
    <div class="separator"></div>
</template>

<script>
    export default {
        name: "Separator"
    }
</script>

<style scoped lang="scss">

    @import "../../styles/base/reset";
    @import "../../styles/base/typography";
    @import "../../styles/helpers/variables";
    @import "../../styles/helpers/colors";
    @import "../../styles/helpers/mixins";

    .separator {
        width: 100%;
        height: 1px;
        background: $scifi-cyan-hover;
        @include box-shadow(0, 0, 4px, lighten($scifi-cyan-hover, 30%));
    }


</style>