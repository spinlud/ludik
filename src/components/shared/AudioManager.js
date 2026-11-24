/**
 * ---------------------------------------------------------------------------------------
 * AudioManager.js
 * ---------------------------------------------------------------------------------------
 */

"use strict"

const CTX = new (window.AudioContext || window.webkitAudioContext)()
const TAG = "[AudioManager]"

const loadAudio = (url) => {

    const xhr = new XMLHttpRequest()
    xhr.open("GET", url, true)
    xhr.responseType = "arraybuffer"

    return new Promise((resolve, reject) => {

        xhr.onload = () => {
            CTX.decodeAudioData(xhr.response, buffer => {
                return resolve(buffer)
            }, error => {
                return reject(error)
            })
        }

        xhr.onerror = (error) => {
            return reject(error)
        }

        xhr.send()

    })
}

export default class AudioManager {

    constructor () {

        this.audioContext = CTX
        this.globalGain = CTX.createGain()
        this.globalGain.connect(CTX.destination)

        this.buffers = { }

    }

    static async resume () {

        await CTX.resume()

    }

    static async suspend () {

        await CTX.suspend()

    }

    async loadBuffer (url) {

        if (!this.buffers.hasOwnProperty(url)) {
            this.buffers[url] = await loadAudio(url)
        }

        return this.buffers[url]

    }

    async createSoundFromUrl (url, volume = 1.0) {

        const src = CTX.createBufferSource()
        src.buffer = await this.loadBuffer(url)
        const gain = CTX.createGain()
        gain.gain.value = volume
        src.connect(gain)
        gain.connect(this.globalGain)
        return src

    }

    createSoundFromBuffer (buffer, volume = 1.0) {

        const src = CTX.createBufferSource()
        src.buffer = buffer
        const gain = CTX.createGain()
        gain.gain.value = volume
        src.connect(gain)
        gain.connect(this.globalGain)
        return src

    }

}

