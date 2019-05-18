<template>
    <div id="world">

        <div id="worldConsole" v-bind:class="{'close': !isConsoleOpen}">

            <span id="worldConsoleMessage"></span>

            <div id="pbarContainer">
                <div id="pbarOuter">
                    <div id="pbarInner"></div>
                    <span id="pbarValue">50%</span>
                </div>
            </div>
        </div>

        <div id="commandPanel" v-show="isCommandPanelVisible">
            <span class="title">COMMAND PANEL</span>

            <div id="commandPanelClose">
                <div id="commandPanelCloseButton" v-on:click="onCommandPanelClose">
                    <span></span>
                    <span></span>
                </div>
            </div>

            <ul>
                <li v-for="slider in commandPanelSliders" class="commandpanel-row">
                    <span class="commandpanel-row-label">{{slider.label}}</span>
                    <div class="commandpanel-row-slider-container">
                        <input type="range" class="commandpanel-row-slider" :min=slider.min :max=slider.max
                               :step=slider.step v-model="slider.value" @input="slider.handler" @change="slider.handler">
                        <span class="commandpanel-row-value">{{slider.valueFormatted}}</span>
                    </div>
                </li>
                <li v-for="sw in commandPanelSwitches" class="commandpanel-row">
                    <span class="commandpanel-row-label">{{sw.label}}</span>
                    <div class="commandpanel-row-switch-container">
                        <input type="checkbox" v-model="sw.checked" @change="sw.handler" class="commandpanel-row-switch-input">
                        <span class="commandpanel-row-switch-slider"></span>
                    </div>
                </li>
            </ul>

            <div id="commandPanelDefaultBtn" v-on:click="onCommandPanelDefault">
                <div class="fuller-button white">DEFAULT</div>
            </div>
        </div>

    </div>
</template>

