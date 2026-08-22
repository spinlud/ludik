/**
 * ---------------------------------------------------------------------------------------
 * utils.js
 *
 * Miscellaneous framework-agnostic utility functions.
 * ---------------------------------------------------------------------------------------
 */

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
    wait
}
