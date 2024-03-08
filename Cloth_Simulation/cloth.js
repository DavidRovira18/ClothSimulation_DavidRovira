import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js"

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

        // Variables for user interaction
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
    }
}
