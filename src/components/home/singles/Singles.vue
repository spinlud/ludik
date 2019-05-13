<template>
    <div id="singles" class="home-root">
        <span class="home-title">SINGLES</span>
        <div class="home-content">
            <p class="home-text justify-text">
                Nothing to show yet. <br>
                Content will be added as soon as available. <br>
                Stay tuned! (ツ)_.\m/
            </p>
        </div>
    </div>
</template>

<script>
    export default {
        name: "Singles",

        props: {
            scroll: {
                type: Boolean,
                default: false
            }
        },

        mounted () {

            if (this.scroll) {

                $("#singles .home-title")[0].scrollIntoView({behavior: "smooth", block: "center"})

            }

        }
    }
</script>

<style scoped lang="scss">

    @import "../home-style";

</style>