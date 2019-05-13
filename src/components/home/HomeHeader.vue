<template>
    <div id="homeHeader"></div>
</template>

<script>

    import { states, mutations } from "../../store/storeUtils"
    import EventManager from "../shared/EventManager"
    import LoaderManager from "../shared/LoaderManager"

    import {
        initDatGUI
    }
    from "../shared/utils"

    import {
        BloomEffect,
        BrightnessContrastEffect,
        HueSaturationEffect,
        GlitchEffect,
        ChromaticAberrationEffect,
        RenderPass,
        EffectPass,
        EffectComposer,
        BlendFunction
    }
        from "postprocessing-alias"

    const T = THREE
    const TAG = "[HomeHeader]"

    export default {

        name: "HomeHeader",

        computed: {

            isHomeVisible () {

                return this.$store.getters.isHomeVisible

            },

            homeState () {

                return this.$store.state.homeState

            }

        },

        data () {

            return {
                isInitialized: false
            }

        },

        methods: {

            /**
             * Initialize webgl context and 3d header
             * @returns {Promise<void>}
             */
            async initWebGL () {

                if (this.isInitialized) {
                    console.log(TAG, "Already initialized")
                    return
                }

                this.domElement = this.$el
                const computedStyle = window.getComputedStyle(this.domElement)
                this.width = Math.floor(parseFloat(computedStyle.getPropertyValue("width")))
                this.height = Math.floor(parseFloat(computedStyle.getPropertyValue("height")))

                this.scene = new T.Scene();

                this.camera = new T.PerspectiveCamera(75, this.width / this.height, 0.1, 4000)

                this.renderer = new T.WebGLRenderer({antialias: false, alpha: true})
                this.renderer.setClearColor(0x000000, 0)
                this.renderer.setSize(this.width, this.height)
                this.renderer.setPixelRatio(window.devicePixelRatio)
                this.domElement.appendChild(this.renderer.domElement)

                this.composer = new EffectComposer(this.renderer)

                this.fnlp = []
                this.clock = new T.Clock()

                this.elapsed = undefined
                this.delta = undefined

                this.eventManager = new EventManager()
                this.loaderManager = new LoaderManager(1)

                const create3DText = async () => {

                    const font = await this.loaderManager.loadFont("assets/fonts/Neon Vortex.ttf")

                    const textGeometry = new T.TextGeometry("L U D I K", {
                        font: font,
                        size: 80,
                        height: 5,
                        curveSegments: 12,
                        bevelEnabled: true,
                        bevelThickness: 10,
                        bevelSize: 8,
                        bevelSegments: 5
                    })

                    textGeometry.center()

                    const textMaterial = [

                        new T.MeshBasicMaterial({
                            color: 0x081446,
                            wireframe: false,
                        }),
                        new T.MeshBasicMaterial({
                            color: 0x1EA4F9,
                            wireframe: true,
                            // depthWrite: false
                        }),

                    ]

                    const textMesh = new T.Mesh(textGeometry, textMaterial)
                    textMesh.rotation.y = Math.PI
                    this.scene.add(textMesh)

                    this.camera.lookAt(textMesh.position)

                    const PI_8 = Math.PI / 8
                    const PI_12 = Math.PI / 12

                    this.fnlp.push( (elapsed) => {

                        textMesh.rotation.y = Math.sin(elapsed * .5) * PI_12 + Math.PI
                        textMesh.rotation.x = Math.cos(elapsed * .5) * PI_8

                    })

                }

                const initPostProcessing = () => {

                    const createBrightnessContrastEffect = () => {

                        const params = [
                            {
                                name: "brightness",
                                brightness: -0.722,
                                min: -1.0,
                                max: 1.0,
                                step: 0.001,
                                cb: (v) => { effect.uniforms.get("brightness").value = v }
                            },
                            {
                                name: "contrast",
                                contrast: -0.33,
                                min: -1.0,
                                max: 1.0,
                                step: 0.001,
                                cb: (v) => { effect.uniforms.get("contrast").value = v }
                            }
                        ]

                        const effect = new BrightnessContrastEffect()

                        for (const p of params) {
                            p.cb(p[p.name])
                        }

                        // initDatGUI(params)

                        return effect

                    }

                    const createGlitchEffect = () => {

                        const chromaticAberrationEffect = new ChromaticAberrationEffect();

                        const glitchEffect = new GlitchEffect({
                            chromaticAberrationOffset: chromaticAberrationEffect.offset
                        })

                        glitchEffect.delay.set(4, 10) // min/max delay
                        glitchEffect.duration.set(0.2, 1.0) // min/max duration

                        return glitchEffect

                    }

                    const createBloomEffect = () => {

                        const params = [
                            {
                                name: "resolution",
                                resolution: 0.95,
                                min: 0.00,
                                max: 1.00,
                                cb: (v) => { effect.setResolutionScale(v) }
                            },
                            {
                                name: "distinction",
                                distinction: 1.0,
                                min: 1.0,
                                max: 10.0,
                                cb: (v) => { effect.distinction = v }
                            },
                            {
                                name: "opacity",
                                opacity: 6.3,
                                min: 0.0,
                                max: 10.0,
                                cb: (v) => { effect.blendMode.opacity.value = v }
                            },
                        ]

                        const effect = new BloomEffect()
                        effect.setResolutionScale(params[0].resolution)
                        effect.distinction = params[1].distinction
                        effect.blendMode.opacity.value = params[2].opacity
                        effect.blendMode.blendFunction = BlendFunction.ADD

                        // initDatGUI(params)

                        return effect

                    }

                    const renderPass = new RenderPass(this.scene, this.camera)
                    renderPass.renderToScreen = false
                    renderPass.clear = true

                    const effectPass = new EffectPass(
                        this.camera,
                        createBrightnessContrastEffect(),
                        createBloomEffect(),
                        createGlitchEffect()
                    )

                    effectPass.renderToScreen = true

                    this.composer.addPass(renderPass)
                    this.composer.addPass(effectPass)

                }

                await create3DText()
                initPostProcessing()

                this.renderer.compile(this.scene, this.camera)
                this.eventManager.addDomEvent(window, "resize", this.onWindowResize)
                this.onWindowResize()

                this.isInitialized = true
                console.log(TAG, "Initialized")

            },


            /**
             * Start WebGL
             */
            startWebGL () {

                if (this.isRendering) {
                    console.log(TAG, "Already rendering")
                }

                this.onWindowResize()

                this.requestAnimationId = undefined

                const animate = () => {

                    this.delta = this.clock.getDelta()
                    this.elapsed = this.clock.elapsedTime
                    this.fnlp.forEach(f => f(this.elapsed, this.delta))
                    this.composer.render(this.delta)
                    render()

                }

                const render = () => {

                    this.requestAnimationId = requestAnimationFrame(animate)

                }

                render()
                this.isRendering = true
                console.log(TAG, "WebGL start")

            },

            /**
             * Stop WebGL
             */
            stopWebGL () {

                if (this.requestAnimationId) {
                    cancelAnimationFrame(this.requestAnimationId)
                }

                this.isRendering = false
                console.log(TAG, "WebGL stop")
            },

            /**
             * Window resize handler
             */
            onWindowResize () {

                const computedStyle = window.getComputedStyle(this.domElement)
                this.width = Math.floor(parseFloat(computedStyle.getPropertyValue("width")))
                this.height = Math.floor(parseFloat(computedStyle.getPropertyValue("height")))

                this.camera.position.set(0, 2, - (1000. / this.width) * 200)
                this.camera.lookAt(this.scene.position)

                this.camera.aspect = this.width / this.height
                this.camera.updateProjectionMatrix()

                this.renderer && this.renderer.setSize(this.width, this.height)
                this.composer && this.composer.setSize(this.width, this.height)

            },

            async init () {

                if (!this.isInitialized) {

                    await this.initWebGL()

                }

            },

        },

        watch: {

            async homeState (newVal, oldVal) {

                switch (newVal) {

                    case states.home.start:
                        // await this.init()
                        this.$el.style.display = "block"
                        this.startWebGL()
                        break

                    case states.home.stop:
                        this.stopWebGL()
                        this.$el.style.display = "none"
                        break

                }
            }

        },

        async mounted () {

            await this.init()

        },

        beforeDestroy () {

            this.eventManager.removeBusEvents()
            this.eventManager.removeDomEvents()
            console.log(TAG, "beforeDestroy")

        }


    }
</script>

<style scoped lang="scss">

    @import "home-style";

    #homeHeader {
        width: 100vw;
        height: 24em;

        @include narrow-screen {
            height: 16em;
        }
    }

</style>