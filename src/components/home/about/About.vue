<template>
    <div id="about" class="home-root">
        <span class="home-title">About</span>
        <div class="home-content">
            <p class="home-text justify-text">
                LUDIK is an hybrid musical project with a futuristic vision in mind where music and technology are
                deeply interconnected. Sounds are blended together from different genres and sources like rock, metal,
                orchestral, electro, drum & bass, trance, environment agents, sensors, electric machinery and algorithms.
            </p>
            <br>
            <br>
            <p class="home-text justify-text">
                After releasing my first album
                <router-link :to="{name: 'Albums', params: {scroll: true}}" class="home-link">Positron - Chapter 1</router-link>
                I've decided to build this experimental website in my free time. My goal was not to create a video game but an atmosphere,
                more precisely the feeling of a voyage across the space. It was also an excuse to learn about technologies
                I didn't know before like <a href="https://threejs.org/" target="_blank" class="home-link">three.js</a> or
                <a href="https://vuejs.org/" target="_blank" class="home-link">vue.js</a>. The graphic assets has been assembled and exported
                from <a href="https://unity.com/" target="_blank" class="home-link">Unity</a> (and tweaked a bit in
                <a href="https://www.blender.org/" target="_blank" class="home-link">Blender</a>), while the audio textures has been
                mixed original in <a href="https://www.ableton.com/" target="_blank" class="home-link">Ableton</a>.
                It took longer than I expected but it was a lot of fun, hope you will enjoy it!
            </p>
            <br>
            <br>
            <p class="home-text justify-text">
                Thanks to the the following libraries/technologies that made this website possible:
            </p>
            <ul class="logos-container">
                <li v-for="lib in libraries" class="logo-column">
                    <a :href="lib.url" target="_blank" class="logo-link">
                        <img :src="lib.logo" :alt="lib.name" class="logo-image" />
                    </a>
                </li>
            </ul>
            <br>
            <br>
            <p class="home-text justify-text">
                Thanks to the following open source projects:
            </p>
            <ul>
                <li v-for="p in projects" class="proj-li">
                    <a :href="p.url" target="_blank" class="home-link">• {{p.name}}</a>
                </li>
            </ul>
            <br>
            <br>
            <p class="home-text justify-text">
                Finally a special thanks to the guys of <a href="https://discourse.threejs.org/" target="_blank" class="home-link">three.js forum</a>
                that helped me quite a lot understanding concepts and debugging issues on three.js code!<br>
            </p>
        </div>
    </div>
</template>

<script>

    export default {

        name: "About",

        props: {
            scroll: {
                type: Boolean,
                default: false
            }
        },

        data () {

            return {

                libraries: [
                    {
                        name: "node.js",
                        logo: "assets/images/logos/nodejs_logo.png",
                        url: "https://nodejs.org/en/"
                    },
                    {
                        name: "three.js",
                        logo: "assets/images/logos/threejs_logo.png",
                        url: "https://threejs.org/"
                    },
                    {
                        name: "vue.js",
                        logo: "assets/images/logos/vuejs_logo.png",
                        url: "https://vuejs.org/"
                    },
                    {
                        name: "webpack",
                        logo: "assets/images/logos/webpack_logo.png",
                        url: "https://webpack.js.org/"
                    },
                    {
                        name: "babel",
                        logo: "assets/images/logos/babel_logo.png",
                        url: "https://babeljs.io/"
                    },
                    {
                        name: "sass",
                        logo: "assets/images/logos/sass_logo.png",
                        url: "https://sass-lang.com/"
                    },
                    {
                        name: "unity",
                        logo: "assets/images/logos/unity_logo.png",
                        url: "https://unity.com/"
                    },
                    {
                        name: "blender",
                        logo: "assets/images/logos/blender_logo.png",
                        url: "https://www.blender.org/"
                    },

                ],

                projects: [
                    {
                        name: "Tween.js",
                        url: "https://github.com/tweenjs/tween.js/"
                    },
                    {
                        name: "UnityGLTF",
                        url: "https://github.com/KhronosGroup/UnityGLTF"
                    },
                    {
                        name: "Three Pathfinding",
                        url: "https://github.com/donmccurdy/three-pathfinding"
                    },
                    {
                        name: "Postprocessing",
                        url: "https://github.com/vanruesc/postprocessing"
                    },
                    {
                        name: "Three Nebula",
                        url: "https://github.com/creativelifeform/three-nebula"
                    },
                ]

            }

        },

        mounted () {

            if (this.scroll) {

                $("#about .home-title")[0].scrollIntoView({behavior: "smooth", block: "center"})

            }

        }
    }

</script>

<style scoped lang="scss">

    @import "../home-style";

    .logos-container {
        display: -ms-flexbox; /* IE10 */
        display: flex;
        -ms-flex-wrap: wrap; /* IE10 */
        flex-wrap: wrap;
        width: 100%;
    }

    .logo-column {
        -ms-flex: 25%; /* IE10 */
        flex: 25%;
        max-width: 25%;
        text-align: center;

        @include medium-screen {
            -ms-flex: 50%; /* IE10 */
            flex: 50%;
            max-width: 50%;
        }

        @include narrow-screen {
            -ms-flex: 50%; /* IE10 */
            flex: 50%;
            max-width: 50%;
        }
    }

    .logo-link {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 1em;

        .logo-image {
            display: block;
            max-width: 8em;
            height: auto;

            @include narrow-screen {
                max-width: 6em;
            }
        }
    }

    li.proj-li {
        display: block;
        padding: 1em;
        font-size: $home-font-size;
        line-height: $home-line-height;
    }

</style>