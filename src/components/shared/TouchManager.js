/**
 * ---------------------------------------------------------------------------------------
 * TouchManager.js
 *
 *
 * ---------------------------------------------------------------------------------------
 */

import EventManager from "./EventManager"
import { isDomElement, isAndroid } from "./utils"
const TAG = "[TouchManager]"

export default class TouchManager {

    constructor (domElement, eventManager) {

        if (!domElement || !isDomElement(domElement)) {
            throw `${TAG}\tArgument domElement must be a valid dom element`
        }

        if (!eventManager || !(eventManager instanceof EventManager)) {
            throw `${TAG}\tArgument eventManager must be an instance of EventManager`
        }

        this.domElement = domElement
        this.eventManager = eventManager
        this.isAndroid = isAndroid()
        this.isTouchMove = false

        const touchStartHooks = []
        const touchMoveHooks = []
        const touchEndHooks = []

        let lastPageX
        let lastPageY // not used
        let targetTouch
        let deltaPageX
        let deltaPageY  // not used
        let clientX
        let clientY

        const onTouchStart = (e) => {

            this.isTouchMove = false
            lastPageX = this.isAndroid ? e.targetTouches[0].pageX : e.pageX
            targetTouch = e.targetTouches[0]

            for (const fn of touchStartHooks) {
                fn()
            }

        }

        const onTouchMove = (e) => {

            this.isTouchMove = true

            if (this.isAndroid) {
                deltaPageX = e.targetTouches[0].pageX - lastPageX
                lastPageX = e.targetTouches[0].pageX
            }
            else {
                deltaPageX = e.pageX - lastPageX
                lastPageX = e.pageX
            }

            for (const fn of touchMoveHooks) {
                fn(deltaPageX)
            }

        }

        const onTouchEnd = (e) => {

            clientX = targetTouch.pageX
            clientY = targetTouch.pageY

            for (const fn of touchEndHooks) {
                fn(clientX, clientY)
            }

            this.isTouchMove = false

        }

        this.addTouchStartHook = (fn) => {

            if (typeof fn !== "function") {
                throw `${TAG}\tArgument fn must be a function`
            }

            touchStartHooks.push(fn)

        }

        this.addTouchMoveHook = (fn) => {

            if (typeof fn !== "function") {
                throw `${TAG}\tArgument fn must be a function`
            }

            touchMoveHooks.push(fn)

        }

        this.addTouchEndHook = (fn) => {

            if (typeof fn !== "function") {
                throw `${TAG}\tArgument fn must be a function`
            }

            touchEndHooks.push(fn)

        }

        this.eventManager.addDomEvent(this.domElement, "touchstart", onTouchStart)
        this.eventManager.addDomEvent(this.domElement, "touchmove", onTouchMove)
        this.eventManager.addDomEvent(this.domElement, "touchend", onTouchEnd)

    }

}