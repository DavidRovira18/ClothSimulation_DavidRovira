import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

var CLOTHSIM = {
    init: function(){
        //Set up scene
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        //Set up camera and controls
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 2;
        this.controls = new OrbitControls( camera, renderer.domElement );
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;

        //OBJ Loader
        this.self = this; //reference to this
        this.loader = new OBJLoader();
        this.loader.load(
            // resource URL
            'models/cloth.obj',
            // called when resource is loaded
            function ( object ) {
        
                self.scene.add( object );
        
            },
            // called when loading is in progresses
            function ( xhr ) {
        
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        
            },
            // called when loading has errors
            function ( error ) {
        
                console.log( 'An error happened' );
        
            }
        )

        // Variables for user interaction
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
    }
}

CLOTHSIM.init();
