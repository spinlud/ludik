/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

const MyDeviceOrientationControls = function (object, player, offsetY ) {

    var scope = this;

    this.object = object;
    this.object.rotation.reorder( 'YXZ' );

    this.enabled = true;

    this.deviceOrientation = {};
    this.screenOrientation = 0;

    this.alphaOffset = offsetY || 0; // radians

    var onDeviceOrientationChangeEvent = function ( event ) {

        scope.deviceOrientation = event;

    };

    var onScreenOrientationChangeEvent = function () {

        scope.screenOrientation = window.orientation || 0;

    };

    // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''

    var setObjectQuaternion = function () {

        var zee = new THREE.Vector3( 0, 0, 1 );

        var euler = new THREE.Euler();

        var q0 = new THREE.Quaternion();

        var q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis

        return function ( quaternion, alpha, beta, gamma, orient ) {

            euler.set( beta, alpha, - gamma, 'YXZ' ); // 'ZXY' for the device, but 'YXZ' for us

            quaternion.setFromEuler( euler ); // orient the device

            quaternion.multiply( q1 ); // camera looks out the back of the device, not the top

            quaternion.multiply( q0.setFromAxisAngle( zee, - orient ) ); // adjust for screen orientation

        };

    }();

    this.connect = function () {

        onScreenOrientationChangeEvent(); // run once on load

        window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
        window.addEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

        scope.enabled = true;

    };

    this.disconnect = function () {

        window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent, false );
        window.removeEventListener( 'deviceorientation', onDeviceOrientationChangeEvent, false );

        scope.enabled = false;

    };

    this.update = function () {

        if ( scope.enabled === false ) return;

        var device = scope.deviceOrientation;

        if ( device ) {

            var alpha = device.alpha ? THREE.Math.degToRad( device.alpha ) + scope.alphaOffset : 0; // Z

            var beta = device.beta ? THREE.Math.degToRad( device.beta ) : 0; // X'

            var gamma = device.gamma ? THREE.Math.degToRad( device.gamma ) : 0; // Y''

            var orient = scope.screenOrientation ? THREE.Math.degToRad( scope.screenOrientation ) : 0; // O

            setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );

        }


    };



    // -----------------------------------------------------------------------------------------------------------------

    this.enable = function () {

        scope.enabled = true;

    }

    this.disable = function () {

        scope.enabled = false;

    }

    this.getObject = function () {

        return object;

    }

    this.getPosition = function () {

        return object.position;

    }

    let pos2D = new THREE.Vector2();
    this.getPosition2D = function () {

        pos2D.set(object.position.x, object.position.z);
        return pos2D;

    }

    this.setPosition = function (x, y, z) {

        // For pathfinding to work we have to update also player position.
        // It is mportant to keep player Y position, otherwise pathfinding will fail to find path.
        player.position.set(x, player.position.y, z);
        player.updateMatrixWorld()
        object.position.set(x, y, z);

    }

    this.setPositionXZ = function (x, z) {

        // For pathfinding to work we have to update also player position.
        // It is mportant to keep player Y position, otherwise pathfinding will fail to find path.
        player.position.set(x, player.position.y, z);
        player.updateMatrixWorld()
        object.position.set(x, object.position.y, z);

    }

    this.getRotation = function () {

        return object.rotation;

    }

    this.setRotation = function (x, y, z) {

        object.rotation.set(x, y, z);

    }

    this.getDirection = function (v) {

        object.getWorldDirection(v);

    }

    // -----------------------------------------------------------------------------------------------------------------

    this.dispose = function () {

        scope.disconnect();

    };

    this.connect();

};

export { MyDeviceOrientationControls }