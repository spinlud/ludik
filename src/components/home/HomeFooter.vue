<template>
    <div id="homeFooter">
        <a href="https://open.spotify.com/artist/0lMpvELTTsVuCMeAQWuzpN?si=6dWnTikrTvS5DcjY-2MKgg" target="_blank" id="spotifyLink" class="icon-link"></a>
        <a href="https://www.youtube.com/playlist?list=PLBrmlueR-NQ3_xSNwpY1T4fethgCEhoN7" target="_blank" id="youtubeLink" class="icon-link"></a>
        <a href="https://twitter.com/LUDIK02229712" target="_blank" id="twitterLink" class="icon-link"></a>
        <a href="https://www.facebook.com/LUDIK-363454581126098" target="_blank" id="facebookLink" class="icon-link"></a>
        <a href="https://www.instagram.com/ludik.music/?hl=it" target="_blank" id="instagramLink" class="icon-link"></a>
        <a href="mailto:ludovico.fabbri@gmail.com" target="_blank" id="mailLink" class="icon-link"></a>
        <a href="" target="_blank" id="githubLink" class="icon-link"></a>
    </div>
</template>

<script>
    export default {
        name: "HomeFooter"
    }
</script>

<style scoped lang="scss">

    @import "../../styles/base/reset";
    @import "../../styles/base/typography";
    @import "../../styles/helpers/variables";
    @import "../../styles/helpers/colors";
    @import "../../styles/helpers/mixins";

    #homeFooter {
        display: flex;
        justify-content:space-between;
        align-items: center;

        padding-left: $home-wide-padding;
        padding-right: $home-wide-padding;

        width: 100vw;
        height: 8em;
        color: white;

        @include linear-gradient(
                        20deg,
                        rgba($scifi-cyan-hover, 0.1) 0%,
                        rgba($scifi-cyan-hover, 0.1) 35%,
                        rgba(lighten($scifi-cyan-hover, 70), 0.3) 45%,
                        rgba($scifi-cyan-hover, 0.1) 55%,
                        rgba($scifi-cyan-hover, 0.1) 100%
        );

        @include narrow-screen {
            padding-left: $home-narrow-padding;
            padding-right: $home-narrow-padding;
        }
    }

    .icon-link {

        width: 2em;
        height: 2em;

        background-size:     cover;
        background-repeat:   no-repeat;
        background-position: center center;

        opacity: 0.4;

        &:hover {
            opacity: 1;
        }

    }

    #spotifyLink {
        background-image: url(../../../assets/images/icons/icons8-spotify-filled-50.png);
    }

    #youtubeLink {
        background-image: url(../../../assets/images/icons/icons8-youtube-squared-50.png);
    }

    #twitterLink {
        background-image: url(../../../assets/images/icons/icons8-twitter-squared-filled-50.png);
    }

    #facebookLink {
        background-image: url(../../../assets/images/icons/icons8-facebook-circled-filled-50.png);
    }

    #instagramLink {
        background-image: url(../../../assets/images/icons/icons8-instagram-filled-50.png);
    }

    #mailLink {
        background-image: url(../../../assets/images/icons/icons8-post-filled-50.png);
    }

    #githubLink {
        background-image: url(../../../assets/images/icons/icons8-github-filled-50.png);
    }

</style>