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

<script setup>

    import { onMounted } from "vue"

    const props = defineProps({
        scroll: {
            type: Boolean,
            default: false
        }
    })

    onMounted(() => {
        if (props.scroll) {
            const title = document.querySelector("#singles .home-title")
            title && title.scrollIntoView({ behavior: "smooth", block: "center" })
        }
    })

</script>

<style scoped lang="scss">
</style>
