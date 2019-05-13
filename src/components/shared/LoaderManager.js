/**
 * ---------------------------------------------------------------------------------------
 * LoaderManager.js
 * ---------------------------------------------------------------------------------------
 */

"use strict"

const T = THREE
require("./GLTFLoader.js")
require("./DRACOLoader.js")
require("./TTFLoader.js")

export default class LoaderManager extends T.EventDispatcher {

    constructor (itemsTotal) {

        super()

        if (!itemsTotal || !Number.isInteger(itemsTotal) || itemsTotal < 1) {

            throw "itemsTotal must be a positive integer"

        }

        this.itemsTotal = itemsTotal

        this.events = {
            load: "LOAD",
            progress: "PROGRESS",
            error: "ERROR"
        }

        this.manager = new T.LoadingManager()

        this.manager.onLoad = () => {

            // this.dispatchEvent({
            //     type: this.events.load,
            //     msg: `Loading completed`
            // })

        }

        this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {

            // console.log(`Loaded: ${itemsLoaded}/${itemsTotal}`)

            // this.dispatchEvent({
            //     type: this.events.progress,
            //     itemsLoaded: itemsLoaded,
            //     itemsTotal: this.itemsTotal
            // })

        }

        this.manager.onError = (url) => {

            // this.dispatchEvent({
            //     type: this.events.error,
            //     msg: `There was an error loading ${url}`
            // })

        }

        this.textureLoader = LoaderManager.promisifyLoader(new T.TextureLoader(this.manager))
        this.gltfLoader = LoaderManager.promisifyLoader(new T.GLTFLoader(this.manager))
        this.cubeTextureLoader = LoaderManager.promisifyLoader(new T.CubeTextureLoader(this.manager))
        this.audioLoader = LoaderManager.promisifyLoader(new T.AudioLoader(this.manager))
        this.fontLoader = LoaderManager.promisifyLoader(new T.FontLoader(this.manager))
        this.ttfLoader = LoaderManager.promisifyLoader(new T.TTFLoader(this.manager))
    }

    /**
     *
     * @param loader
     * @returns {{load: (function(*=, *=): Promise<any>), loader: *}}
     */
    static promisifyLoader (loader) {

        const load = (url, onprogress) => {
            return new Promise((resolve, reject) => {

                function _onload(res) {
                    return resolve(res)
                }

                function _onerror(e) {
                    return reject(e)
                }

                loader.load(url, _onload, onprogress, _onerror)
            })
        }

        return {
            loader: loader,
            load: load
        }

    }

    loadTexture (url, onprogress) {

        return this.textureLoader.load(url, onprogress)

    }

    loadSkybox (urls, onprogress) {

        return this.cubeTextureLoader.load(urls, onprogress)

    }

    loadGLTF (url, onprogress) {

        return this.gltfLoader.load(url, onprogress)

    }

    loadAudio (url, onprogress) {

        return this.audioLoader.load(url, onprogress)

    }

    async loadFont (url, onprogress) {

        const ext = url.substr(url.lastIndexOf(".") + 1).toLowerCase()

        if (ext === "json") {
            return this.fontLoader.load(url, onprogress)
        }

        if (ext === "ttf") {
            const ttf = await this.ttfLoader.load(url, onprogress)
            return this.fontLoader.loader.parse(ttf)
        }

    }

    loadImage (url) {

        const image = new Image()

        return new Promise((resolve, reject) => {

            image.addEventListener("load", () => resolve(image), false)
            image.addEventListener("error", e => reject(e), false)

            image.src = url

        })

    }





}


