/**
 * @author mrdoob / http://mrdoob.com/
 * @author Mugen87 / https://github.com/Mugen87
 */

const MyPointerLockControls = function ( camera, domElement, cameraOffsetY ) {

    var scope = this;

    this.domElement = domElement || document.body;
    this.isLocked = false;
    this.enabled = true;
    this.eventData = undefined // Custom event data

    camera.rotation.set( 0, 0, 0 );

    var pitchObject = new THREE.Object3D();
    pitchObject.add( camera );

    var yawObject = new THREE.Object3D();
    yawObject.position.y = cameraOffsetY || 10; // added
    yawObject.add( pitchObject );

    var PI_2 = Math.PI / 2;

    function cloneObject (obj) {

        return JSON.parse(JSON.stringify(obj))

    }

    function onMouseMove( event ) {

        if ( scope.isLocked === false ) return;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        yawObject.rotation.y -= movementX * 0.002;
        pitchObject.rotation.x -= movementY * 0.002;

        pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

    }

    function onPointerlockChange() {

        if ( document.pointerLockElement === scope.domElement ) {

            scope.eventData ?
                scope.dispatchEvent( { type: 'lock', data: cloneObject(scope.eventData) } ) :
                scope.dispatchEvent( { type: 'lock', data: undefined } )

            scope.eventData = undefined

            scope.isLocked = true;

        } else {

            scope.eventData ?
                scope.dispatchEvent( { type: 'unlock', data: cloneObject(scope.eventData) } ) :
                scope.dispatchEvent( { type: 'unlock', data: undefined } )

            scope.eventData = undefined

            scope.isLocked = false;

        }

    }

    function onPointerlockError() {

        console.error( 'MyPointerLockControls: Unable to use Pointer Lock API' );

    }

    this.connect = function () {

        document.addEventListener( 'mousemove', onMouseMove, false );
        document.addEventListener( 'pointerlockchange', onPointerlockChange, false );
        document.addEventListener( 'pointerlockerror', onPointerlockError, false );

    };

    this.disconnect = function () {

        document.removeEventListener( 'mousemove', onMouseMove, false );
        document.removeEventListener( 'pointerlockchange', onPointerlockChange, false );
        document.removeEventListener( 'pointerlockerror', onPointerlockError, false );

    };

    this.dispose = function () {

        this.disconnect();

    };

    this.getObject = function () {

        return yawObject;

    };

    this.enable = function () {

        scope.enabled = true;

    };

    this.disable = function () {

        scope.enabled = false;

    };

    this.getObject = function () {

        return yawObject;

    };

    this.getPosition = function () {

        return yawObject.position;

    }

    let pos2D = new THREE.Vector2()
    this.getPosition2D = function () {

        pos2D.set(yawObject.position.x, yawObject.position.z)
        return pos2D

    }

    this.setPosition = function (x, y, z) {

        yawObject.position.set(x, y, z);

    }

    this.setPositionXZ = function (x, z) {

        yawObject.position.set(x, yawObject.position.y, z);

    }

    this.getRotation = function () {

        return new THREE.Vector3(pitchObject.rotation.x, yawObject.rotation.y, 0);

    }

    this.setRotation = function (x, y, z = 0) {

        pitchObject.rotation.set(x, 0, 0);
        yawObject.rotation.set(0, y, 0);

    }

    this.getDirection = function () {

        // assumes the camera itself is not rotated

        var direction = new THREE.Vector3( 0, 0, - 1 );
        var rotation = new THREE.Euler( 0, 0, 0, 'YXZ' );

        return function ( v ) {

            rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

            v.copy( direction ).applyEuler( rotation );

            return v;

        };

    }();

    this.lock = function (data) {

        this.eventData = data
        this.domElement.requestPointerLock();

    };

    this.unlock = function (data) {

        this.eventData = data
        document.exitPointerLock();

    };

    this.connect();

};

MyPointerLockControls.prototype = Object.create( THREE.EventDispatcher.prototype );
MyPointerLockControls.prototype.constructor = MyPointerLockControls;

export { MyPointerLockControls }