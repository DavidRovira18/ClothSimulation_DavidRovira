import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ParticleSystem } from './ParticleSystem.js';
import { particleIntersectsPlane } from './collisions.js';

var PARTICLE_SYSTEM = {
    init: function(){
        //Set up scene
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        //Add ground
        var planeGeometry = new THREE.PlaneGeometry(100, 100); 
        var planeMaterial = new THREE.MeshBasicMaterial({ color: "darkgreen", side: THREE.DoubleSide }); 
        this.ground = new THREE.Mesh(planeGeometry, planeMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.scene.add(this.ground);

        this.groundBB = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3()); //Ground BoundingBox for collisions
        this.groundBB.setFromObject(this.ground);

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
        this.camera.position.y = 30;
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enableZooming = true;
        this.controls.dampingFactor = 0.25;

        //Init particle system
        this.particleSystem = new ParticleSystem(this.scene);

        //Init clock
        this.clock = new THREE.Clock();

        //Delta time computation (temporal)
        this.currentTime = performance.now();
        this.dt = 1/60;

        // Variables for user interaction
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();

        this.renderer.domElement.addEventListener('click', this.addParticle);
    },

    loop: function ()
    {
        var self = PARTICLE_SYSTEM;

        //var deltaTime = self.clock.getDelta();
        self.controls.update();

        var newTime = performance.now();
        var frameTime = newTime - self.currentTime;
        self.currentTime = newTime;

        while(frameTime > 0.0)
        {
            var deltaTime = Math.min(frameTime, self.dt);
            self.particleSystem.update(deltaTime);

            //Check collisions
            self.particleSystem.particles.forEach(particle => {
                if(particleIntersectsPlane(particle.BB, self.groundBB))
                    particle.grounded = true;
            });
            
            frameTime -= deltaTime;
        }



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

        self.particleSystem.addParticle(10, pos);

        console.log("Particle Added")
    }
}

PARTICLE_SYSTEM.init();
PARTICLE_SYSTEM.loop();
