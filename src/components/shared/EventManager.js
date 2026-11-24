/**
 * ---------------------------------------------------------------------------------------
 * EventManager.js
 *
 * Tracks DOM and bus event subscriptions so they can be torn down together. The event bus
 * is backed by `mitt` (Vue 3 removed the instance-as-event-bus pattern).
 * ---------------------------------------------------------------------------------------
 */

import mitt from "mitt"

const TAG = "[EventManager]"
const eventBus = mitt()

export default class EventManager {

    constructor () {
        this.domEvents = []
        this.busEvents = []
    }

    emit (event, data) {
        eventBus.emit(event, data)
    }

    addDomEvent (target, event, cb, bubble = false) {

        target.addEventListener(event, cb, bubble)

        this.domEvents.push({
            target: target,
            event: event,
            cb: cb,
            bubble: bubble
        })

    }

    addBusEvent (event, cb) {

        this.busEvents.push({
            event: event,
            cb: cb
        })

        eventBus.on(event, cb)

    }

    addBusEventOnce (event, cb) {

        const handler = (data) => {
            eventBus.off(event, handler)
            cb(data)
        }

        this.busEvents.push({
            event: event,
            cb: handler
        })

        eventBus.on(event, handler)

    }

    removeDomEvent (target, event, cb, bubble) {

        target.removeEventListener(event, cb, bubble || false)

    }

    removeDomEvents () {

        let e
        let count = 0

        while (this.domEvents.length) {
            e = this.domEvents.pop()
            e.target.removeEventListener(e.event, e.cb, e.bubble)
            count += 1
        }

        console.log(TAG, `Removed all dom events (${count})`)

    }

    removeBusEvents () {

        let e
        let count = 0

        while (this.busEvents.length) {
            e = this.busEvents.pop()
            eventBus.off(e.event, e.cb)
            count += 1
        }

        console.log(TAG, `Removed all bus events (${count})`)

    }

}

// static
EventManager.events = {

    WORLD_WEBGL_START: "WORLD_WEBGL_START",
    WORLD_WEBGL_STOP: "WORLD_WEBGL_STOP",

}