<script>

    import { states, mutations } from "../../store/storeUtils"
    import EventManager from "../shared/EventManager"
    import LoaderManager from "../shared/LoaderManager"
    import TouchManager from "../shared/TouchManager"
    import { LEVEL_POLY, COMMAND_CONSOLE_POLY } from "./worldPolygons"

    import {
        isTouchDevice,
        isAndroid,
        isSafari,
        sceneTraverse,
        isInsidePolygon,
        polygonFromRect,
        wait,
        initDatGUI
    }
        from "../shared/utils"

    import { MyDeviceOrientationControls } from "../shared/MyDeviceOrientationControls"
    import { MyPointerLockControls } from "../shared/MyPointerLockControls.js"

    import { Pathfinding, PathfindingHelper } from "three-pathfinding-alias"

    import {
        BloomEffect,
        GodRaysEffect,
        KernelSize,
        BrightnessContrastEffect,
        HueSaturationEffect,
        SMAAEffect,
        RenderPass,
        EffectPass,
        EffectComposer,
        BlendFunction
    }
        from "postprocessing-alias"

    import System, {
        Emitter,
        Rate,
        Span,
        Position,
        Mass,
        Body,
        Radius,
        Life,
        VectorVelocity,
        RadialVelocity,
        PointZone,
        Vector3D,
        Alpha,
        Scale,
        Color,
        SpriteRenderer
    } from "three-nebula-alias"

    const T = THREE
    const TWEEN = require("@tweenjs/tween.js")
    const SCREENFULL = require("screenfull")
    const STATS = require("stats-js")
    const THREEx = require("../shared/threex.stats.js")

    const TAG = "[World]"

    const WEBGL_RESOLUTIONS = {
        bad: "BAD",
        low: "LOW",
        medium: "MEDIUM",
        high: "HIGH",
        full: "FULL",
        na: "NA"
    }

    export default {

        name: "World",

        data () {

            const commandPanelSwitches = {

                fps: {
                    label: "Show FPS",
                    checked: false,
                    handler: () => {

                        this.toggleStatsFPS()

                    }
                },

                antialias: {
                    label: "Antialiasing",
                    checked: false,
                    handler: () => {

                        this.postProcessingPasses["aaPass"].enabled = !this.postProcessingPasses["aaPass"].enabled

                    }
                }

            }

            // Enable full screen only for desktop (excluded Safari because of problems in full screen api)
            if (!isTouchDevice() && !isSafari()) {
                commandPanelSwitches["fullScreen"] = {
                    label: "Full Screen",
                    checked: false,
                    handler: () => {

                        this.toggleFullScreen()

                    }
                }
            }

            return {

                isCommandPanelVisible: false,

                isConsoleOpen: false,

                commandPanelSliders: {

                    resolution: {
                        label: "Resolution",
                        min: 0.2,
                        max: 1.0,
                        step: 0.2,
                        value: 0.8,
                        default: "0.8",
                        valueFormatted: "HIGH",
                        handler: () => {
                            const ratio = window.devicePixelRatio * Number(this.commandPanelSliders.resolution.value)
                            this.renderer.setPixelRatio(ratio)

                            switch (this.commandPanelSliders.resolution.value) {

                                case "0.2":
                                    this.commandPanelSliders.resolution.valueFormatted = WEBGL_RESOLUTIONS.bad
                                    break

                                case "0.4":
                                    this.commandPanelSliders.resolution.valueFormatted = WEBGL_RESOLUTIONS.low
                                    break

                                case "0.6":
                                    this.commandPanelSliders.resolution.valueFormatted = WEBGL_RESOLUTIONS.medium
                                    break

                                case "0.8":
                                    this.commandPanelSliders.resolution.valueFormatted = WEBGL_RESOLUTIONS.high
                                    break

                                case "1":
                                    this.commandPanelSliders.resolution.valueFormatted = WEBGL_RESOLUTIONS.full
                                    break

                                default:
                                    this.commandPanelSliders.resolution.valueFormatted = WEBGL_RESOLUTIONS.na
                            }
                        }
                    },

                    brightness: {
                        label: "Brighteness",
                        min: -0.500,
                        max: 0.500,
                        step: 0.001,
                        value: 0.036,
                        default: 0.036,
                        valueFormatted: Number(0.036).toFixed(3),
                        handler: () => {
                            this.postProcessingEffects["brightnessContrastEffect"]
                                .uniforms.get("brightness").value = this.commandPanelSliders.brightness.value

                            this.commandPanelSliders.brightness.valueFormatted =
                                Number(this.commandPanelSliders.brightness.value).toFixed(3)
                        }
                    },

                    contrast: {
                        label: "Contrast",
                        min: -1.000,
                        max: 1.000,
                        step: 0.001,
                        value: 0.200,
                        default: 0.200,
                        valueFormatted: Number(0.200).toFixed(3),
                        handler: () => {
                            this.postProcessingEffects["brightnessContrastEffect"]
                                .uniforms.get("contrast").value = this.commandPanelSliders.contrast.value

                            this.commandPanelSliders.contrast.valueFormatted =
                                Number(this.commandPanelSliders.contrast.value).toFixed(3)
                        }
                    },

                    hue: {
                        label: "Hue",
                        min: -1.000,
                        max: 1.000,
                        step: 0.001,
                        value: 0.000,
                        default: 0.000,
                        valueFormatted: Number(0.000).toFixed(3),
                        handler: () => {
                            this.postProcessingEffects["hueSaturationEffect"].setHue(this.commandPanelSliders.hue.value)

                            this.commandPanelSliders.hue.valueFormatted =
                                Number(this.commandPanelSliders.hue.value).toFixed(3)
                        }
                    },

                    saturation: {
                        label: "Saturation",
                        min: -1.000,
                        max: 1.000,
                        step: 0.001,
                        value: 0.200,
                        default: 0.200,
                        valueFormatted: Number(0.200).toFixed(3),
                        handler: () => {
                            this.postProcessingEffects["hueSaturationEffect"]
                                .uniforms.get("saturation").value = this.commandPanelSliders.saturation.value

                            this.commandPanelSliders.saturation.valueFormatted =
                                Number(this.commandPanelSliders.saturation.value).toFixed(3)
                        }
                    },
                },
                
                commandPanelSwitches: commandPanelSwitches

            }



        },

        computed: {

            worldState() {

                return this.$store.state.worldState

            },

        },

        methods: {


            /**
             * Set command panel sliders to default values
             */
            onCommandPanelDefault () {

                for (const param of Object.values(this.commandPanelSliders)) {
                    param.value = param.default
                    param.handler()
                }

            },

            /**
             * Enable WebGL when closing command panel
             */
            onCommandPanelClose () {

                this.isCommandPanelVisible = false
                this.controls.enabled = true
                !this.isTouchDevice && this.controls.lock({startWebGL: false})

            },

            /**
             * Display console message at first WebGL start
             * @returns {Promise<void>}
             */
            async displayConsoleMessage () {

                // Runs only once at start
                if (this.consoleMessageDisplayed) {
                    return
                }
                else {
                    this.consoleMessageDisplayed = true
                }

                const worldConsoleMessage = $("#worldConsoleMessage")
                const charTimeout = 40
                const phraseTimeoutShort = 200 // , : ;
                const phraseTimeoutLong = 1000 // . ! ?

                const sound = new T.Audio(new T.AudioListener())
                sound.setLoop(false)
                sound.setVolume(0.01)

                const buffers = [
                    await this.loaderManager.loadAudio("assets/audio/data_beap_1_128cbr.mp3"),
                    await this.loaderManager.loadAudio("assets/audio/data_beap_2_128cbr.mp3"),
                    await this.loaderManager.loadAudio("assets/audio/data_beap_3_128cbr.mp3"),
                    await this.loaderManager.loadAudio("assets/audio/data_beap_4_128cbr.mp3")
                ]

                const phrases = [
                    "Hello visitor, welcome on board!<br>",
                    this.isTouchDevice ?
                        `Tap on floor to navigate, drag or tilt the device to look around. <br>` :
                        this.isSafari ?
                            `WASD or arrow keys to move, hold SHIFT to run, mouse to look around. <br>` :
                            `WASD or arrow keys to move, hold SHIFT to run, mouse to look around, F to toggle full screen. <br>`,
                    `This application uses positional audio. For the best experience, Google Chrome and headphones are recommended. Have a good journey! `
                ]

                const playPhrase = async (phrase) => {

                    // Cancel in case of another transition has been started (stargate)
                    if (this.isTransitionRunning) {
                        worldConsoleMessage.html("")
                        return
                    }

                    let message = ""
                    let char
                    worldConsoleMessage.html(message)

                    for (let i = 0; i < phrase.length; ++i) {

                        char = phrase.charAt(i)

                        // Assumes an html tag
                        if (char === "<") {
                            const j = phrase.substr(i).indexOf(">")
                            char += phrase.substr(i + 1, j)
                            i += j
                        }

                        message += char
                        sound.isPlaying && sound.stop()
                        sound.setBuffer(buffers[i % buffers.length])
                        !this.isTransitionRunning && char !== " " && sound.play()
                        worldConsoleMessage.html(message)

                        switch (char) {

                            case ",":
                            case ":":
                            case ";":
                                await wait(phraseTimeoutShort)
                                break

                            case ".":
                            case "!":
                            case "?":
                                await wait(phraseTimeoutLong)
                                break

                            default:
                                await wait(charTimeout)

                        }
                    }
                }

                // Wait a bit for rendering to start
                await wait(1000)

                // Show console and wait for css transition open
                this.isConsoleOpen = true
                await wait(1000)

                // Display phrases
                for (const p of phrases) {
                    await playPhrase(p)
                }

                // $("<span>! (ツ)_.\\m/</span>").appendTo(worldConsoleMessage).hide().fadeIn(100)

                // Cancel in case of another transition has been started (stargate)
                if (this.isTransitionRunning) {
                    worldConsoleMessage.html("")
                    return
                }

                // Wait a bit then hide console
                await wait(4000)
                this.isConsoleOpen = false

                // Wait for css transition close then reset console message
                await wait(1000)
                worldConsoleMessage.html("")

            },


            /**
             * Initialize WebGL postprocessing pipeline
             * @returns {Promise<void>}
             */
            async initPostProcessing () {

                const createBloomEffect = () => {

                    const bloomParams = [
                        {
                            name: "resolution",
                            resolution: 0.7,
                            min: 0.00,
                            max: 1.00,
                            cb: (v) => { bloomEffect.setResolutionScale(v) }
                        },
                        {
                            name: "distinction",
                            distinction: 1.0,
                            min: 1.0,
                            max: 10.0,
                            cb: (v) => { bloomEffect.distinction = v }
                        },
                        {
                            name: "opacity",
                            opacity: 1.2,
                            min: 0.0,
                            max: 4.0,
                            cb: (v) => { bloomEffect.blendMode.opacity.value = v }
                        },
                    ]

                    const bloomEffect = new BloomEffect()
                    bloomEffect.setResolutionScale(bloomParams[0].resolution)
                    bloomEffect.distinction = bloomParams[1].distinction
                    bloomEffect.blendMode.opacity.value = bloomParams[2].opacity
                    // initDatGUI(bloomParams)

                    return bloomEffect

                }

                const createGodRayEffect = async () => {

                    const sunMaterial = new T.PointsMaterial({
                        map: await this.loaderManager.loadTexture("assets/textures/sun.png"),
                        size: 100,
                        sizeAttenuation: true,
                        color: 0xffddaa,
                        alphaTest: 0,
                        transparent: true,
                        fog: false
                    })

                    const sunGeometry = new T.BufferGeometry()
                    sunGeometry.addAttribute("position", new T.BufferAttribute(new Float32Array(3), 3))
                    const sun = new T.Points(sunGeometry, sunMaterial)
                    sun.frustumCulled = false
                    // const position = new T.Vector3(0, 0, -150)
                    const position = new T.Vector3(0, 0, 1000)
                    position.applyQuaternion(this.level.quaternion) // apply level rotation
                    sun.position.set(position.x, position.y, position.z)
                    this.scene.add(sun)

                    const godRaysEffect = new GodRaysEffect(this.camera, sun, {
                        // resolutionScale: 0.75,
                        resolutionScale: 0.28,
                        kernelSize: KernelSize.SMALL,
                        density: 0.96,
                        decay: 0.93,
                        weight: 0.3,
                        exposure: 0.55,
                        samples: 60,
                        clampMax: 1.0
                    })

                    godRaysEffect.dithering = true

                    const params = [
                        {
                            name: "resolution",
                            resolution: godRaysEffect.getResolutionScale(),
                            min: 0.00,
                            max: 1.00,
                            step: 0.01,
                            cb: (v) => { godRaysEffect.setResolutionScale(v) }
                        }
                    ]

                    // initDatGUI(params)

                    return godRaysEffect
                }

                const createBrightnessContrastEffect = () => {

                    const brightnessContrastEffect = new BrightnessContrastEffect()

                    const params = [
                        {
                            name: "brightness",
                            brightness: this.commandPanelSliders.brightness.default,
                            min: -1.0,
                            max: 1.0,
                            step: 0.001,
                            cb: (v) => { brightnessContrastEffect.uniforms.get("brightness").value = v }
                        },
                        {
                            name: "contrast",
                            contrast: this.commandPanelSliders.contrast.default,
                            min: -1.0,
                            max: 1.0,
                            step: 0.001,
                            cb: (v) => { brightnessContrastEffect.uniforms.get("contrast").value = v }
                        }
                    ]

                    for (const p of params) {
                        p.cb(p[p.name])
                    }

                    // initDatGUI(params)

                    return brightnessContrastEffect

                }

                const createHueSaturationEffect = () => {

                    const hueSaturationEffect = new HueSaturationEffect(BlendFunction.NORMAL)

                    const params = [
                        {
                            name: "hue",
                            hue: this.commandPanelSliders.hue.default,
                            min: -Math.PI,
                            max: Math.PI,
                            step: 0.01,
                            cb: (v) => { hueSaturationEffect.setHue(v) }
                        },
                        {
                            name: "saturation",
                            saturation: this.commandPanelSliders.saturation.default,
                            min: -1.0,
                            max: 1.0,
                            step: 0.01,
                            cb: (v) => { hueSaturationEffect.uniforms.get("saturation").value = v }
                        },
                    ]

                    for (const p of params) {
                        p.cb(p[p.name])
                    }

                    // initDatGUI(params)

                    return hueSaturationEffect

                }

                const createSMAAEffect = async () => {

                    const searchImage = await this.loaderManager.loadImage(SMAAEffect.searchImageDataURL)
                    const areaImage = await this.loaderManager.loadImage(SMAAEffect.areaImageDataURL)

                    const effect =  new SMAAEffect(searchImage, areaImage)
                    effect.setEdgeDetectionThreshold(0.065)

                    return effect

                }

                const smaaEffect = await createSMAAEffect()
                const bloomEffect = createBloomEffect()
                const hueSaturationEffect = createHueSaturationEffect()
                const brightnessContrastEffect = createBrightnessContrastEffect()
                const godRayEffect = await createGodRayEffect()

                const renderPass = new RenderPass(this.scene, this.camera)
                renderPass.renderToScreen = false
                renderPass.clear = true

                const aaPass = new EffectPass(
                    this.camera,
                    smaaEffect,
                )
                aaPass.renderToScreen = false
                aaPass.enabled = false

                const beautyPass = new EffectPass(
                    this.camera,
                    hueSaturationEffect,
                    brightnessContrastEffect,
                    godRayEffect,
                    bloomEffect
                )
                beautyPass.renderToScreen = true

                this.composer.addPass(renderPass)
                this.composer.addPass(aaPass)
                this.composer.addPass(beautyPass)

                this.postProcessingEffects["bloomEffect"] = bloomEffect
                this.postProcessingEffects["hueSaturationEffect"] = hueSaturationEffect
                this.postProcessingEffects["brightnessContrastEffect"] = brightnessContrastEffect
                this.postProcessingEffects["godRayEffect"] = godRayEffect

                this.postProcessingPasses["aaPass"] = aaPass
                this.postProcessingPasses["beautyPass"] = beautyPass

                const onKeyup = (e) => {
                    // L
                    if (e.keyCode === 76) {
                        this.commandPanelSwitches.antialias.checked = !this.commandPanelSwitches.antialias.checked
                        aaPass.enabled = !aaPass.enabled
                    }
                }

                this.eventManager.addDomEvent(document, "keyup", onKeyup)

            },

            /**
             * Load world assets
             * @returns {Promise<void>}
             */
            async loadAssets () {

                let levelUrl
                let skyboxUrls

                if (this.isTouchDevice) {

                    levelUrl = "assets/level/Level_256_combined.glb"

                    skyboxUrls = [
                        "assets/textures/skyboxes/Skybox2_8/512/SkyboxX+.png",
                        "assets/textures/skyboxes/Skybox2_8/512/SkyboxX-.png",
                        "assets/textures/skyboxes/Skybox2_8/512/SkyboxY+.png",
                        "assets/textures/skyboxes/Skybox2_8/512/SkyboxY-.png",
                        "assets/textures/skyboxes/Skybox2_8/512/SkyboxZ+.png",
                        "assets/textures/skyboxes/Skybox2_8/512/SkyboxZ-.png"
                    ]

                }
                else {

                    levelUrl = "assets/level/Level_256_combined.glb"

                    skyboxUrls = [
                        "assets/textures/skyboxes/Skybox2_8/1024/SkyboxX+.png",
                        "assets/textures/skyboxes/Skybox2_8/1024/SkyboxX-.png",
                        "assets/textures/skyboxes/Skybox2_8/1024/SkyboxY+.png",
                        "assets/textures/skyboxes/Skybox2_8/1024/SkyboxY-.png",
                        "assets/textures/skyboxes/Skybox2_8/1024/SkyboxZ+.png",
                        "assets/textures/skyboxes/Skybox2_8/1024/SkyboxZ-.png"
                    ]

                }


                const promises = [
                    this.loaderManager.loadGLTF(levelUrl),
                    this.loaderManager.loadGLTF("assets/level/LevelNavigation6.glb"),
                    this.loaderManager.loadSkybox(skyboxUrls),
                    this.loaderManager.loadAudio("assets/audio/Corridor_192cbr.mp3"),
                    this.loaderManager.loadAudio("assets/audio/Bridge_192cbr.mp3"),
                    this.loaderManager.loadAudio("assets/audio/Stairway3_128cbr.mp3")
                ]

                const [
                    gltfLevel,
                    gltfNavmesh,
                    skybox,
                    corridorBuffer,
                    bridgeBuffer,
                    stairwayBuffer
                ] = await Promise.all(promises)

                this.level = gltfLevel.scene.children[0]
                this.navmesh = gltfNavmesh.scene.children[0]

                this.skyboxes.push(skybox)

                this.sounds = {}

                const corridorSound = new T.Audio(this.audioListener)
                corridorSound.setBuffer(corridorBuffer)
                corridorSound.gain.disconnect()
                corridorSound.gain.connect(this.audioGlobalGain)

                const bridgeSound = new T.Audio(this.audioListener)
                bridgeSound.setBuffer(bridgeBuffer)
                bridgeSound.gain.disconnect()
                bridgeSound.gain.connect(this.audioGlobalGain)

                const stairwaySound = new T.Audio(this.audioListener)
                stairwaySound.setBuffer(stairwayBuffer)
                stairwaySound.gain.disconnect()
                stairwaySound.gain.connect(this.audioGlobalGain)

                this.sounds[this.zones.corridor] = corridorSound
                this.sounds[this.zones.bridge] = bridgeSound
                this.sounds[this.zones.stairway] = stairwaySound

            },

            /**
             * Initialize skyboxes
             */
            initSkyboxes () {

                if (!this.skyboxes.length) {
                    throw "Skyboxes has not been loaded"
                }

                this.scene.visible = false

                // // load skyboxes on gpu
                // for (const skybox of this.skyboxes) {
                //     skybox.encoding = T.sRGBEncoding
                //     this.scene.background = skybox
                // }

                this.skyboxIndex = 0

                this.skyboxes[this.skyboxIndex].encoding = T.sRGBEncoding
                this.scene.background = this.skyboxes[this.skyboxIndex]
                this.scene.visible = true

            },

            /**
             * Initialize lights
             */
            initLights () {

                const ambientColor = 0xFFBF4D

                const addAmbientLight = () => {

                    const ambientLight = new T.AmbientLight(ambientColor, 0.4)
                    this.scene.add(ambientLight)

                }

                const addDirectionalLight = () => {

                    const directionalLight = new T.DirectionalLight(ambientColor, 0.12)
                    const position = new T.Vector3(0, 14, 68)
                    position.applyQuaternion(this.level.quaternion) // apply level rotation to light
                    directionalLight.position.set(position.x, position.y, position.z)

                    directionalLight.castShadow = true
                    directionalLight.shadow.mapSize.set(512, 512)
                    directionalLight.shadow.bias = 0.0002
                    directionalLight.shadow.camera.near = 1
                    directionalLight.shadow.camera.far = 100

                    const d = 20

                    directionalLight.shadow.camera.left = -d
                    directionalLight.shadow.camera.right = d
                    directionalLight.shadow.camera.top = d
                    directionalLight.shadow.camera.bottom = -d

                    this.scene.add(directionalLight)
                    // this.scene.add(new T.CameraHelper(directionalLight.shadow.camera))
                    // this.scene.add(new T.DirectionalLightHelper(directionalLight, 5))

                    // for testing shadow
                    const plane = new T.Mesh(
                        new T.PlaneGeometry(50, 50),
                        new T.MeshStandardMaterial({
                            color: 0x888888
                        })
                    )

                    plane.rotation.x = -Math.PI / 2
                    plane.receiveShadow = true
                    plane.position.set(0, 0.1, 15)

                    const cube = new T.Mesh(
                        new T.BoxGeometry(1.5, 1.5, 1.5),
                        new T.MeshStandardMaterial({
                            color: 0xff0000,
                            metalness: 0.9,
                            roughness: 0.2
                        })
                    )

                    cube.castShadow = true
                    cube.position.set(-1, 1.5, 20)

                    // this.scene.add(plane)
                    // this.scene.add(cube)


                    const shadowParams = [
                        {
                            name: "lightPositionZ",
                            lightPositionZ: 300,
                            min: 50,
                            max: 300,
                            cb: (v) => { directionalLight.position.z = v }
                        },
                        {
                            name: "lightPositionY",
                            lightPositionY: 47,
                            min: 1,
                            max: 100,
                            cb: (v) => { directionalLight.position.y = v }
                        },


                    ]

                    // initDatGUI(shadowParams)

                }

                const addPointLights = () => {

                    const pivot = this.scene.getObjectByName("PointLight_FFBF4D_1_6")
                        .position
                        .applyQuaternion(this.level.quaternion) // apply level rotation to pivot point

                    const pointLight1 = new T.PointLight(ambientColor, 1.0)
                    pointLight1.rotation.setFromQuaternion(this.level.quaternion) // apply level rotation to light

                    pointLight1.position.set(pivot.x, pivot.y, pivot.z)
                    pointLight1.translateZ(32)

                    pointLight1.intensity = 0.5
                    pointLight1.distance = 100
                    pointLight1.decay = 2

                    this.scene.add(pointLight1)

                    // let pointLight1Helper = new T.PointLightHelper(pointLight1, pointLight1.distance)
                    // this.scene.add(pointLight1Helper)

                    const tuning = () => {
                        const params = [
                            {
                                name: "posY",
                                posY: pointLight1.position.y,
                                min: -100,
                                max: 100,
                                step: 1,
                                cb: (v) => {
                                    pointLight1.position.y = v
                                    pointLight1Helper.update()
                                }
                            },
                            {
                                name: "intensity",
                                intensity: pointLight1.intensity,
                                min: 0.00,
                                max: 2.00,
                                step: 0.01,
                                cb: (v) => {
                                    pointLight1.intensity = v
                                }
                            },
                            {
                                name: "distance",
                                distance: pointLight1.distance,
                                min: 1,
                                max: 100,
                                step: 1,
                                cb: (v) => {
                                    pointLight1.distance = v
                                    this.scene.remove(pointLight1Helper)
                                    pointLight1Helper = new T.PointLightHelper(pointLight1, pointLight1.distance)
                                    this.scene.add(pointLight1Helper)
                                }
                            },
                            {
                                name: "decay",
                                decay: pointLight1.decay,
                                min: 0,
                                max: 2,
                                step: 0.01,
                                cb: (v) => { pointLight1.decay = v }
                            }
                        ]

                        let translateX = 0
                        let translateZ = 0

                        this.eventManager.addDomEvent(document, "keyup", e => {

                            switch (e.keyCode) {

                                // X
                                case 88:
                                    pointLight1.translateX(1)
                                    pointLight1Helper.update()
                                    translateX += 1
                                    break

                                // Z
                                case 90:
                                    pointLight1.translateX(-1)
                                    pointLight1Helper.update()
                                    translateX -= 1
                                    break

                                // V
                                case 86:
                                    pointLight1.translateZ(1)
                                    pointLight1Helper.update()
                                    translateZ += 1
                                    break

                                // C
                                case 67:
                                    pointLight1.translateZ(-1)
                                    pointLight1Helper.update()
                                    translateZ -= 1
                                    break

                                // Spacebar
                                case 32:
                                    console.log(pointLight1, translateX, translateZ)
                                    break

                            }

                        })

                        initDatGUI(params)
                    }

                    // tuning()

                }

                addAmbientLight()
                addDirectionalLight()
                addPointLights()

            },

            /**
             * Initialize scene level
             */
            initLevel () {

                if (!this.level) {
                    throw "Level has not been loaded"
                }

                const propellers = []

                sceneTraverse(this.level, async (o) => {

                    // MESH
                    if (o.type && o.type === "Mesh") {

                        if (o.name.startsWith("FLOORS_SHADOW")) {

                            o.castShadow = false
                            o.receiveShadow = true

                        }
                        else if (o.name === "WALLS_SHADOW [Combined]_0") {

                            o.castShadow = true
                            o.receiveShadow = false

                        }
                        else if (o.name.startsWith("Propeller")) {

                            propellers.push(o)

                        }
                        else if (o.name.startsWith("Door_Area")) {

                            o.visible = false

                        }
                        else if (o.name.startsWith("PolyArea")) {

                            o.visible = false

                        }
                        else if (o.name === "Porthole_01_Long_FRONT_glass") {

                            o.visible = false
                            // o.material.depthWrite = false

                        }
                        else if (o.name === "Cylinder_Stargate") {

                            o.material = new T.MeshNormalMaterial({
                                transparent: true,
                                opacity: 0,
                                side: T.DoubleSide,
                                depthWrite: false
                            })

                            o.visible = false

                        }
                        else if (o.name === "Command_Desk_Box_GUI") {

                            o.visible = false

                        }

                    }

                    // MATERIAL
                    if (o.material && o.material.name) {

                        if (o.material.name.startsWith("HD_Floor")) {
                            o.material.roughness = 0.6
                            o.material.metalness = 0.8
                        }

                        else if (o.material.name.startsWith("HD_Wall")) {
                            o.material.roughness = 0.6
                            o.material.metalness = 0.99
                        }

                        // Stargate rings
                        else if (o.material.name === "Compendio_03_ER_MOD") {
                            o.material.roughness = 0.4
                            o.material.metalness = 0.99
                        }

                    }

                })

                this.fnlp.push(() => {

                    for (const o of propellers) {
                        o.rotation.z += 0.05
                    }

                })

                // scale level if needed
                if (this.scale > 1) {
                    this.level.scale.set(this.scale, this.scale, this.scale)
                }

                this.scene.add(this.level)
                // console.log(this.level)

                const params = [
                    {
                        name: "rotationX",
                        rotationX: this.level.rotation.x,
                        min: -Math.PI / 2,
                        max: Math.PI / 2,
                        step: 0.01,
                        cb: (v) => this.level.rotation.set(v, this.level.rotation.y, this.level.rotation.z)
                    },
                    {
                        name: "rotationY",
                        rotationY: this.level.rotation.y,
                        min: -Math.PI / 2,
                        max: Math.PI / 2,
                        step: 0.01,
                        cb: (v) => this.level.rotation.set(this.level.rotation.x, v, this.level.rotation.z)
                    },
                    {
                        name: "rotationZ",
                        rotationZ: this.level.rotation.z,
                        min: -Math.PI / 2,
                        max: Math.PI / 2,
                        step: 0.01,
                        cb: (v) => {
                            this.level.rotation.set(this.level.rotation.x, this.level.rotation.y, v)
                        }
                    }
                ]

                // initDatGUI(params)

            },

            /**
             * Initialize mouse controls
             */
            async initMouseControls () {

                const addCameraTarget = () => {
                    let div = document.createElement("div")
                    div.style.width = "4px"
                    div.style.height = "4px"
                    div.style.background = "white"
                    div.style.position = "absolute"
                    div.style.borderRadius = "2px"
                    div.style.top = "0"
                    div.style.left = "0"
                    div.style.right = "0"
                    div.style.bottom = "0"
                    div.style.margin = "auto"
                    div.style.zIndex= "99"
                    div.style.display= "none"
                    return div
                }

                const cameraTargetDiv = addCameraTarget()
                this.domElement.appendChild(cameraTargetDiv)

                let startPoint = this.scene.getObjectByName("StartPoint") ?
                    this.scene.getObjectByName("StartPoint").position : new T.Vector3(0, 0, 0)

                startPoint = startPoint.applyQuaternion(this.level.quaternion)

                let moveSpeed = 50.0 * this.scale
                const moveSpeedIncrFactor = 1.75 // boost on shift
                let prevTime = performance.now()
                let time
                let delta
                let velocity = new THREE.Vector3()
                let direction = new THREE.Vector3()
                const X_axis = new T.Vector3(1, 0, 0)
                const Z_axis = new T.Vector3(0, 0, 1)
                let delta_1
                let delta_2
                let isMovingX = false
                let isMovingZ = false
                let isRunning = false

                // reset camera position and rotation
                this.camera.position.set(0, 0, 0)
                this.camera.rotation.set(0, 0, 0)

                this.controls = new MyPointerLockControls(this.camera, this.domElement, this.cameraOffsetY)
                const yawObject = this.controls.getObject()
                yawObject.position.set(startPoint.x, this.cameraOffsetY, startPoint.z)
                yawObject.rotation.y = -this.level.rotation.y
                this.scene.add(yawObject)

                this.controls.forward =  false
                this.controls.backward =  false
                this.controls.left =  false
                this.controls.right =  false

                const onKeyDown = (e) => {
                    switch (e.keyCode) {
                        case 38: // up
                        case 87: // w
                            this.controls.forward = true
                            break

                        case 37: // left
                        case 65: // a
                            this.controls.left = true
                            break

                        case 40: // down
                        case 83: // s
                            this.controls.backward = true
                            break

                        case 39: // right
                        case 68: // d
                            this.controls.right = true
                            break

                        default:
                            break
                    }
                }

                const onKeyUp = (e) => {
                    switch (e.keyCode) {
                        case 38: // up
                        case 87: // w
                            this.controls.forward = false
                            break

                        case 37: // left
                        case 65: // a
                            this.controls.left = false
                            break

                        case 40: // down
                        case 83: // s
                            this.controls.backward = false
                            break

                        case 39: // right
                        case 68: // d
                            this.controls.right = false
                            break

                        default:
                            break
                    }
                }

                let overlay = document.createElement("div")
                overlay.setAttribute("id", "pointerLockOverlay")
                overlay.style.position = "absolute"
                overlay.style.top = "0px"
                overlay.style.left = "0px"
                overlay.style.width = "100vw"
                overlay.style.height = "100vh"
                overlay.style.zIndex = "1"
                overlay.style.background = "rgba(0, 0, 0, 0.5)"
                overlay.style.color = "#fff"
                overlay.style.textShadow = "0 0 8px white"
                overlay.style.textAlign = "center"
                overlay.style.verticalAlign = "middle"
                overlay.style.lineHeight = "100vh"
                overlay.style.fontFamily = "Neuropol"
                overlay.style.fontSize = "1em"
                overlay.textContent = "Click to start"
                overlay.style.cursor = "pointer"
                overlay.style.display = "none"
                this.domElement.appendChild(overlay)

                const overlayOnClik = (e) => {

                    e.stopPropagation()
                    e.preventDefault()

                    if (!this.controls.isLocked) {
                        this.controls.lock()
                        overlay.style.display = "none"
                    }
                }

                const onPointerLock = (e) => {
                    overlay.style.display = "none"
                    cameraTargetDiv.style.display = "block"

                    if (e.data && e.data.startWebGL) {
                        this.startWebGL()
                    }
                    else {
                        this.startWebGL()
                    }
                }

                const onPointerUnlock = (e) => {
                    cameraTargetDiv.style.display = "none"

                    if (!e.data || e.data && e.data.stopWebGL) {
                        overlay.style.display = "block"
                        this.stopWebGL()
                    }
                    else {
                        overlay.style.display = "none"
                    }
                }

                this.eventManager.addDomEvent(overlay, "click", overlayOnClik)
                this.eventManager.addDomEvent(document, "keydown", onKeyDown)
                this.eventManager.addDomEvent(document, "keyup", onKeyUp)
                this.eventManager.addDomEvent(this.controls, "lock", onPointerLock)
                this.eventManager.addDomEvent(this.controls, "unlock", onPointerUnlock)

                // Level polygon perimeter; update vertices with world scale and quaternion
                const levelPolyTransform = LEVEL_POLY.map(p =>
                    p.applyQuaternion(this.level.quaternion).multiply(this.level.scale))

                // Command console polygon perimeter; update vertices with world scale and quaternion
                const commandConsolePolyTransform = COMMAND_CONSOLE_POLY.map(p =>
                    p.applyQuaternion(this.level.quaternion).multiply(this.level.scale))

                const LEVEL_NVERT = levelPolyTransform.length
                const LEVEL_VERT_X = levelPolyTransform.map(p => p.x)
                const LEVEL_VERT_Y = levelPolyTransform.map(p => p.z)

                const CC_NVERT = commandConsolePolyTransform.length
                const CC_VERT_X = commandConsolePolyTransform.map(p => p.x)
                const CC_VERT_Y = commandConsolePolyTransform.map(p => p.z)

                // Only for testing
                const showNavPolygon = () => {
                    const lineGeometry = new T.Geometry();
                    levelPolyTransform.forEach(p => lineGeometry.vertices.push(p))
                    const polyLine = new T.Line(lineGeometry, new T.LineBasicMaterial({color: 0xff0000}))
                    this.scene.add(polyLine)

                    const lineGeometry2 = new T.Geometry();
                    commandConsolePolyTransform.forEach(p => lineGeometry2.vertices.push(p))
                    const polyLine2 = new T.Line(lineGeometry2, new T.LineBasicMaterial({color: 0x0000ff}))
                    this.scene.add(polyLine2)
                }

                const footstepSound = async () => {

                    const floorBuffers = [
                        await this.loaderManager.loadAudio("assets/audio/Footstep01_128cbr.mp3"),
                        await this.loaderManager.loadAudio("assets/audio/Footstep02_128cbr.mp3"),
                        await this.loaderManager.loadAudio("assets/audio/Footstep03_128cbr.mp3"),
                        await this.loaderManager.loadAudio("assets/audio/Footstep04_128cbr.mp3")
                    ]

                    const stairwayBuffers = [
                        await this.loaderManager.loadAudio("assets/audio/footstep_grate_1_128cbr.mp3"),
                        await this.loaderManager.loadAudio("assets/audio/footstep_grate_2_128cbr.mp3"),
                        await this.loaderManager.loadAudio("assets/audio/footstep_grate_3_128cbr.mp3"),
                        await this.loaderManager.loadAudio("assets/audio/footstep_grate_4_128cbr.mp3")
                    ]

                    const walkTime = 500
                    const runTime = 288
                    const idleTime = 100
                    const sound = new T.Audio(this.audioListener)
                    sound.setLoop(false)
                    sound.setVolume(0.075)

                    let id
                    let buffer
                    let delay
                    let floorIndex = 0
                    let stairwayIndex = 0

                    const handler = () => {

                        delay = idleTime

                        if (isMovingZ || isMovingX) {

                            buffer = this.playerZone === this.zones.stairway ?
                                stairwayBuffers[stairwayIndex++ % stairwayBuffers.length] :
                                floorBuffers[floorIndex++ % floorBuffers.length]

                            delay = isRunning ? runTime : walkTime

                            sound.isPlaying && sound.stop()
                            sound.setBuffer(buffer)
                            sound.play()

                        }

                        id = setTimeout(handler, delay)

                    }

                    // Start
                    id = setTimeout(handler, idleTime)

                }

                this.fnlp.push(() => {

                    if (!this.controls.isLocked || !this.controls.enabled) {
                        return
                    }

                    time = performance.now()
                    delta = ( time - prevTime ) / 1000
                    prevTime = time

                    direction.z = Number(this.controls.forward) - Number(this.controls.backward)
                    direction.x = Number(this.controls.left) - Number(this.controls.right)
                    direction.normalize()

                    velocity.x -= velocity.x * 10.0 * delta;
                    velocity.z -= velocity.z * 10.0 * delta;


                    if (this.controls.forward || this.controls.backward) {

                        velocity.z -= direction.z * moveSpeed * delta
                        delta_1 = Z_axis.clone().applyQuaternion(yawObject.quaternion).multiplyScalar(velocity.z * delta)

                        if (isInsidePolygon(LEVEL_NVERT, LEVEL_VERT_X, LEVEL_VERT_Y, yawObject.position.x + delta_1.x, yawObject.position.z + delta_1.z)) {
                            // Avoid navigation over command console (bridge)
                            if (this.playerZone !== this.zones.bridge || !isInsidePolygon(CC_NVERT, CC_VERT_X, CC_VERT_Y, yawObject.position.x + delta_1.x, yawObject.position.z + delta_1.z)) {
                                isMovingZ = true
                                yawObject.position.add(delta_1)
                            }
                            else {
                                isMovingZ = false
                            }
                        }

                        // yawObject.position.add(delta_1)

                    }
                    else {
                        isMovingZ = false
                    }

                    if (this.controls.left || this.controls.right) {

                        velocity.x -= direction.x * moveSpeed * delta

                        delta_2 = X_axis.clone().applyQuaternion(yawObject.quaternion).multiplyScalar(velocity.x * delta)

                        if (isInsidePolygon(LEVEL_NVERT, LEVEL_VERT_X, LEVEL_VERT_Y, yawObject.position.x + delta_2.x, yawObject.position.z + delta_2.z)) {
                            // Avoid navigation over command console (bridge)
                            if (this.playerZone !== this.zones.bridge || !isInsidePolygon(CC_NVERT, CC_VERT_X, CC_VERT_Y, yawObject.position.x + delta_2.x, yawObject.position.z + delta_2.z)) {
                                isMovingX = true
                                yawObject.position.add(delta_2)
                            }
                            else {
                                isMovingX = false
                            }
                        }

                        // yawObject.position.add(delta_2)

                    }
                    else {
                        isMovingX = false
                    }

                })

                const onShiftKeyDown = (e) => {
                    // SHIFT
                    if (e.keyCode === 16) {
                        moveSpeed *= moveSpeedIncrFactor
                        isRunning = true
                        this.eventManager.removeDomEvent(document, "keydown", onShiftKeyDown)
                    }
                }

                const onShiftKeyUp = (e) => {
                    // SHIFT
                    if (e.keyCode === 16) {
                        moveSpeed /= moveSpeedIncrFactor
                        isRunning = false
                        this.eventManager.addDomEvent(document, "keydown", onShiftKeyDown)
                    }
                }

                this.eventManager.addDomEvent(document, "keydown", onShiftKeyDown)
                this.eventManager.addDomEvent(document, "keyup", onShiftKeyUp)

                // start footstep sound loop
                footstepSound()

            },

            /**
             * Initialize touch controls
             */
            initTouchControls () {

                const scope = this

                const createHoledCircle = (color = 0x1EA4F9) => {

                    const circleShape = new T.Shape()
                    circleShape.moveTo(0, 0)
                    circleShape.absarc(0, 0, 0.5, 0, 2 * Math.PI, false)

                    const holePath = new T.Path()
                    holePath.moveTo(0, 0)
                    holePath.absarc(0, 0, 0.4, 0, Math.PI * 2, true)

                    circleShape.holes.push(holePath)

                    const mesh = new T.Mesh(
                        new T.ShapeGeometry(circleShape),
                        new T.MeshBasicMaterial({
                            color: color,
                            transparent: true,
                            opacity: 0.4
                        })
                    )

                    mesh.rotation.x = - Math.PI / 2
                    mesh.position.y = 0.05

                    return mesh
                }

                const tweenOpacityYoyo = (obj3D, min = 0.1, max = 0.5, time = 500) => {

                    const from = {v: min}
                    const to = {v: max}

                    return new TWEEN.Tween(from, this.tweenGroupNavigation)
                        .to(to, time)
                        .easing(TWEEN.Easing.Quadratic.InOut)
                        .repeat(Infinity)
                        .yoyo()
                        .onUpdate(() => {
                            obj3D.material.opacity = from.v
                        })

                }

                const holedCircle = createHoledCircle()
                holedCircle.visible = false
                this.scene.add(holedCircle)

                const startPoint = this.scene.getObjectByName("StartPoint").position.applyQuaternion(this.level.quaternion)
                const startRotY = Math.PI

                this.camera.position.set(startPoint.x, this.cameraOffsetY, startPoint.z)
                this.camera.rotation.set(0, startRotY, 0)

                const player = new T.Mesh(new T.SphereGeometry(0.3, 0.3, 0.3), new T.MeshBasicMaterial({color: "red"}))
                player.position.set(startPoint.x, 0, startPoint.z)
                player.visible = false
                this.scene.add(player)

                this.controls = new MyDeviceOrientationControls(this.camera, player, startRotY)
                this.controls.alphaOffset = 2 * Math.PI - this.level.rotation.y // Add level initial rotation (y)

                const ZONE = "level"
                let groupID
                let path

                const targetPosition = new T.Vector3();

                const pathfinder = new Pathfinding();
                const touchPoint = new T.Vector2();
                const raycaster = new T.Raycaster();

                // const helper = new PathfindingHelper();
                // this.scene.add(helper);

                // Extract geometry and apply scale and rotation
                let geometry = this.navmesh.geometry.clone()

                if (this.scale > 1) {
                    geometry = geometry.scale(this.scale, this.scale, this.scale)
                }

                geometry.rotateX(this.level.rotation.x)
                geometry.rotateY(this.level.rotation.y)
                geometry.rotateZ(this.level.rotation.z)

                // create navmesh with geometry scaled and rotated
                const navmesh = new T.Mesh(
                    geometry,
                    new T.MeshBasicMaterial({
                        color: 0x115511,
                        transparent: true,
                        opacity: 0.5,
                        visible: false
                    })
                )

                navmesh.position.set(navmesh.position.x, 0, navmesh.position.z)
                this.scene.add(navmesh)

                const zone = Pathfinding.createZone(geometry);
                pathfinder.setZoneData(ZONE, zone);
                groupID = pathfinder.getGroup(ZONE, player.position);

                const touchMoveHook = (deltaPageX) => {

                    this.controls.alphaOffset += deltaPageX * .007

                }

                const touchEndHook = (clientX, clientY) => {

                    if (!this.controls.enabled || this.touchManager.isTouchMove) {
                        return
                    }

                    const commandDeskBoxGUIClone = this.scene.getObjectByName("Command_Desk_Box_GUI_clone") // created in initUserInteractions -> stargate
                    const commandDeskModuleEdgesGeo = this.scene.getObjectByName("Command_Desk_Module_EdgesGeometry") // created in initUserInteractions -> stargate

                    touchPoint.x = (clientX / scope.width) * 2 - 1
                    touchPoint.y = -(clientY / scope.height) * 2 + 1

                    player.updateMatrixWorld()

                    raycaster.setFromCamera(touchPoint, this.camera)

                    // Cancel if it is interaction with command desk
                    if (commandDeskModuleEdgesGeo.visible && raycaster.intersectObject(commandDeskBoxGUIClone).length) {
                        return
                    }

                    // Cancel if no intersection with navmesh
                    const intersects = raycaster.intersectObject(navmesh)

                    if (!intersects.length) {
                        return
                    }

                    targetPosition.copy(intersects[0].point)
                    targetPosition.y = player.position.y

                    // helper.reset().setPlayerPosition(player.position)

                    const targetGroupID = pathfinder.getGroup(ZONE, targetPosition, true)
                    const closestTargetNode = pathfinder.getClosestNode(targetPosition, ZONE, targetGroupID, true)

                    // helper.setTargetPosition(targetPosition)
                    // if (closestTargetNode) helper.setNodePosition(closestTargetNode.centroid)

                    // Calculate a path to the target and store it
                    path = pathfinder.findPath(player.position, targetPosition, ZONE, groupID)

                    if (path && path.length) {

                        // remove duplicates nodes (why does it happen??)
                        for (let i = 1; i < path.length; ++i) {
                            if (path[i].equals(path[i - 1])) {
                                path.splice(i, 1)
                            }
                        }

                        // helper.setPath(path);

                        // clear current navigation tweens
                        this.tweenGroupNavigation.removeAll()

                        // position holedCircle at touch point
                        const lastPathNode = path[path.length - 1]
                        holedCircle.position.set(lastPathNode.x, holedCircle.position.y, lastPathNode.z)

                        // start opacity tween and make holedCircle visible
                        tweenOpacityYoyo(holedCircle).start()
                        holedCircle.visible = true

                        // -------------------------------------------------

                        tweens = []
                        times = []

                        // compute times according to distance between path nodes to have a uniform speed
                        const nodes = [player.position].concat(path)

                        for (let i = 0; i < nodes.length - 1; ++i) {
                            times.push(nodes[i].distanceTo(nodes[i + 1]) * speedFactor)
                        }

                        // create tweens
                        while (path.length) {
                            pathNodeTarget = path.shift()

                            tweens.push(
                                new TWEEN.Tween(player.position, this.tweenGroupNavigation)
                                    .to(pathNodeTarget, times.shift())
                            )

                            // Add onComplete hook on last tween
                            if (!path.length) {
                                tweens[tweens.length - 1].onComplete(() => {
                                    isMoving = false
                                    holedCircle.visible = false
                                    this.tweenGroupNavigation.removeAll()
                                })
                            }
                        }

                        // chain tweens
                        for (let i = 0; i < tweens.length - 1; ++i) {
                            tweens[i].chain(tweens[i + 1])
                        }

                        // start first tween to begin path
                        tweens[0].start()
                        isMoving = true

                        // -------------------------------------------------

                    } else {

                        const closestPlayerNode = pathfinder.getClosestNode(player.position, ZONE, groupID);
                        const clamped = new T.Vector3();

                        // TODO(donmccurdy): Don't clone targetPosition, fix the bug.
                        pathfinder.clampStep(
                            player.position, targetPosition.clone(), closestPlayerNode, ZONE, groupID, clamped);

                        // helper.setStepPosition(clamped);

                    }

                }

                this.touchManager.addTouchMoveHook(touchMoveHook)
                this.touchManager.addTouchEndHook(touchEndHook)

                const speedFactor = 150 * this.scale
                let tweens = []
                let times = []
                let pathNodeTarget
                let isMoving = false

                const footstepSound = async () => {

                    const floorBuffers = [
                        await this.loaderManager.loadAudio("assets/audio/Footstep01_128cbr.mp3"),
                        await this.loaderManager.loadAudio("assets/audio/Footstep02_128cbr.mp3"),
                        await this.loaderManager.loadAudio("assets/audio/Footstep03_128cbr.mp3"),
                        await this.loaderManager.loadAudio("assets/audio/Footstep04_128cbr.mp3")
                    ]

                    const stairwayBuffers = [
                        await this.loaderManager.loadAudio("assets/audio/footstep_grate_1_128cbr.mp3"),
                        await this.loaderManager.loadAudio("assets/audio/footstep_grate_2_128cbr.mp3"),
                        await this.loaderManager.loadAudio("assets/audio/footstep_grate_3_128cbr.mp3"),
                        await this.loaderManager.loadAudio("assets/audio/footstep_grate_4_128cbr.mp3")
                    ]

                    const walkTime = 500
                    const idleTime = 100
                    const sound = new T.Audio(this.audioListener)
                    sound.setLoop(false)
                    sound.setVolume(0.075)

                    let id
                    let buffer
                    let delay
                    let floorIndex = 0
                    let stairwayIndex = 0

                    const handler = () => {

                        delay = idleTime

                        if (isMoving) {

                            buffer = this.playerZone === this.zones.stairway ?
                                stairwayBuffers[stairwayIndex++ % stairwayBuffers.length] :
                                floorBuffers[floorIndex++ % floorBuffers.length]

                            delay = walkTime

                            sound.isPlaying && sound.stop()
                            sound.setBuffer(buffer)
                            sound.play()

                        }

                        id = setTimeout(handler, delay)

                    }

                    id = setTimeout(handler, idleTime)

                }

                // Update loop
                this.fnlp.push((elapsed, delta) => {

                    if (!this.controls.enabled) {
                        return
                    }

                    this.controls.update()
                    this.camera.position.set(player.position.x, this.cameraOffsetY, player.position.z)

                })

                // Start audio footstep
                footstepSound()

            },

            /**
             * Initialize user interactions
             */
            async initUserInteractions () {

                const worldConsoleMessage = $("#worldConsoleMessage") // to hide in case of transition
                const playerPosition = this.controls.getObject().position

                const stargateInteraction = async () => {

                    const pbar = {
                        container: document.getElementById("pbarContainer"),
                        inner: document.getElementById("pbarInner"),
                        value: document.getElementById("pbarValue")
                    }

                    const cylinderStargate = this.scene.getObjectByName("Cylinder_Stargate")
                    let cylinderStargateRotationStep = 0

                    const brightnessContrastEffect = this.postProcessingEffects["brightnessContrastEffect"]
                    const brightnessDefault = 0.036

                    let isLoading = false

                    const stargateSound = new T.Audio(this.audioListener)
                    stargateSound.buffer = await this.loaderManager.loadAudio("assets/audio/Stargate_128cbr.mp3")
                    stargateSound.gain.disconnect()
                    stargateSound.gain.connect(this.audioGlobalGain)

                    const stargateCylinderSound = new T.PositionalAudio(this.audioListener)
                    stargateCylinderSound.setVolume(0)
                    stargateCylinderSound.panner.panningModel = "HRTF"
                    stargateCylinderSound.panner.distanceModel = "inverse"
                    stargateCylinderSound.panner.refDistance = 1
                    stargateCylinderSound.panner.maxDistance = 1000
                    stargateCylinderSound.panner.rolloffFactor = 0.6
                    stargateCylinderSound.panner.coneInnerAngle = 360
                    stargateCylinderSound.panner.coneOuterAngle = 0
                    stargateCylinderSound.panner.coneOuterGain = 0
                    stargateCylinderSound.setBuffer(await this.loaderManager.loadAudio("assets/audio/StargateCylinder_128cbr.mp3"))
                    stargateCylinderSound.setLoop(true)
                    stargateCylinderSound.gain.disconnect()
                    stargateCylinderSound.gain.connect(this.audioGlobalGain)
                    cylinderStargate.add(stargateCylinderSound)

                    const loadTime = 8000
                    const fadeTime = 1000
                    let timeoutId

                    const brightnessTween = (value, time, onComplete) => {

                        const from = {v: brightnessContrastEffect.uniforms.get("brightness").value}
                        const to = {v: value}

                        return new TWEEN.Tween(from, this.tweenGroupStargate)
                            .to(to, time)
                            .easing(TWEEN.Easing.Quadratic.In)
                            .onUpdate(() => {
                                brightnessContrastEffect.uniforms.get("brightness").value = from.v
                            })
                            .onComplete(() => {
                                onComplete && typeof onComplete === "function" && onComplete()
                            })

                    }

                    const progressBarTween = (time, onComplete) => {

                        pbar.container.style.display = "block"
                        const from = {v: 0.0}
                        const to = {v: 100.0}

                        return new TWEEN.Tween(from, this.tweenGroupStargate)
                            .to(to, time)
                            .easing(TWEEN.Easing.Quadratic.In)
                            .onUpdate(() => {
                                pbar.inner.style.width = `${from.v}%`
                                pbar.value.textContent = `${Math.floor(from.v)}%`
                            })
                            .onComplete(() => {
                                onComplete && typeof onComplete === "function" && onComplete()
                                pbar.container.style.display = "none"
                            })

                    }

                    const stargateCylinderOpacityTween = (opacity, time, onComplete) => {

                        const from = {v: cylinderStargate.material.opacity}
                        const to = {v: opacity}

                        if (opacity > 0) {
                            cylinderStargate.visible = true
                        }

                        return new TWEEN.Tween(from, this.tweenGroupStargate)
                            .to(to, time)
                            .easing(TWEEN.Easing.Quadratic.In)
                            .onUpdate(() => {
                                cylinderStargate.material.opacity = from.v
                            })
                            .onComplete(() => {
                                if (opacity === 0) {
                                    cylinderStargate.visible = false
                                }
                                onComplete && typeof onComplete === "function" && onComplete()
                            })

                    }

                    const stargateCylinderRotationTween = (value, time, onComplete) => {

                        const from = {v: 0}
                        const to = {v: value}

                        return new TWEEN.Tween(from, this.tweenGroupStargate)
                            .to(to, time)
                            .easing(TWEEN.Easing.Quadratic.In)
                            .onUpdate(() => {
                                cylinderStargateRotationStep = from.v
                            })
                            .onComplete(() => {
                                // cylinderStargateRotationStep = 0
                                onComplete && typeof onComplete === "function" && onComplete()
                            })

                    }

                    const startLoading = async () => {

                        this.isTransitionRunning = true
                        worldConsoleMessage.hide()
                        isLoading = true
                        this.isConsoleOpen = true
                        this.tweenGroupFXAudioFadeOut.removeAll()
                        this.tweenGroupFXAudioFadeIn.removeAll()
                        stargateSound.isPlaying && await this.audioFadeOut(stargateSound, fadeTime / 1000, 0, this.tweenGroupFXAudioFadeOut)
                        stargateCylinderSound.isPlaying && await this.audioFadeOut(stargateCylinderSound, fadeTime / 1000, 0, this.tweenGroupFXAudioFadeOut)
                        this.audioFadeIn(stargateSound, fadeTime / 1000, 1.0, this.tweenGroupFXAudioFadeIn)
                        this.audioFadeIn(stargateCylinderSound, fadeTime / 1000 * 2, 0.7, this.tweenGroupFXAudioFadeIn)
                        brightnessTween(1.0, loadTime).start()
                        progressBarTween(loadTime).start()
                        stargateCylinderOpacityTween(0.4, loadTime / 4).start()
                        stargateCylinderRotationTween(0.2, loadTime / 2).start()

                        timeoutId = setTimeout(() => {
                            // Check if WebGL has been disabled during animation
                            if (this.webGLRunning) {
                                this.controls.disable()
                                this.$store.commit(mutations.worldState, states.world.stop)
                                pbar.container.style.display = "none"
                                pbar.inner.style.width = `0%`
                                pbar.value.textContent = `0%`
                                brightnessContrastEffect.uniforms.get("brightness").value = brightnessDefault
                                this.isConsoleOpen = false
                                this.isTransitionRunning = false
                            }
                            stargateSound.isPlaying && stargateSound.stop()
                        }, loadTime + 100)

                    }

                    const stopLoading = async () => {

                        this.isTransitionRunning = false
                        isLoading = false
                        this.isConsoleOpen = false
                        timeoutId && clearTimeout(timeoutId)
                        this.tweenGroupAmbientAudioFadeOut.removeAll()
                        this.tweenGroupAmbientAudioFadeIn.removeAll()
                        this.tweenGroupStargate.removeAll()
                        this.audioFadeOut(stargateSound, fadeTime / 1000, 0, this.tweenGroupFXAudioFadeOut)
                        this.audioFadeOut(stargateCylinderSound, fadeTime / 1000 * 3, 0, this.tweenGroupFXAudioFadeOut)
                        brightnessTween(brightnessDefault, fadeTime).start()
                        stargateCylinderOpacityTween(0, loadTime / 4).start()
                        stargateCylinderRotationTween(-0.1, loadTime / 4).start()
                        pbar.container.style.display = "none"
                        pbar.inner.style.width = `0%`
                        pbar.value.textContent = `0%`

                    }

                    this.fnlp.push( async () => {

                        if (cylinderStargate.visible) {
                            cylinderStargate.rotation.z += cylinderStargateRotationStep
                        }

                        if (this.playerZone === this.zones.stargate) {
                            if (!isLoading) {
                                startLoading()
                            }

                        }
                        else {
                            if (isLoading) {
                                await stopLoading()
                            }
                        }

                    })

                    const onWebGLStop = () => {
                        timeoutId && clearTimeout(timeoutId)
                        stargateSound.isPlaying && stargateSound.stop()
                        // stargateCylinderSound.isPlaying && stargateCylinderSound.stop()
                        pbar.container.style.display = "none"
                        pbar.inner.style.width = `0%`
                        pbar.value.textContent = `0%`
                    }

                    // On WebGL stop, cancel transitions
                    this.eventManager.addBusEvent(EventManager.events.WORLD_WEBGL_STOP, onWebGLStop)

                }

                const commandPanelInteraction = async () => {

                    const tweenTimeMs = 1700 // transition duration

                    const sound = new T.Audio(this.audioListener)
                    sound.setBuffer(await this.loaderManager.loadAudio("assets/audio/CommandPanel_128cbr.mp3"))
                    sound.setVolume(1.0)
                    sound.setLoop(false)

                    const commandDeskBoxGUI = this.scene.getObjectByName("Command_Desk_Box_GUI").clone()
                    commandDeskBoxGUI.applyQuaternion(this.level.quaternion)
                    commandDeskBoxGUI.position.applyQuaternion(this.level.quaternion)
                    commandDeskBoxGUI.visible = true // Mesh must have visible=true for raycaster to work
                    commandDeskBoxGUI.material.visible = false
                    commandDeskBoxGUI.name = "Command_Desk_Box_GUI_clone"
                    this.scene.add(commandDeskBoxGUI)

                    const commandConsoleModule = this.scene.getObjectByName("Command_Desk_Module_Edges")
                    const raycaster = new T.Raycaster()
                    let targetDirection = new T.Vector3()
                    const touchPoint = new T.Vector2(); // for touch

                    // EdgeGeometry to display on interaction
                    let commandConsoleModuleEdges = new T.LineSegments(
                        new T.EdgesGeometry(commandConsoleModule.geometry),
                        new T.LineBasicMaterial({
                            color: 0xffffff,
                            transparent: true,
                            opacity: 0.8
                        })
                    )
                    commandConsoleModuleEdges.scale.set(1.01, 1.01, 1.01)
                    commandConsoleModuleEdges.visible = false
                    commandConsoleModuleEdges.name = "Command_Desk_Module_EdgesGeometry"
                    commandConsoleModule.add(commandConsoleModuleEdges)

                    this.fnlp.push(() => {
                        if (this.controls.enabled) {
                            if (this.playerZone === this.zones.bridge || this.playerZone === this.zones.stargate) {
                                this.controls.getDirection(targetDirection)
                                targetDirection.normalize()
                                raycaster.set(this.controls.getPosition(), targetDirection)
                                commandConsoleModuleEdges.visible = !!raycaster.intersectObject(commandDeskBoxGUI, false).length
                            }
                        }
                    })

                    const onClick = (e) => {
                        if (!commandConsoleModuleEdges.visible) {
                            return
                        }

                        this.isTransitionRunning = true
                        worldConsoleMessage.hide()

                        commandConsoleModuleEdges.visible = false
                        this.controls.enabled = false
                        !this.isTouchDevice && this.controls.unlock({stopWebGL: false})

                        const createTweenPosition = () => {
                            const from = this.controls.getPosition().clone()
                            const to = this.scene.getObjectByName("Command_Desk_GUI")
                                .position.clone()
                                .applyQuaternion(this.level.quaternion)

                            return new TWEEN.Tween(from, this.tweenGroupCommandConsole)
                                .to(to, tweenTimeMs)
                                .easing(TWEEN.Easing.Quadratic.InOut)
                                .onUpdate(() => {
                                    this.controls.setPositionXZ(from.x, from.z)
                                })
                        }

                        const createTweenRotation = () => {
                            const qStart = this.controls.getObject().quaternion.clone().normalize()
                            const euler = new T.Euler(0, 2 * Math.PI - this.level.rotation.y, 0)
                            euler.reorder("YXZ") // PointerLockControls and DeviceOrientationControls uses different axes order
                            const qEnd = new T.Quaternion().setFromEuler(euler).normalize()
                            const qTarget = new T.Quaternion()

                            const from = {t: 0}
                            const to = {t: 1}

                            return new TWEEN.Tween(from, this.tweenGroupCommandConsole)
                                .to(to, tweenTimeMs)
                                .easing(TWEEN.Easing.Quadratic.InOut)
                                .onUpdate(() => {
                                    T.Quaternion.slerp(qStart, qEnd, qTarget, from.t)
                                    this.controls.getObject().quaternion.set(qTarget.x, qTarget.y, qTarget.z, qTarget.w)
                                })
                                .onComplete(() => {
                                    if (this.isTouchDevice) {
                                        this.controls.alphaOffset = 2 * Math.PI - this.level.rotation.y
                                    }

                                    this.isCommandPanelVisible = true
                                    // this.controls.enabled = true
                                    this.isTransitionRunning = false
                                })
                        }

                        sound.isPlaying && sound.stop()
                        sound.play()
                        createTweenPosition().start()
                        createTweenRotation().start()
                    }

                    const onTouchEnd = (clientX, clientY) => {
                        if (!this.touchManager.isTouchMove) {
                            touchPoint.x = (clientX / this.width) * 2 - 1
                            touchPoint.y = -(clientY / this.height) * 2 + 1
                            this.controls.getObject().updateMatrixWorld()
                            raycaster.setFromCamera(touchPoint, this.camera)

                            // Check if touch is on command desk
                            if (raycaster.intersectObject(commandDeskBoxGUI).length) {
                                onClick()
                            }
                        }
                    }

                    if (this.isTouchDevice) {
                        this.touchManager.addTouchEndHook(onTouchEnd)
                    }
                    else {
                        this.eventManager.addDomEvent(this.domElement, "click", onClick)
                    }

                }

                const doorsInteraction = (doorAudioVolume = 0.3) => {

                    const SPEED_1 = 1000
                    const SPEED_2 = 400

                    let isCorridorDoorOpen = false
                    let isCorridorDoorOpening = false
                    let isCorridorDoorClosing = false

                    let isStairwayDoorLeftOpen = false
                    let isStairwayDoorLeftOpening = false
                    let isStairwayDoorLeftClosing = false

                    let isStairwayDoorRightOpen = false
                    let isStairwayDoorRightOpening = false
                    let isStairwayDoorRightClosing = false

                    // AREA 1 (corridor -> bridge)
                    const area1 = async () => {

                        const polyArea = polygonFromRect(
                            this.scene.getObjectByName("PolyArea_Door1"),
                            this.level.quaternion,
                            this.scene
                        )

                        const doorLeft = this.scene.getObjectByName("Door_Left_1")
                        const doorLeftClosedPos = doorLeft.position.clone()
                        const doorLeftOpenPos = doorLeftClosedPos.clone().add(new T.Vector3(-4, 0, 0))
                        const doorRight = this.scene.getObjectByName("Door_Right_1")
                        const doorRightClosedPos = doorRight.position.clone()
                        const doorRightOpenPos = doorRightClosedPos.clone().add(new T.Vector3(4, 0, 0))

                        // configure sounds
                        const buffer = await this.loaderManager.loadAudio("assets/audio/Pneumatic-door_128cbr.mp3")
                        const doorLeftSound = new T.PositionalAudio(this.audioListener)
                        const doorRightSound = new T.PositionalAudio(this.audioListener)
                        doorLeft.add(doorLeftSound)
                        doorRight.add(doorRightSound)

                        doorLeftSound.setVolume(doorAudioVolume)
                        doorLeftSound.panner.panningModel = "HRTF"
                        doorLeftSound.panner.distanceModel = "inverse"
                        doorLeftSound.panner.refDistance = 1
                        doorLeftSound.panner.maxDistance = 10000
                        doorLeftSound.panner.rolloffFactor = 0.9
                        doorLeftSound.panner.coneInnerAngle = 360
                        doorLeftSound.panner.coneOuterAngle = 0
                        doorLeftSound.panner.coneOuterGain = 0
                        doorLeftSound.gain.disconnect()
                        doorLeftSound.gain.connect(this.audioGlobalGain)

                        doorRightSound.setVolume(doorAudioVolume)
                        doorRightSound.panner.panningModel = "HRTF"
                        doorRightSound.panner.distanceModel = "inverse"
                        doorRightSound.panner.refDistance = 1
                        doorRightSound.panner.maxDistance = 10000
                        doorRightSound.panner.rolloffFactor = 0.9
                        doorRightSound.panner.coneInnerAngle = 360
                        doorRightSound.panner.coneOuterAngle = 0
                        doorRightSound.panner.coneOuterGain = 0
                        doorRightSound.gain.disconnect()
                        doorRightSound.gain.connect(this.audioGlobalGain)

                        doorLeftSound.setBuffer(buffer)
                        doorRightSound.setBuffer(buffer)


                        this.fnlp.push(() => {

                            if (!this.controls.enabled) return

                            // if inside door area 1
                            if (this.playerZone !== this.zones.stairway &&
                                isInsidePolygon(polyArea.nvert, polyArea.vertX, polyArea.vertY, playerPosition.x, playerPosition.z)) {

                                // if door is not opening or already open
                                if (!isCorridorDoorOpen && !isCorridorDoorOpening) {

                                    const posLeft = {
                                        x: doorLeftClosedPos.x,
                                        y: doorLeftClosedPos.y,
                                        z: doorLeftClosedPos.z
                                    }

                                    const posRight = {
                                        x: doorRightClosedPos.x,
                                        y: doorRightClosedPos.y,
                                        z: doorRightClosedPos.z
                                    }

                                    let tweenLeftOpen = new TWEEN.Tween(posLeft, this.tweenGroupDoors)
                                        .to({
                                            x: doorLeftOpenPos.x,
                                            y: doorLeftOpenPos.y,
                                            z: doorLeftOpenPos.z
                                        }, SPEED_1)
                                        .easing(TWEEN.Easing.Quartic.InOut)
                                        .onStart(() => {
                                            // console.log("TWEEN LEFT OPEN START")
                                            if (doorLeftSound.isPlaying) {
                                                doorLeftSound.stop()
                                            }

                                            doorLeftSound.play()

                                        })
                                        .onUpdate(() => {
                                            doorLeft.position.set(posLeft.x, posLeft.y, posLeft.z)
                                            // console.log(pos)
                                        })
                                        .onComplete(() => {
                                            // isOpen = true
                                            // isOpening = false
                                            // console.log("TWEEN LEFT OPEN COMPLETE")
                                        })

                                    let tweenRightOpen = new TWEEN.Tween(posRight, this.tweenGroupDoors)
                                        .to({
                                            x: doorRightOpenPos.x,
                                            y: doorRightOpenPos.y,
                                            z: doorRightOpenPos.z
                                        }, SPEED_1)
                                        .easing(TWEEN.Easing.Quartic.InOut)
                                        .onStart(() => {
                                            // console.log("TWEEN RIGHT OPEN START")
                                            if (doorRightSound.isPlaying) {
                                                doorRightSound.stop()
                                            }

                                            doorRightSound.play()
                                        })
                                        .onUpdate(() => {
                                            doorRight.position.set(posRight.x, posRight.y, posRight.z)
                                            // console.log(pos)
                                        })
                                        .onComplete(() => {
                                            isCorridorDoorOpen = true
                                            isCorridorDoorOpening = false
                                            // console.log("TWEEN RIGHT OPEN COMPLETE")
                                            // console.log(isOpening, isOpen)
                                        })

                                    isCorridorDoorOpening = true

                                    tweenLeftOpen.start()
                                    tweenRightOpen.start()
                                }
                            }
                            // if outside of door area 1
                            else {

                                // if door is open and not already closing
                                if (isCorridorDoorOpen && !isCorridorDoorClosing) {

                                    const posLeft = {
                                        x: doorLeftOpenPos.x,
                                        y: doorLeftOpenPos.y,
                                        z: doorLeftOpenPos.z
                                    }

                                    const posRight = {
                                        x: doorRightOpenPos.x,
                                        y: doorRightOpenPos.y,
                                        z: doorRightOpenPos.z
                                    }

                                    let tweenLeftClose = new TWEEN.Tween(posLeft, this.tweenGroupDoors)
                                        .to({
                                            x: doorLeftClosedPos.x,
                                            y: doorLeftClosedPos.y,
                                            z: doorLeftClosedPos.z
                                        }, SPEED_1)
                                        .easing(TWEEN.Easing.Quartic.InOut)
                                        .onStart(() => {
                                            // console.log("TWEEN LEFT CLOSE START")
                                            // audioManager.play({
                                            //     url: "assets/audio/Pneumatic-door.wav",
                                            //     volume: 0.2
                                            // })
                                            if (doorLeftSound.isPlaying) {
                                                doorLeftSound.stop()
                                            }

                                            doorLeftSound.play()
                                        })
                                        .onUpdate(() => {
                                            doorLeft.position.set(posLeft.x, posLeft.y, posLeft.z)
                                            // console.log(pos)
                                        })
                                        .onComplete(() => {
                                            // isOpen = false
                                            // isClosing = false
                                            // console.log("TWEEN LEFT CLOSE COMPLETE")
                                        })

                                    let tweenRightClose = new TWEEN.Tween(posRight, this.tweenGroupDoors)
                                        .to({
                                            x: doorRightClosedPos.x,
                                            y: doorRightClosedPos.y,
                                            z: doorRightClosedPos.z
                                        }, SPEED_1)
                                        .easing(TWEEN.Easing.Quartic.InOut)
                                        .onStart(() => {
                                            // console.log("TWEEN RIGHT CLOSE START")
                                        })
                                        .onUpdate(() => {
                                            doorRight.position.set(posRight.x, posRight.y, posRight.z)
                                            // console.log(pos)
                                        })
                                        .onComplete(() => {
                                            isCorridorDoorOpen = false
                                            isCorridorDoorClosing = false
                                            // console.log("TWEEN RIGHT CLOSE COMPLETE")
                                            // console.log(isClosing, isOpen)
                                        })

                                    isCorridorDoorClosing = true

                                    tweenLeftClose.start()
                                    tweenRightClose.start()

                                }

                            }

                        })

                    }

                    // AREA 2 (bridge -> stairway1)
                    const area2 = async () => {

                        const polyArea = polygonFromRect(
                            this.scene.getObjectByName("PolyArea_Door2"),
                            this.level.quaternion,
                            this.scene
                        )

                        const door = this.scene.getObjectByName("Door_Vert_2")
                        const doorClosedPos = door.position.clone()
                        const doorOpenPos = doorClosedPos.clone().add(new T.Vector3(0, 3, 0))

                        // configure sounds
                        const buffer = await this.loaderManager.loadAudio("assets/audio/Pneumatic-door_128cbr.mp3")
                        const doorSound = new T.PositionalAudio(this.audioListener)
                        door.add(doorSound)

                        doorSound.setVolume(doorAudioVolume)
                        doorSound.panner.panningModel = "HRTF"
                        doorSound.panner.distanceModel = "inverse"
                        doorSound.panner.refDistance = 1
                        doorSound.panner.maxDistance = 10000
                        doorSound.panner.rolloffFactor = 0.9
                        doorSound.panner.coneInnerAngle = 360
                        doorSound.panner.coneOuterAngle = 0
                        doorSound.panner.coneOuterGain = 0
                        doorSound.gain.disconnect()
                        doorSound.gain.connect(this.audioGlobalGain)

                        doorSound.setBuffer(buffer)

                        // this.scene.add(new T.Box3Helper(boxArea, 0xffff00));

                        this.fnlp.push(() => {

                            if (!this.controls.enabled) return

                            // if inside door area 2
                            if (this.playerZone !== this.zones.corridor &&
                                isInsidePolygon(polyArea.nvert, polyArea.vertX, polyArea.vertY, playerPosition.x, playerPosition.z)) {

                                // if door is not opening or already open
                                if (!isStairwayDoorLeftOpen && !isStairwayDoorLeftOpening) {

                                    const pos = {
                                        x: doorClosedPos.x,
                                        y: doorClosedPos.y,
                                        z: doorClosedPos.z
                                    }

                                    let tweenOpen = new TWEEN.Tween(pos, this.tweenGroupDoors)
                                        .to({
                                            x: doorOpenPos.x,
                                            y: doorOpenPos.y,
                                            z: doorOpenPos.z
                                        }, SPEED_2)
                                        .easing(TWEEN.Easing.Sinusoidal.InOut)
                                        .onStart(() => {
                                            if (doorSound.isPlaying) {
                                                doorSound.stop()
                                            }

                                            doorSound.play()
                                        })
                                        .onUpdate(() => {
                                            door.position.set(pos.x, pos.y, pos.z)
                                        })
                                        .onComplete(() => {
                                            isStairwayDoorLeftOpen = true
                                            isStairwayDoorLeftOpening = false
                                        })

                                    isStairwayDoorLeftOpening = true

                                    tweenOpen.start()

                                }
                            }
                            // if outside of door area 2
                            else {

                                // if door is open and not already closing
                                if (isStairwayDoorLeftOpen && !isStairwayDoorLeftClosing) {

                                    const pos = {
                                        x: doorOpenPos.x,
                                        y: doorOpenPos.y,
                                        z: doorOpenPos.z
                                    }

                                    let tweenClose = new TWEEN.Tween(pos, this.tweenGroupDoors)
                                        .to({
                                            x: doorClosedPos.x,
                                            y: doorClosedPos.y,
                                            z: doorClosedPos.z
                                        }, SPEED_2)
                                        .easing(TWEEN.Easing.Sinusoidal.InOut)
                                        .onStart(() => {
                                            if (doorSound.isPlaying) {
                                                doorSound.stop()
                                            }

                                            doorSound.play()
                                        })
                                        .onUpdate(() => {
                                            door.position.set(pos.x, pos.y, pos.z)
                                        })
                                        .onComplete(() => {
                                            isStairwayDoorLeftOpen = false
                                            isStairwayDoorLeftClosing = false
                                        })

                                    isStairwayDoorLeftClosing = true

                                    tweenClose.start()

                                }
                            }
                        })

                    }

                    // AREA 3 (bridge -> stairway2)
                    const area3 = async () => {

                        const polyArea = polygonFromRect(
                            this.scene.getObjectByName("PolyArea_Door3"),
                            this.level.quaternion,
                            this.scene
                        )

                        const door = this.scene.getObjectByName("Door_Vert_3")
                        const doorClosedPos = door.position.clone()
                        const doorOpenPos = doorClosedPos.clone().add(new T.Vector3(0, 3, 0))

                        // configure sounds
                        const buffer = await this.loaderManager.loadAudio("assets/audio/Pneumatic-door_128cbr.mp3")
                        const doorAudio = new T.PositionalAudio(this.audioListener)
                        door.add(doorAudio)

                        doorAudio.setVolume(doorAudioVolume)
                        doorAudio.panner.panningModel = "HRTF"
                        doorAudio.panner.distanceModel = "inverse"
                        doorAudio.panner.refDistance = 1
                        doorAudio.panner.maxDistance = 10000
                        doorAudio.panner.rolloffFactor = 0.9
                        doorAudio.panner.coneInnerAngle = 360
                        doorAudio.panner.coneOuterAngle = 0
                        doorAudio.panner.coneOuterGain = 0
                        doorAudio.gain.disconnect()
                        doorAudio.gain.connect(this.audioGlobalGain)

                        doorAudio.setBuffer(buffer)

                        this.fnlp.push(() => {

                            if (!this.controls.enabled) return

                            // if inside door area 3
                            if (this.playerZone !== this.zones.corridor &&
                                isInsidePolygon(polyArea.nvert, polyArea.vertX, polyArea.vertY, playerPosition.x, playerPosition.z)) {

                                // if door is not opening or already open
                                if (!isStairwayDoorRightOpen && !isStairwayDoorRightOpening) {

                                    const pos = {
                                        x: doorClosedPos.x,
                                        y: doorClosedPos.y,
                                        z: doorClosedPos.z
                                    }

                                    let tweenOpen = new TWEEN.Tween(pos, this.tweenGroupDoors)
                                        .to({
                                            x: doorOpenPos.x,
                                            y: doorOpenPos.y,
                                            z: doorOpenPos.z
                                        }, SPEED_2)
                                        .easing(TWEEN.Easing.Sinusoidal.InOut)
                                        .onStart(() => {
                                            if (doorAudio.isPlaying) {
                                                doorAudio.stop()
                                            }

                                            doorAudio.play()
                                        })
                                        .onUpdate(() => {
                                            door.position.set(pos.x, pos.y, pos.z)
                                        })
                                        .onComplete(() => {
                                            isStairwayDoorRightOpen = true
                                            isStairwayDoorRightOpening = false
                                        })

                                    isStairwayDoorRightOpening = true

                                    tweenOpen.start()

                                }
                            }
                            // if outside of door area 2
                            else {

                                // if door is open and not already closing
                                if (isStairwayDoorRightOpen && !isStairwayDoorRightClosing) {

                                    const pos = {
                                        x: doorOpenPos.x,
                                        y: doorOpenPos.y,
                                        z: doorOpenPos.z
                                    }

                                    let tweenClose = new TWEEN.Tween(pos, this.tweenGroupDoors)
                                        .to({
                                            x: doorClosedPos.x,
                                            y: doorClosedPos.y,
                                            z: doorClosedPos.z
                                        }, SPEED_2)
                                        .easing(TWEEN.Easing.Sinusoidal.InOut)
                                        .onStart(() => {
                                            if (doorAudio.isPlaying) {
                                                doorAudio.stop()
                                            }

                                            doorAudio.play()
                                        })
                                        .onUpdate(() => {
                                            door.position.set(pos.x, pos.y, pos.z)
                                        })
                                        .onComplete(() => {
                                            isStairwayDoorRightOpen = false
                                            isStairwayDoorRightClosing = false
                                        })

                                    isStairwayDoorRightClosing = true

                                    tweenClose.start()

                                }
                            }
                        })

                    }

                    area1()
                    area2()
                    area3()

                }

                stargateInteraction()
                commandPanelInteraction()
                doorsInteraction(0.5)

            },


            /**
             * Initialize stars particle system
             * @returns {Promise<void>}
             */
            async initStarsParticleSystem () {

                const system = new System()
                const emitter1 = new Emitter()
                const emitter2 = new Emitter()
                const renderer = new SpriteRenderer(this.scene)

                const sprite = new T.Sprite(
                    new T.SpriteMaterial({
                        map: await this.loaderManager.loadTexture("assets/images/particle.png"),
                        color: 0xffffff,
                        blending: T.AdditiveBlending,
                        // fog: true
                    })
                )

                emitter1
                    .setRate(new Rate(new Span(1, 1), new Span(0.3)))
                    .setInitializers([
                        new Position(new PointZone(0, 0)),
                        new Body(sprite),
                        new Radius(0.6, 0.6),
                        new Mass(0.1),
                        new Life(2),
                        new VectorVelocity(new Vector3D(0, 0, -140), 0)
                    ])
                    .setBehaviours([
                        new Alpha(1, 0),
                        // new Scale(0.1, 0.1)
                    ])
                    .emit();

                emitter2
                    .setRate(new Rate(new Span(1, 1), new Span(0.1)))
                    .setInitializers([
                        new Position(new PointZone(0, 0)),
                        new Body(sprite),
                        new Radius(0.5, 0.5),
                        new Mass(0.1),
                        new Life(2),
                        new VectorVelocity(new Vector3D(0, 0, -90), 0),
                    ])
                    .setBehaviours([
                        new Alpha(1, 0),
                        // new Scale(0.1, 0.1),
                    ])
                    .emit();

                const z = 75
                let pos1 = new T.Vector3()
                let pos2 = new T.Vector3()

                emitter1.rotation.set(0, Math.PI - this.level.rotation.y, 0)
                emitter2.rotation.set(0, Math.PI - this.level.rotation.y, 0)

                system
                    .addEmitter(emitter1)
                    .addEmitter(emitter2)
                    .addRenderer(renderer)

                this.fnlp.push((elapsed, delta) => {

                    if (this.playerZone === this.zones.corridor) {
                        emitter1.removeAllParticles()
                        emitter2.removeAllParticles()
                    }
                    else {

                        pos1.set(
                            Math.random() < 0.5 ? Math.random() * 100 + 10 : -Math.random() * 100 - 10,
                            Math.random() < 0.5 ? Math.random() * 50 + 10 : -Math.random() * 50,
                            z
                        ).applyQuaternion(this.level.quaternion)

                        pos2.set(
                            Math.random() < 0.5 ? Math.random() * 100 + 10 : -Math.random() * 100 - 10,
                            Math.random() < 0.5 ? Math.random() * 50 + 10 : -Math.random() * 50,
                            z
                        ).applyQuaternion(this.level.quaternion)

                        emitter1.position.set(pos1.x, pos1.y, pos1.z)
                        emitter2.position.set(pos2.x, pos2.y, pos2.z)

                        system.update()
                    }

                })

            },


            /**
             * Update player zone position using polygon inside test
             * @returns {Promise<void>}
             */
            async updatePlayerZone () {

                const corridor = this.scene.getObjectByName("PolyArea_Corridor")
                const bridge = this.scene.getObjectByName("PolyArea_Bridge")
                const stargate = this.scene.getObjectByName("PolyArea_Stargate")
                const stairway1 = this.scene.getObjectByName("PolyArea_Stairway1")
                const stairway2 = this.scene.getObjectByName("PolyArea_Stairway2")

                const corridorPoly = polygonFromRect(corridor, this.level.quaternion, this.scene)
                const bridgePoly = polygonFromRect(bridge, this.level.quaternion, this.scene)
                const stargatePoly = polygonFromRect(stargate, this.level.quaternion, this.scene)
                const stairwayPoly1 = polygonFromRect(stairway1, this.level.quaternion, this.scene)
                const stairwayPoly2 = polygonFromRect(stairway2, this.level.quaternion, this.scene)

                const playerPosition = this.controls.getObject().position

                const corridorTest = () => {
                    return isInsidePolygon(
                        corridorPoly.nvert,
                        corridorPoly.vertX,
                        corridorPoly.vertY,
                        playerPosition.x,
                        playerPosition.z
                    )
                }

                const bridgeTest = () => {
                    return isInsidePolygon(
                        bridgePoly.nvert,
                        bridgePoly.vertX,
                        bridgePoly.vertY,
                        playerPosition.x,
                        playerPosition.z
                    )
                }

                const stargateTest = () => {
                    return isInsidePolygon(
                        stargatePoly.nvert,
                        stargatePoly.vertX,
                        stargatePoly.vertY,
                        playerPosition.x,
                        playerPosition.z
                    )
                }

                const stairwayTest = () => {
                    return isInsidePolygon(
                        stairwayPoly1.nvert,
                        stairwayPoly1.vertX,
                        stairwayPoly1.vertY,
                        playerPosition.x,
                        playerPosition.z
                    ) || isInsidePolygon(
                        stairwayPoly2.nvert,
                        stairwayPoly2.vertX,
                        stairwayPoly2.vertY,
                        playerPosition.x,
                        playerPosition.z
                    )
                }

                this.fnlp.push(() => {

                    switch (this.playerZone) {

                        // Init: test for all zones
                        case this.zones.init:
                            if (corridorTest()) {
                                this.playerZone = this.zones.corridor
                            }
                            else if (bridgeTest()) {
                                this.playerZone = this.zones.bridge
                            }
                            else if (stairwayTest()) {
                                this.playerZone = this.zones.stairway
                            }
                            break

                        // Corridor: test for bridge
                        case this.zones.corridor:
                            if (bridgeTest()) {
                                this.playerZone = this.zones.bridge
                            }
                            break

                        // Bridge: test for corridor and stairway
                        case this.zones.bridge:
                            if (stargateTest()) {
                                this.playerZone = this.zones.stargate
                            }
                            else if (corridorTest()) {
                                this.playerZone = this.zones.corridor
                            }
                            else if (stairwayTest()) {
                                this.playerZone = this.zones.stairway
                            }
                            break

                        // Stargate: test for bridge (outside stargate)
                        case this.zones.stargate:
                            if (!stargateTest()) {
                                this.playerZone = this.zones.bridge
                            }
                            break

                        // Stairway: test for bridge
                        case this.zones.stairway:
                            if (bridgeTest()) {
                                this.playerZone = this.zones.bridge
                            }
                            break

                    }

                })

            },

            /**
             * Performs an audio fade-in using the given parameters
             * @param sound THREE.Audio
             * @param time Fade time in seconds
             * @param gain Gain value
             * @param tweenGroup TWEEN group
             * @returns {Promise<any>}
             */
            audioFadeIn (sound, time = 2, gain = 1.0, tweenGroup = this.tweenGroupAmbientAudioFadeOut) {

                if (!isFinite(gain)) {
                    throw `${TAG}\taudioFadeIn: gain value must be a finite number (${gain})`
                }

                return new Promise((resolve) => {

                    let from = {v: Number(sound.gain.gain.value)}
                    let to = {v: gain}

                    new TWEEN.Tween(from, tweenGroup)
                        .to(to, time * 1000)
                        .onStart(() => {
                            !sound.isPlaying && sound.play()
                        })
                        .onUpdate(() => {
                            sound.gain.gain.value = from.v
                        })
                        .onComplete(() => {
                            return resolve()
                        })
                        .start()

                })
            },


            /**
             * Performs an audio fade-out using the given parameters
             * @param sound THREE.Audio
             * @param time Fade time in seconds
             * @param gain Gain value
             * @param tweenGroup TWEEN group
             * @returns {Promise<any>}
             */
            audioFadeOut (sound, time = 2, gain = 0.0001, tweenGroup = this.tweenGroupAmbientAudioFadeOut) {

                if (!isFinite(gain)) {
                    throw `${TAG}\taudioFadeOut: gain value must be a finite number (${gain})`
                }

                return new Promise((resolve) => {

                    gain = gain === 0 ? 0.0001 : gain
                    let from = {v: Number(sound.gain.gain.value)}
                    let to = {v: gain}

                    new TWEEN.Tween(from, tweenGroup)
                        .to(to, time * 1000)
                        .onUpdate(() => {
                            sound.gain.gain.value = from.v
                        })
                        .onComplete(() => {
                            sound.isPlaying && sound.stop()
                            return resolve()
                        })
                        .start()

                })

            },

            /**
             * Performs an audio gain transition on the global gain using the given parameters
             * @param value Target gain value
             * @param time Transition time
             * @param onComplete On complete callback
             * @returns {Promise<any>}
             */
            audioGlobalGainTween (value, time, onComplete) {

                value = value === 0 ? 0.0001 : value
                const from = {v: Number(this.audioGlobalGain.gain.value)}
                const to = {v: value}

                return new Promise (resolve => {

                    new TWEEN.Tween(from, this.tweenGroupAudioGlobal)
                        .to(to, time)
                        .onUpdate(() => {
                            this.audioGlobalGain.gain.value = from.v
                        })
                        .onComplete( () => {
                            onComplete && typeof onComplete === "function" && onComplete()
                            resolve()
                        })
                        .start()

                })

            },

            /**
             * Initialize ambient audio based on zones
             * @returns {Promise<void>}
             */
            async initAmbientAudio () {

                let activeZone

                const initGain = 0.0001
                const fadeTimeSeconds = 1.5

                const commandDeskBuffer = await this.loaderManager.loadAudio("assets/audio/ConsoleDesk_128cbr.mp3")
                const consoleWallBuffer = await this.loaderManager.loadAudio("assets/audio/ConsoleWall_128cbr.mp3")
                const fanBuffer = await this.loaderManager.loadAudio("assets/audio/fan_128cbr.mp3")

                const createPositionalAudio = (buffer) => {
                    const pa = new T.PositionalAudio(this.audioListener)
                    pa.panner.panningModel = "HRTF"
                    pa.panner.distanceModel = "inverse"
                    pa.panner.refDistance = 1
                    pa.panner.maxDistance = 1000
                    pa.panner.rolloffFactor = 0.6
                    pa.panner.coneInnerAngle = 360
                    pa.panner.coneOuterAngle = 0
                    pa.panner.coneOuterGain = 0
                    pa.setBuffer(buffer)
                    pa.setLoop(true)
                    pa.gain.disconnect()
                    pa.gain.connect(this.audioGlobalGain)
                    return pa
                }

                const commandDesk = this.scene.getObjectByName("Command_Desk_sound")
                const commandDeskSound = createPositionalAudio(commandDeskBuffer)

                const wallConsole = this.scene.getObjectByName("Wall_Console_sound")
                const wallConsoleSound = createPositionalAudio(consoleWallBuffer)

                const airing1 = this.scene.getObjectByName("Propeller1")
                const airing1Sound = createPositionalAudio(fanBuffer)

                const airing2 = this.scene.getObjectByName("Propeller2")
                const airing2Sound = createPositionalAudio(fanBuffer)

                const airing3 = this.scene.getObjectByName("Propeller3")
                const airing3Sound = createPositionalAudio(fanBuffer)

                const airing4 = this.scene.getObjectByName("Propeller4")
                const airing4Sound = createPositionalAudio(fanBuffer)

                commandDesk.add(commandDeskSound)
                wallConsole.add(wallConsoleSound)
                airing1.add(airing1Sound)
                airing2.add(airing2Sound)
                airing3.add(airing3Sound)
                airing4.add(airing4Sound)

                this.sounds["deskConsole"] = commandDeskSound
                this.sounds["wallConsole"] = wallConsoleSound
                this.sounds["airing1"] = airing1Sound
                this.sounds["airing2"] = airing2Sound
                this.sounds["airing3"] = airing3Sound
                this.sounds["airing4"] = airing4Sound

                const corridorSound = this.sounds[this.zones.corridor]
                corridorSound.setLoop(true)
                corridorSound.gain.gain.value = initGain

                const bridgeSound = this.sounds[this.zones.bridge]
                bridgeSound.setLoop(true)
                bridgeSound.gain.gain.value = initGain

                const stairwaySound = this.sounds[this.zones.stairway]
                stairwaySound.setLoop(true)
                stairwaySound.gain.gain.value = initGain

                const createFXAudio = async (url) => {
                    // threejs Audio objects don't have panner. Adding one to have stereo fx sounds
                    const audio = new T.Audio(this.audioListener).setBuffer(await this.loaderManager.loadAudio(url))
                    audio.panner = this.audioContext.createStereoPanner()
                    audio.gain.disconnect() // disconnect from output
                    audio.gain.connect(audio.panner)
                    // audio.panner.connect(this.audioListener.getInput()) // connect to output
                    audio.panner.connect(this.audioGlobalGain) // connect to output
                    return audio
                }

                const fx_suncity_c = await createFXAudio("assets/audio/suncity_c_128cbr.mp3")
                const fx_suncity_f = await createFXAudio("assets/audio/suncity_f_128cbr.mp3")
                const fx_RustLake_f2 = await createFXAudio("assets/audio/RustLake_f2_128cbr.mp3")
                const fx_RustLake_f3 = await createFXAudio("assets/audio/RustLake_f3_128cbr.mp3")
                const fx_efx_6 = await createFXAudio("assets/audio/scifi_efx_6_128cbr.mp3")
                const fx_efx_7 = await createFXAudio("assets/audio/scifi_efx_7_128cbr.mp3")
                const fx_efx_8 = await createFXAudio("assets/audio/scifi_efx_8_128cbr.mp3")
                const fx_efx_9 = await createFXAudio("assets/audio/scifi_efx_9_128cbr.mp3")
                const fx_efx_10 = await createFXAudio("assets/audio/scifi_efx_10_128cbr.mp3")
                const fx_efx_11 = await createFXAudio("assets/audio/scifi_efx_11_128cbr.mp3")

                const fxSounds = {}

                fxSounds[this.zones.corridor] = [
                    fx_efx_6,
                    fx_efx_7,
                    fx_efx_8,
                    fx_efx_9,
                    fx_efx_10,
                    fx_efx_11,
                ]

                fxSounds[this.zones.bridge] = [
                    fx_efx_7,
                    fx_efx_10,
                    fx_efx_11,
                    fx_suncity_c,
                    fx_suncity_f,
                    fx_RustLake_f2,
                    fx_RustLake_f3
                ]

                fxSounds[this.zones.stairway] = [
                    fx_suncity_c,
                    fx_suncity_f,
                    fx_RustLake_f2,
                    fx_RustLake_f3
                ]

                const playRandomZoneFX = (zone) => {

                    const _getRandomTime = () => {
                        return Math.floor(Math.random() * 8000) + (Math.random() * 8000 + 4000)
                    }

                    let id, sounds, audio, gain, index
                    let lastAudioCorridorIndex = -1
                    let lastAudioBridgeIndex = -1
                    let lastAudioStairwayIndex = -1

                    const _playRandomFX = () => {
                        if (!this.controls.enabled || !this.webGLRunning || activeZone !== zone) {
                            id && clearTimeout(id)
                        }
                        else {

                            // chance to play fx
                            if (Math.random() < 0.5) {
                                switch (this.playerZone) {

                                    case this.zones.corridor:
                                        sounds = fxSounds[this.zones.corridor]

                                        index = Math.floor(Math.random() * sounds.length)

                                        while (index === lastAudioCorridorIndex) {
                                            index = Math.floor(Math.random() * sounds.length)
                                        }

                                        audio = sounds[index]
                                        lastAudioCorridorIndex = index
                                        gain = Math.random() * 0.2 + 0.05
                                        break

                                    case this.zones.bridge:
                                    case this.zones.stargate:
                                        sounds = fxSounds[this.zones.bridge]
                                        index = Math.floor(Math.random() * sounds.length)

                                        while (index === lastAudioBridgeIndex) {
                                            index = Math.floor(Math.random() * sounds.length)
                                        }

                                        audio = sounds[index]
                                        lastAudioBridgeIndex = index
                                        gain = Math.random() * 0.5 + 0.3
                                        break

                                    case this.zones.stairway:
                                        sounds = fxSounds[this.zones.stairway]
                                        index = Math.floor(Math.random() * sounds.length)

                                        while (index === lastAudioStairwayIndex) {
                                            index = Math.floor(Math.random() * sounds.length)
                                        }

                                        audio = sounds[index]
                                        lastAudioStairwayIndex = index

                                        gain = Math.random() * 0.8 + 0.8
                                        break
                                }

                                audio.gain.gain.value = gain
                                audio.panner.pan.value = Math.random() * 2 - 1
                                audio.isPlaying && audio.stop()
                                audio.play()

                            }

                            id = setTimeout(_playRandomFX, _getRandomTime())

                        }
                    }

                    id = setTimeout(_playRandomFX, _getRandomTime())

                }

                this.fnlp.push(() => {

                    if (!this.controls.enabled || !this.webGLRunning) return

                    switch (this.playerZone) {

                        case this.zones.corridor:
                            if (activeZone !== this.zones.corridor) {
                                activeZone = this.zones.corridor
                                this.tweenGroupAmbientAudioFadeOut.removeAll()
                                this.tweenGroupAmbientAudioFadeIn.removeAll()
                                this.audioFadeOut(bridgeSound, fadeTimeSeconds)
                                this.audioFadeOut(commandDeskSound, fadeTimeSeconds)
                                this.audioFadeOut(wallConsoleSound, fadeTimeSeconds)
                                this.audioFadeOut(airing1Sound, fadeTimeSeconds)
                                this.audioFadeOut(airing2Sound, fadeTimeSeconds)
                                this.audioFadeOut(airing3Sound, fadeTimeSeconds)
                                this.audioFadeOut(airing4Sound, fadeTimeSeconds)
                                this.audioFadeIn(corridorSound, fadeTimeSeconds)
                                playRandomZoneFX(this.zones.corridor)
                            }
                            break

                        case this.zones.bridge:
                            if (activeZone !== this.zones.bridge) {
                                activeZone = this.zones.bridge
                                this.tweenGroupAmbientAudioFadeOut.removeAll()
                                this.tweenGroupAmbientAudioFadeIn.removeAll()
                                corridorSound.isPlaying ?
                                    this.audioFadeOut(corridorSound, fadeTimeSeconds) :
                                    this.audioFadeOut(stairwaySound, fadeTimeSeconds)
                                this.audioFadeIn(bridgeSound, fadeTimeSeconds, 0.5)
                                this.audioFadeIn(commandDeskSound, fadeTimeSeconds, 0.7)
                                this.audioFadeIn(wallConsoleSound, fadeTimeSeconds, 0.8)
                                this.audioFadeIn(airing1Sound, fadeTimeSeconds, 2.0)
                                this.audioFadeIn(airing2Sound, fadeTimeSeconds, 2.0)
                                this.audioFadeIn(airing3Sound, fadeTimeSeconds, 2.0)
                                this.audioFadeIn(airing4Sound, fadeTimeSeconds, 2.0)
                                playRandomZoneFX(this.zones.bridge)
                            }
                            break

                        case this.zones.stairway:
                            if (activeZone !== this.zones.stairway) {
                                activeZone = this.zones.stairway
                                this.tweenGroupAmbientAudioFadeOut.removeAll()
                                this.tweenGroupAmbientAudioFadeIn.removeAll()
                                this.audioFadeOut(bridgeSound, fadeTimeSeconds)
                                this.audioFadeOut(commandDeskSound, fadeTimeSeconds)
                                this.audioFadeOut(wallConsoleSound, fadeTimeSeconds)
                                this.audioFadeOut(airing1Sound, fadeTimeSeconds)
                                this.audioFadeOut(airing2Sound, fadeTimeSeconds)
                                this.audioFadeOut(airing3Sound, fadeTimeSeconds)
                                this.audioFadeOut(airing4Sound, fadeTimeSeconds)
                                this.audioFadeIn(stairwaySound, fadeTimeSeconds, 1.0)
                                playRandomZoneFX(this.zones.stairway)
                            }
                            break

                    }

                })

            },

            /**
             * Window resize handler
             */
            onWindowResize () {

                const computedStyle = window.getComputedStyle(this.domElement)
                this.width = Math.floor(parseFloat(computedStyle.getPropertyValue("width")))
                this.height = Math.floor(parseFloat(computedStyle.getPropertyValue("height")))
                this.camera.aspect = this.width / this.height
                this.camera.updateProjectionMatrix()
                this.renderer && this.renderer.setSize(this.width, this.height)

            },

            /**
             * Handler for changes in page visibility
             */
            async onDocumentVisibilityChange () {

                console.log(TAG, "Document visibility: " + document.visibilityState)

                if (!this.controls) return // do nothing if world has never started

                let id

                const handler = () => {
                    // Delay in case of transition running
                    if (!this.isTransitionRunning) {

                        id && clearInterval(id)

                        switch (document.visibilityState) {

                            case "hidden":
                                this.audioContext.suspend()

                                if (!this.isTouchDevice && this.controls.isLocked) {
                                    this.controls.unlock()
                                }
                                else {
                                    this.stopWebGL()
                                }

                                break

                            case "visible":
                                this.isTouchDevice && this.startWebGL()
                                // For mouse device the user must click on the pointer lock overlay to start webGL again
                                break

                        }
                    }
                }

                id = setInterval(handler, 100)

            },

            /**
             * Initialize AxesHelper
             * @param size Size
             */
            initAxesHelper (size) {

                this.scene.add(new T.AxesHelper(size || 100))

            },

            /**
             * Initialize GridHelper
             * @param size Size
             */
            initGridHelper (size) {

                this.scene.add(new T.GridHelper(size || 100))

            },

            /**
             * Initialize player controls
             */
            initControls () {

                if (this.controlsInitialized) {
                    this.controls.enabled = true
                    console.log(TAG, "Controls enabled")
                    return
                }

                if (this.isTouchDevice) {
                    this.initTouchControls()
                    console.log(TAG, "Init touch controls")
                }
                else {
                    this.initMouseControls()
                    console.log(TAG, "Init mouse controls")
                }

                this.controls.getObject().add(this.audioListener)

                this.controlsInitialized = true
                console.log(TAG, "Controls initialized")

            },


            /**
             * Start WebGL if not already running
             */
            startWebGL () {

                this.webGLStartRequested = true
                this.eventManager.emit(EventManager.events.WORLD_WEBGL_START)

                this.onWindowResize()

                this.tweenGroupStargate.removeAll()
                this.tweenGroupCommandConsole.removeAll()
                this.isTouchDevice && this.tweenGroupNavigation.removeAll()
                this.tweenGroupAmbientAudioFadeIn.removeAll()
                this.tweenGroupAmbientAudioFadeOut.removeAll()
                this.tweenGroupFXAudioFadeIn.removeAll()
                this.tweenGroupFXAudioFadeOut.removeAll()
                this.tweenGroupAudioGlobal.removeAll()
                this.tweenGroupDoors.removeAll()

                this.audioContext.resume() // await here causes pointer lock failure on safari/firefox

                this.audioGlobalGainTween(1.0, 1000)

                if (this.webGLRunning) {
                    console.log(TAG, "WebGL is already running")
                    return
                }

                const animate = () => {

                    if (this.webGLRunning) {

                        this.deltaTime = this.clock.getDelta()
                        this.elapsedTime = this.clock.elapsedTime
                        this.fnlp.forEach(f => f(this.elapsedTime, this.deltaTime))
                        this.renderer.info.reset()
                        this.composer.render(this.deltaTime)
                        requestAnimationFrame(animate)

                    }

                }

                this.webGLRunning = true
                this.controls.enabled = true
                animate()
                console.log(TAG, "WebGL start")

            },

            /**
             * Stop WebGL
             */
            stopWebGL () {

                this.webGLStartRequested = false
                this.eventManager.emit(EventManager.events.WORLD_WEBGL_STOP)
                const fadeTime = 1000

                this.tweenGroupStargate.removeAll()
                this.tweenGroupCommandConsole.removeAll()
                this.isTouchDevice && this.tweenGroupNavigation.removeAll()
                this.tweenGroupAmbientAudioFadeIn.removeAll()
                this.tweenGroupAmbientAudioFadeOut.removeAll()
                this.tweenGroupFXAudioFadeIn.removeAll()
                this.tweenGroupFXAudioFadeOut.removeAll()
                this.tweenGroupAudioGlobal.removeAll()
                this.tweenGroupDoors.removeAll()

                this.audioGlobalGainTween(0, fadeTime)

                setTimeout(() => {
                    // check if a start request has been received during the timeout
                    if (!this.webGLStartRequested) {
                        this.controls.enabled = false
                        this.webGLRunning = false
                        this.audioContext.suspend()
                        console.log(TAG, "WebGL stop")
                    }
                }, fadeTime + 50)

            },


            /**
             * Initialize javascript stats panel
             */
            initStatsFPS () {

                this.statsFPS = new STATS()
                // const statsMS = new STATS()
                // const statsMB = new STATS()

                this.isStatsFPSVisible = false

                this.statsFPS.showPanel(0)
                this.statsFPS.dom.style.left = 0
                this.statsFPS.dom.style.zIndex = 99
                // statsMS.showPanel(1)
                // statsMS.dom.style.left = `${window.devicePixelRatio * 80 + 1}px`
                // statsMS.dom.style.zIndex = 99
                // statsMB.showPanel(2)
                // statsMB.dom.style.left = `${window.devicePixelRatio * 80 * 2 + 1}px`
                // statsMB.dom.style.zIndex = 99
                this.domElement.appendChild(this.statsFPS.dom)
                // this.domElement.appendChild(statsMS.dom)
                // this.domElement.appendChild(statsMB.dom)

                this.statsFPS.dom.style.display = "none"

                this.fnlp.unshift(() => {
                    if (this.isStatsFPSVisible) {
                        this.statsFPS.begin()
                        // statsMS.begin()
                        // statsMB.begin()
                    }
                })

                this.fnlp.push(() => {
                    if (this.isStatsFPSVisible) {
                        this.statsFPS.end()
                        // statsMS.end()
                        // statsMB.end()
                    }
                })

                const onKeyup = (e) => {
                    // P
                    if (e.keyCode === 80) {

                        this.commandPanelSwitches.fps.checked = !this.commandPanelSwitches.fps.checked

                        this.toggleStatsFPS()

                    }
                }

                this.eventManager.addDomEvent(document, "keyup", onKeyup)

            },

            /**
             * Toggle visibility of javascript stats panel
             */
            toggleStatsFPS () {

                this.isStatsFPSVisible = !this.isStatsFPSVisible

                this.isStatsFPSVisible ?
                    this.statsFPS.dom.style.display = "block" :
                    this.statsFPS.dom.style.display = "none"

            },

            /**
             * Initialize WebGL Renderer stats panel
             */
            initStatsRenderer () {

                const rendererStats	= new THREEx.RendererStats()

                rendererStats.domElement.style.position	= "absolute"
                rendererStats.domElement.style.left	= "0px"
                rendererStats.domElement.style.bottom	= "0px"
                this.$el.appendChild(rendererStats.domElement)

                this.fnlp.push(() => rendererStats.update(this.renderer))

            },


            /**
             * Toggles between full screen mode, if supported
             * @param requestLock Request pointer lock after toggle full screen
             * @returns {Promise<void>}
             */
            async toggleFullScreen (requestLock = false) {

                if (!this.controlsInitialized) {
                    return
                }

                await SCREENFULL.toggle(document.body)

                if (requestLock && this.$store.state.worldState === states.world.start && !this.controls.isLocked) {

                    this.controls.lock({startWebGL: true})

                }

            },

            /**
             * Initialize world
             */
            async init () {

                this.type = "World"
                this.scale = 1

                this.domElement = this.$el
                this.width = Math.floor(parseFloat(window.getComputedStyle(this.domElement).getPropertyValue("width")))
                this.height = Math.floor(parseFloat(window.getComputedStyle(this.domElement).getPropertyValue("height")))

                this.isTouchDevice = isTouchDevice()
                this.isAndroid = isAndroid()
                this.isSafari = isSafari()

                console.log(TAG, "isTouchDevice", this.isTouchDevice)
                console.log(TAG, "isAndroid", this.isAndroid)
                console.log(TAG, "isSafari", this.isSafari)

                this.events = {
                    init: "INIT",
                    render: "RENDER",
                    transition: "TRANSITION"
                }

                this.webGLRunning = false
                this.webGLStartRequested = false // async syncronization between start/stop

                this.renderer = new T.WebGLRenderer({antialias: false, alpha: false})
                this.renderer.setClearColor(0x000000)
                this.renderer.setSize(this.width, this.height)
                this.renderer.setPixelRatio(window.devicePixelRatio * this.commandPanelSliders.resolution.default)
                this.renderer.shadowMap.enabled = false
                this.renderer.shadowMapSoft = true
                this.renderer.shadowMap.type = T.PCFSoftShadowMap
                this.renderer.gammaOutput = true
                this.renderer.gammaFactor = 2.2

                this.renderer.info.autoReset = false // to access renderer information when using EffectComposer
                this.domElement.appendChild(this.renderer.domElement)

                this.composer = new EffectComposer(this.renderer)
                this.postProcessingEffects = { } // post processing effects
                this.postProcessingPasses = { } // post processing passes

                this.fnlp = [] // loop rendering functions

                this.scene = new T.Scene()

                this.camera = new T.PerspectiveCamera(75, this.width / this.height, 0.1, 2000)
                this.cameraOffsetY = 2.6 * this.scale

                this.level = undefined
                this.navmesh = undefined
                this.skyboxes = []

                this.clock = new T.Clock()
                this.deltaTime = undefined
                this.elapsedTime = undefined

                this.eventManager = new EventManager()
                this.loaderManager = new LoaderManager(67)

                if (this.isTouchDevice) {
                    this.touchManager = new TouchManager(this.domElement, this.eventManager)
                    console.log(this.touchManager)
                }

                this.isCommandPanelVisible = false // reactive property in Vue data

                this.zones = {
                    init: 0,
                    corridor: 1,
                    bridge: 2,
                    stargate: 3,
                    stairway: 4
                }

                this.playerZone = this.zones.init

                this.audioListener = new T.AudioListener()
                this.audioContext = this.audioListener.context
                this.audioGlobalGain = this.audioContext.createGain()
                this.audioGlobalGain.connect(this.audioListener.getInput())

                this.sounds = []

                this.controls = undefined
                this.controlsInitialized = false
                this.consoleMessageDisplayed = false

                this.isTransitionRunning = false // semaphore to avoid inconsistent states on loosing context during transition

                this.tweenGroupStargate = new TWEEN.Group() // Stargate tweens
                this.tweenGroupCommandConsole = new TWEEN.Group() // Command console tweens
                this.tweenGroupNavigation = new TWEEN.Group() // Navmesh (touch)
                this.tweenGroupDoors = new TWEEN.Group() // Doors tweens
                this.tweenGroupAmbientAudioFadeIn = new TWEEN.Group() // Ambient audio fade in tweens
                this.tweenGroupAmbientAudioFadeOut = new TWEEN.Group() // Ambient audio fade out tweens
                this.tweenGroupFXAudioFadeIn = new TWEEN.Group() // FX audio fade in tweens
                this.tweenGroupFXAudioFadeOut = new TWEEN.Group() // FX audio fade out tweens
                this.tweenGroupAudioGlobal = new TWEEN.Group() // Global audio fade tweens

                this.fnlp.push(() => {
                    this.tweenGroupStargate.update()
                    this.tweenGroupCommandConsole.update()
                    this.isTouchDevice && this.tweenGroupNavigation.update()
                    this.tweenGroupDoors.update()
                    this.tweenGroupAmbientAudioFadeIn.update()
                    this.tweenGroupAmbientAudioFadeOut.update()
                    this.tweenGroupFXAudioFadeIn.update()
                    this.tweenGroupFXAudioFadeOut.update()
                    this.tweenGroupAudioGlobal.update()
                })

                WEBPACK_MODE === "development" && this.initAxesHelper(1000)
                WEBPACK_MODE === "development" && this.initStatsRenderer()
                await this.loadAssets()
                this.initSkyboxes()
                await this.initLevel()
                this.initLights()
                this.initStarsParticleSystem()
                await this.initPostProcessing()
                this.initControls()
                this.updatePlayerZone()
                this.initUserInteractions()
                this.initAmbientAudio()
                this.initStatsFPS()
                this.onWindowResize()

                this.eventManager.addDomEvent(window, "resize", this.onWindowResize)

                this.eventManager.addDomEvent(document, "visibilitychange", this.onDocumentVisibilityChange)

                this.eventManager.addDomEvent(document, "keyup", (e) => {
                    // F
                    if (e.keyCode === 70 && !this.isSafari && !this.isCommandPanelVisible) {

                        this.commandPanelSwitches.fullScreen.checked = !this.commandPanelSwitches.fullScreen.checked

                        this.toggleFullScreen(true)

                    }
                })

            },

        },

        watch: {

            worldState (newVal, oldVal) {

                const world = $("#world")

                switch (newVal) {

                    case states.world.start:
                        world.css({opacity: 1, display: "block"})
                        !this.isTouchDevice ? this.controls.lock({startWebGL: true}) : this.startWebGL()
                        this.displayConsoleMessage() // Runs only once at start
                        this.$store.commit(mutations.appState, states.app.idle)
                        break

                    case states.world.stop:
                        !this.isTouchDevice ? this.controls.unlock({stopWebGL: true}) : this.stopWebGL()
                        world.css({opacity: 0, display: "none"})
                        break

                }
            }
        },

        async mounted () {

            await this.init()
            this.$store.commit(mutations.worldState, states.world.init)

        },

        beforeDestroy () {

            this.eventManager.removeBusEvents()
            this.eventManager.removeDomEvents()

        }

    }
