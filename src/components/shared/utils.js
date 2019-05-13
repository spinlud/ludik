/**
 * ---------------------------------------------------------------------------------------
 * utils.js
 *
 * Miscellaneous utility functions.
 * ---------------------------------------------------------------------------------------
 */

const DAT = require("dat.gui")
const T = THREE

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

    if ((navigator.userAgent || navigator.vendor || window.opera).match( /Android/i)) {
        return true
    }
    else {
        return false
    }

}

/**
 * Return true if device is iOS, false otherwise.
 * @returns Boolean
 */
function isiOS() {

    var iDevices = [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ];

    if (!!navigator.platform) {
        while (iDevices.length) {
            if (navigator.platform === iDevices.pop()){ return true; }
        }
    }

    return false;
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
 * Execute a function for each object in the scene graph.
 *
 * @param obj
 * @param fn
 */
function sceneTraverse(obj, fn) {

    if (!obj) return

    fn(obj);

    if (obj.children && obj.children.length > 0) {
        obj.children.forEach(o => {
            sceneTraverse(o, fn);
        });
    }
}

/**
 * Test if given position is inside polygon
 *
 * @param nvert Number of vertices
 * @param vertX Polygon vertices x coordinate (connection order)
 * @param vertY Polygon vertices y coordinate (connection order)
 * @param testX Position to test x coordinate
 * @param testY Position to test y coordinate
 * @returns {boolean}
 */
function isInsidePolygon(nvert, vertX, vertY, testX, testY) {
    let res = false
    let i, j;

    for (i = 0, j = nvert - 1; i < nvert; j = i++) {
        if ( ((vertY[i] > testY) !== (vertY[j] > testY) ) &&
            (testX < (vertX[j] - vertX[i]) * (testY - vertY[i]) / (vertY[j] - vertY[i]) + vertX[i]) )
            res = !res;
    }

    return res;
}

/**
 * Computes polygon data from rectangular mesh
 * @param obj3D Rectangular mesh in 3D space
 * @param quaternion Rotation to apply to polygon points
 * @returns {{vertY: *[], vertX: *[], nvert: number}} Polygon data
 */
function polygonFromRect (obj3D, quaternion, scene) {

    if (!obj3D instanceof THREE.Object3D) {
        throw "Object must be instance of THREE.Object3D"
    }

    // Create Box3 from object position, rotation and scale
    const box = new T.Box3().setFromObject(obj3D)

    // Extract vertices from bounding box and apply level rotation
    const x1z1 = new T.Vector3(box.max.x, 0, box.max.z).applyQuaternion(quaternion)
    const x2z2 = new T.Vector3(box.min.x, 0, box.min.z).applyQuaternion(quaternion)
    const x1z2 = new T.Vector3(box.max.x, 0, box.min.z).applyQuaternion(quaternion)
    const x2z1 = new T.Vector3(box.min.x, 0, box.max.z).applyQuaternion(quaternion)

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

/**
 * Utility to generate dat.gui from configuration object (only for ranges min-max).
 * conf is an Array of Objects {name, <propName>, mix, max, cb} where propName key is equal to name:
 * [
 * {
                    name: "threshold",
                    threshold: 0.01,
                    min: 0.0,
                    max: 1.0,
                    cb: (v) => { unrealBloomPass.threshold = v }
                }
 * ]
 */
function initDatGUI (conf) {

    const gui = new DAT.GUI();
    $( ".dg.ac" ).css("zIndex", "99");

    for (let o of conf) {
        // console.log(o);
        gui.add(o, o.name).min(o.min).max(o.max).step(o.step ? o.step : 0.1).onChange(v => {o.cb(v)})
    }

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
    wait,
    initDatGUI
}