<template>
    <div id="homeHeader" ref="container"></div>
</template>

<script setup>

    import { onMounted, onBeforeUnmount, ref, watch } from "vue"
    import * as THREE from "three"
    import { TextGeometry } from "three/addons/geometries/TextGeometry.js"
    import { useAppStore } from "@/stores/app"
    import { states } from "@/stores/storeUtils"
    import EventManager from "../shared/EventManager"
    import LoaderManager from "../shared/LoaderManager"

    const store = useAppStore()

    const container = ref(null)

    let scene = null
    let camera = null
    let renderer = null
    let clock = null
    let eventManager = null
    let loaderManager = null

    let textMesh = null
    let requestAnimationId = null

    // Per-frame animation callbacks, invoked with (elapsed, delta).
    const fnlp = []

    let width = 0
    let height = 0
    let elapsed
    let delta

    function readSize () {
        const computedStyle = window.getComputedStyle(container.value)
        width = Math.floor(parseFloat(computedStyle.getPropertyValue("width")))
        height = Math.floor(parseFloat(computedStyle.getPropertyValue("height")))
    }

    /**
     * Build the hero "L U D I K" text mesh and register its animation.
     * @returns {Promise<void>}
     */
    async function create3DText () {

        const font = await loaderManager.loadFont("assets/fonts/Neon Vortex.ttf")

        const textGeometry = new TextGeometry("L U D I K", {
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

            new THREE.MeshBasicMaterial({
                color: 0x081446,
                wireframe: false,
            }),
            new THREE.MeshBasicMaterial({
                color: 0x1EA4F9,
                wireframe: true,
            }),

        ]

        textMesh = new THREE.Mesh(textGeometry, textMaterial)
        textMesh.rotation.y = Math.PI
        scene.add(textMesh)

        camera.lookAt(textMesh.position)

        const PI_8 = Math.PI / 8
        const PI_12 = Math.PI / 12

        fnlp.push((elapsed) => {

            textMesh.rotation.y = Math.sin(elapsed * .5) * PI_12 + Math.PI
            textMesh.rotation.x = Math.cos(elapsed * .5) * PI_8

        })

    }

    /**
     * Initialize the WebGL context and the 3D header.
     * @returns {Promise<void>}
     */
    async function initWebGL () {

        readSize()

        scene = new THREE.Scene()

        camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 4000)

        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.setClearColor(0x000000, 0)
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)
        container.value.appendChild(renderer.domElement)

        clock = new THREE.Clock()

        eventManager = new EventManager()
        loaderManager = new LoaderManager(1)

        await create3DText()

        // TODO(#81): restore Bloom/Glitch/ChromaticAberration postprocessing
        // (EffectComposer + RenderPass + EffectPass) here. The hero currently
        // renders straight to screen, so the neon glow is deferred to #81.

        renderer.compile(scene, camera)
        eventManager.addDomEvent(window, "resize", onWindowResize)
        onWindowResize()

    }

    /**
     * Start the render loop.
     */
    function startWebGL () {

        onWindowResize()

        const animate = () => {

            delta = clock.getDelta()
            elapsed = clock.elapsedTime
            fnlp.forEach(f => f(elapsed, delta))
            renderer.render(scene, camera)
            requestAnimationId = requestAnimationFrame(animate)

        }

        animate()

    }

    /**
     * Stop the render loop.
     */
    function stopWebGL () {

        if (requestAnimationId) {
            cancelAnimationFrame(requestAnimationId)
            requestAnimationId = null
        }

    }

    /**
     * Window resize handler: reposition the camera and resize the renderer.
     */
    function onWindowResize () {

        readSize()

        camera.position.set(0, 2, -(1000. / width) * 200)
        camera.lookAt(scene.position)

        camera.aspect = width / height
        camera.updateProjectionMatrix()

        renderer && renderer.setSize(width, height)

    }

    /**
     * Dispose GPU resources and detach the renderer.
     */
    function dispose () {

        if (textMesh) {
            textMesh.geometry.dispose()
            const materials = Array.isArray(textMesh.material) ? textMesh.material : [textMesh.material]
            materials.forEach(m => m.dispose())
            scene && scene.remove(textMesh)
            textMesh = null
        }

        if (renderer) {
            renderer.domElement.remove()
            renderer.dispose()
            renderer = null
        }

    }

    // Follow the Home view lifecycle: hide the header and pause the render loop
    // while the World is active, restore both when Home is shown again.
    watch(() => store.homeState, (newVal) => {
        switch (newVal) {
            case states.home.start:
                container.value.style.display = "block"
                startWebGL()
                break
            case states.home.stop:
                stopWebGL()
                container.value.style.display = "none"
                break
        }
    })

    onMounted(async () => {
        await initWebGL()

        // Gate the initial render on the current Home lifecycle state. The
        // watcher only fires on later changes, so at cold boot it never runs:
        // start and show only when Home is already active, otherwise hide the
        // header and leave the loop stopped until Home starts.
        if (store.homeState === states.home.start) {
            startWebGL()
        } else {
            container.value.style.display = "none"
        }
    })

    onBeforeUnmount(() => {
        stopWebGL()
        eventManager && eventManager.removeDomEvents()
        eventManager && eventManager.removeBusEvents()
        dispose()
    })

</script>

<style scoped lang="scss">
    #homeHeader {
        width: 100vw;
        height: 24em;

        @include narrow-screen {
            height: 16em;
        }
    }
</style>