</script>

<style scoped lang="scss">

    @import "../../styles/base/reset";
    @import "../../styles/base/base";
    @import "../../styles/base/typography";
    @import "../../styles/helpers/variables";
    @import "../../styles/helpers/colors";
    @import "../../styles/helpers/mixins";

    canvas {
        display: block;
        margin: 0;
        padding: 0;
        border: 0;
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -khtml-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        outline: none;
        -webkit-tap-highlight-color: rgba(255, 255, 255, 0); /* mobile webkit */
    }

    #world {
        position: absolute;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: #000;
        opacity: 0;
    }

    #worldConsole {
        display: flex;
        align-items: center;
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100vw;
        min-height: 5em;
        background: rgba(0, 0, 0, 0.4);
        z-index: 1;

        @include transition(0.8s ease-in-out);
    }

    #worldConsole.close {
        @include transform(translate(0, 5em));
    }

    #worldConsoleMessage {
        padding: 1em;
        width: 100%;
        font-size: 0.8em;
        font-family: roboto-condensed;
        color: lighten($scifi-cyan-hover, 35);
    }

    #pbarContainer {
        display: none;
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        margin:auto;
        width: 80vw;
        max-width: 800px;
        height: 100%;

        #pbarOuter {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            margin:auto;
            height: 1.5em;
            background: transparent;
            border: 1px solid white;
            overflow: hidden;
            box-shadow: -2px 0 4px 0 rgba(white, 0.6);
            @include border-radius(0.75em);

            #pbarInner {
                position: absolute;
                height: 100%;
                width: 50%;
                border: 0;
                // box-shadow: 0 0 1px 1px white inset;
                @include linear-gradient(to right, $silver-chalice2, $scifi-cyan-hover)
            }

            #pbarValue {
                width: 100%;
                line-height: 1em;
                color: #fff;
                font-size: 1em;
                text-align: center;
                text-shadow: 0 0 2px 2px white;
                z-index: 2;
            }
        }


    }

    #commandPanel {
        position: fixed;
        top: 0;
        left: 0;
        padding-top: 2em;
        padding-left: 10vw;
        padding-right: 10vw;
        width: 100vw;
        height: 100vh;
        color: white;
        background: rgba(0, 0, 0, 0.5);
        overflow-y: auto;

        .title {
            display: block;
            margin-bottom: 2em;
            width: 100%;
            text-align: center;
            font-family: neuropol;
            // font-size: 4vw;
            font-size: 2em;
            color: white;
            text-shadow: 0 0 4px white;

            @include smartphone-portrait {
                font-size: 1.6em;
            }
        }

        .commandpanel-row {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 4em;
            @include border-radius(1em);

            @include narrow-screen {
                display: flex;
                flex-direction: column;
                justify-content: space-evenly;
                align-items: center;
                // height: 6em;
            }

            &:hover {
                background: rgba(white, 0.05);

                .commandpanel-row-label {
                    text-shadow: 0 0 1px white;
                }

                .commandpanel-row-slider-container > .commandpanel-row-slider {
                    opacity: 1;
                    box-shadow: 0 0 1px white;
                }

                .commandpanel-row-slider-container > .commandpanel-row-slider::-webkit-slider-thumb {
                    box-shadow: 0 0 1px white;
                }

                .commandpanel-row-slider-container > .commandpanel-row-slider::-moz-range-thumb {
                    box-shadow: 0 0 1px white;
                }

                .commandpanel-row-slider-container > .commandpanel-row-value {
                    text-shadow: 0 0 1px white;
                }

                .commandpanel-row-switch-container {
                    opacity: 1;
                }

                .commandpanel-row-switch-container > .commandpanel-row-switch-slider {
                    box-shadow: 0 0 1px white;
                }

            }

            .commandpanel-row-label {
                width: 35%;
                color: white;
                font-size: 1em;
                font-family: neuropol;

                @include narrow-screen {
                    width: 100%;
                    font-size: 0.8em;
                }
            }

            .commandpanel-row-slider-container {
                display: flex;
                flex-direction: row;
                justify-content: center;
                align-items: center;
                width: 65%;
                color: white;
                font-family: neuropol;

                @include narrow-screen {
                    width: 100%;
                }

                .commandpanel-row-slider {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 70%;
                    height: 0.5em;
                    background: $silver-chalice2;
                    outline: none;
                    opacity: 0.7;
                    -webkit-transition: .2s;
                    transition: opacity .2s;
                    cursor: pointer;
                    @include border-radius(0.25em);

                }

                .commandpanel-row-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 1.6em;
                    height: 1.6em;
                    background: lighten($scifi-cyan-hover, 50);
                    cursor: pointer;
                    @include border-radius(0.8em);
                }

                .commandpanel-row-slider::-moz-range-thumb {
                    width: 1.6em;
                    height: 1.6em;
                    background: lighten($scifi-cyan-hover, 50);
                    cursor: pointer;
                    @include border-radius(0.8em);
                }

                .commandpanel-row-value {
                    width: 30%;
                    color: white;
                    text-align: right;
                    font-size: 0.8em;
                    font-family: neuropol;

                    @include narrow-screen {
                        font-size: 0.6em;
                    }
                }

            }

            .commandpanel-row-switch-container {
                position: relative;
                width: 65%;
                height: 28px;
                opacity: 0.7;

                @include narrow-screen {
                    width: 100%;
                }

                input.commandpanel-row-switch-input {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 60px;
                    height: 28px;
                    opacity: 0;
                    z-index: 2;

                    &:checked + .commandpanel-row-switch-slider {
                        background: $scifi-cyan-hover;
                    }

                    &:checked + .commandpanel-row-switch-slider:after {
                        -webkit-transform: translateX(32px);
                        -ms-transform: translateX(32px);
                        transform: translateX(32px);
                    }
                }

                .commandpanel-row-switch-slider {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 60px;
                    height: 28px;
                    background: $silver-chalice2;
                    @include border-radius(28px);
                    @include transition(.4s);

                    &:after {
                        position: absolute;
                        content: "";
                        height: 24px;
                        width: 24px;
                        left: 2px;
                        bottom: 2px;
                        background-color: lighten($scifi-cyan-hover, 50);
                        @include border-radius(13px);
                        @include transition(.4s);
                    }
                }
            }

        }

    }

    #commandPanelDefaultBtn {
        margin-top: 2em;
        margin-bottom: 2em;
        position: relative;
        left: 0;

        @include smartphone-portrait {
            margin-bottom: 4em;
        }

        .fuller-button {
            color: rgba(255,255,255,1);
            background: none;
            padding-top: 1em;
            padding-bottom: 1em;
            padding-left: 3em;
            padding-right: 3em;
            letter-spacing: 0.35em;
            text-align: center;
            font-size: 1em;
            font-family: neuropol;
            transition: background-color 0.3s, box-shadow 0.3s, color 0.3s;
            // margin: 1em;
            @include border-radius(0.5em);

            &:hover {
                cursor: pointer
            }

            &.white {
                box-shadow: inset 0 0 0.8em rgba(255,255,255,0.3), 0 0 0.8em rgba(255,255,255,0.3);
                border: #fff solid 2px;
            }

            &.white:hover {
                color: rgba(0,0,0,0.8);
                background-color: #fff;
                box-shadow: inset 0 0 0 rgba(255,255,255,0.3), 0 0 1.2em rgba(255,255,255,0.5);
            }
        }

    }

    #commandPanelClose {
        position: fixed;
        top: 0;
        right: 0;
        margin: 0;

        width: $header-height;
        height: $header-height;
        line-height: $header-height;
        text-align: center;
        -moz-box-sizing: border-box;
        box-sizing: border-box;
        // background: red;

        @include narrow-screen {
            height: $header-height-smartphone;
            line-height: $header-height-smartphone;
        }

        z-index: 999;

    }

    #commandPanelCloseButton {
        position: absolute;
        top: calc((#{$header-height} - #{$hamburger-height}) * 0.5);
        right: $hamburger-margin;
        width: $hamburger-width;
        height: $hamburger-height;

        // background: #333;

        cursor: pointer;

        @include narrow-screen {
            top: calc((#{$header-height-smartphone} - #{$hamburger-height-smartphone}) * 0.5);
            right: $hamburger-margin-smartphone;
            width: $hamburger-width-smartphone;
            height: $hamburger-height-smartphone;
        }

        span {
            display: block;
            position: absolute;
            top: 50%;
            left: 0;
            height: 2px;
            width: 100%;
            background: white;

            &:nth-child(1) {
                @include rotate(-45);
            }

            &:nth-child(2) {
                @include rotate(45);
            }
        }

        &:hover span {
            box-shadow: 0 0 4px white;

            @include narrow-screen {
                box-shadow: 0 0 2px white;
            }

            &:nth-child(1) {
                @include animation(0, 2s, spin1)
            }

            &:nth-child(2) {
                @include animation(0, 2s, spin2)
            }
        }
    }

    @include keyframes(spin1) {
        from {
            @include rotate(45)
        }
        to {
            @include rotate(225)
        }
    }

    @include keyframes(spin2) {
        from {
            @include rotate(-45)
        }
        to {
            @include rotate(135)
        }
    }



</style>