/**
 * ---------------------------------------------------------------------------------------
 * utils.js
 *
 * Miscellaneous utility functions.
 * ---------------------------------------------------------------------------------------
 */

import * as THREE from 'three'

/**
 * Check if the current device has touch support.
 *
 * @returns {*} True if it is a touch device, false otherwise.
 */
function isTouchDevice () {
    let prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
    let mq = function(query) {
        return window.matchMedia(query).matches;
    };

    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
        return true;
    }

    // include the 'heartz' as a way to have a non matching MQ to help terminate the join
    // https://git.io/vznFH
    let query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
    return mq(query);
}

/**
 * Return true if device is Android, false otherwise.
 * @returns Boolean
 */
function isAndroid () {
    return !!((navigator.userAgent || navigator.vendor || window.opera).match( /Android/i));
}

/**
 * Return true if device is iOS, false otherwise.
 * @returns Boolean
 */
function isiOS() {
    return [
            'iPad Simulator',
            'iPhone Simulator',
            'iPod Simulator',
            'iPad',
            'iPhone',
            'iPod'
        ].includes(navigator.platform)
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document)
}

/**
 * Return true if browser is Safari, false otherwise.
 * @returns {boolean}
 */
function isSafari () {
    return (navigator.userAgent.indexOf('Safari') !== -1 && navigator.userAgent.indexOf('Chrome') === -1)
}

/**
 * Check if an object is a dom element.
 *
 * @param obj
 * @returns {boolean} True if it is a dom element, false otherwise
 */
function isDomElement (obj) {
    return obj instanceof Element || obj instanceof HTMLDocument;
}

/**
 * Recursively traverse an object3D graph applying a function to every node.
 *
 * @param obj Root object3D
 * @param fn Function applied to each node
 */
function sceneTraverse (obj, fn) {
    if (!obj) return

    fn(obj)

    if (obj.children && obj.children.length > 0) {
        obj.children.forEach(o => {
            sceneTraverse(o, fn)
        })
    }
}

/**
 * Test if given position is inside polygon.
 *
 * @param nvert Number of vertices
 * @param vertX Polygon vertices x coordinate (connection order)
 * @param vertY Polygon vertices y coordinate (connection order)
 * @param testX Position to test x coordinate
 * @param testY Position to test y coordinate
 * @returns {boolean}
 */
function isInsidePolygon (nvert, vertX, vertY, testX, testY) {
    let res = false
    let i, j

    for (i = 0, j = nvert - 1; i < nvert; j = i++) {
        if (((vertY[i] > testY) !== (vertY[j] > testY)) &&
            (testX < (vertX[j] - vertX[i]) * (testY - vertY[i]) / (vertY[j] - vertY[i]) + vertX[i]))
            res = !res
    }

    return res
}

/**
 * Computes polygon data from rectangular mesh.
 *
 * @param obj3D Rectangular mesh in 3D space
 * @param quaternion Rotation to apply to polygon points
 * @returns {{vertY: *[], vertX: *[], nvert: number}} Polygon data
 */
function polygonFromRect (obj3D, quaternion, scene) {
    if (!obj3D instanceof THREE.Object3D) {
        throw "Object must be instance of THREE.Object3D"
    }

    // Create Box3 from object position, rotation and scale
    const box = new THREE.Box3().setFromObject(obj3D)

    // Extract vertices from bounding box and apply level rotation
    const x1z1 = new THREE.Vector3(box.max.x, 0, box.max.z).applyQuaternion(quaternion)
    const x2z2 = new THREE.Vector3(box.min.x, 0, box.min.z).applyQuaternion(quaternion)
    const x1z2 = new THREE.Vector3(box.max.x, 0, box.min.z).applyQuaternion(quaternion)
    const x2z1 = new THREE.Vector3(box.min.x, 0, box.max.z).applyQuaternion(quaternion)

    return {
        nvert: 4,
        vertX: [x1z1.x, x1z2.x, x2z2.x, x2z1.x],
        vertY: [x1z1.z, x1z2.z, x2z2.z, x2z1.z]
    }
}

/**
 * Return Promise to await for
 * @param ms Milliseconds to wait
 * @returns {Promise<any>}
 */
function wait (ms) {
    return new Promise((resolve, reject) => {
        try {
            setTimeout(() => { return resolve() }, ms)
        }
        catch (e) {
            return reject(e)
        }
    })
}

export {
    isTouchDevice,
    isiOS,
    isAndroid,
    isSafari,
    isDomElement,
    sceneTraverse,
    isInsidePolygon,
    polygonFromRect,
    wait
}
