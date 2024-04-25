import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ParticleSystem } from './ParticleSystem.js';
import { EulerIntegrator, SemiImplicitEulerIntegrator } from './integrators.js';

var PARTICLE_SYSTEM = {
    init: function(){
        //Set up scene
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        //Add ambiental light
        this.ambient_light = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(this.ambient_light);

        //Random lights to test (copied from atuto)
        this.keyLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
        this.keyLight.position.set(-100, 0, 100);

        this.fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
        this.fillLight.position.set(100, 0, 100);

        this.backLight = new THREE.DirectionalLight(0xffffff, 1.0);
        this.backLight.position.set(100, 0, -100).normalize();

        this.scene.add(this.keyLight);
        this.scene.add(this.fillLight);
        this.scene.add(this.backLight);


        //Set up camera and controls
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 20;
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enableZooming = true;
        this.controls.dampingFactor = 0.25;

        //Init particle system
        this.particleSystem = new ParticleSystem(this.scene);
        // Variables for user interaction
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();

        this.renderer.domElement.addEventListener('click', this.addParticle);
    },

    loop: function ()
    {
        var self = PARTICLE_SYSTEM;
        self.controls.update();

        self.renderer.render(self.scene, self.camera);
        
        requestAnimationFrame(self.loop);
    },

    addParticle: function(event)
    {
        var self = PARTICLE_SYSTEM;
        //Normalized coordinates of the mousse
        self.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        self.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        self.raycaster.setFromCamera(self.mouse, self.camera);

        var intersection = new THREE.Vector3();
        self.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), intersection);

        console.log(intersection)

        var pos = new THREE.Vector3().copy(intersection);

        console.log(pos)
        self.particleSystem.addParticle(10, pos);

        console.log("Particle Added")
    }
}

PARTICLE_SYSTEM.init();
PARTICLE_SYSTEM.loop();
