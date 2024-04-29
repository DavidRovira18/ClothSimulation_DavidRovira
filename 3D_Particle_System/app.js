import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ParticleSystem, SpringMassSystem } from './ParticleSystem.js';
import { particleIntersectsPlane } from './collisions.js';

var PARTICLE_SYSTEM = {
    init: function(){
        //Set up falling particles scene
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

        //Set up mass spring scene
        this.scene2 = new THREE.Scene();
        this.scene2.add(this.keyLight);
        this.scene2.add(this.fillLight);
        this.scene2.add(this.backLight);

        //Set up camera and controls
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.z = 20;
        this.camera.position.y = 30;
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enableZooming = true;
        this.controls.dampingFactor = 0.25;

        //Set current scene
        this.currentScene = this.scene;

        //Init particle system
        this.particleSystem = new ParticleSystem(this.currentScene);

        //Delta time computation (temporal)
        this.currentTime = performance.now();
        this.dt = 1/60;

        // Variables for user interaction
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.selectedParticle = undefined;

        this.renderer.domElement.addEventListener('click', this.handleClick);
    },

    loop: function ()
    {
        var self = PARTICLE_SYSTEM;

        self.controls.update();

        var newTime = performance.now();
        var frameTime = newTime - self.currentTime;
        self.currentTime = newTime;

        while(frameTime > 0.0)
        {
            var deltaTime = Math.min(frameTime, self.dt);
            self.particleSystem.update(deltaTime);

            //Check collisions scene1
            if(self.currentScene == self.scene)
            {
                self.particleSystem.particles.forEach(particle => {
                    if(particleIntersectsPlane(particle.BB, self.groundBB))
                        particle.grounded = true;
                });
            }
            
            frameTime -= deltaTime;
        }

        self.renderer.render(self.currentScene, self.camera);
        
        requestAnimationFrame(self.loop);
    },

    addParticle: function()
    {
        var intersection = new THREE.Vector3();
        self.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), intersection);

        console.log(intersection)

        var pos = new THREE.Vector3().copy(intersection);

        self.particleSystem.addParticle(10, pos);

        console.log("Particle Added")

        if(self.currentScene == self.scene2)
        {
            const particles = self.particleSystem.particles;
            self.particleSystem.addSpring(particles[particles.length - 2], particles[particles.length - 1], 1, 0.1);
        }
    },

    handleClick: function(event)
    {
        var self = PARTICLE_SYSTEM;
        
        //Normalized coordinates of the mousse
        self.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        self.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        self.raycaster.setFromCamera(self.mouse, self.camera);

        const intersections = self.raycaster.intersectObjects(self.particleSystem.particles.map(particle => particle.mesh));

        if(intersections.length > 0)
        {
            // If there's an intersection, select the first particle (closest to the camera)
            self.selectedParticle = intersections[0].object;
            return;
        }

        else
            self.addParticle();
    }
}

var self = PARTICLE_SYSTEM;

document.addEventListener('keydown', function(event) {

    if (event.key === 'k')
    {
        self.currentScene = self.scene2; // Switch to scene2 if k is pressed
        self.particleSystem = new SpringMassSystem(self.scene2)

        //Set the first two particles to create the system
        self.particleSystem.addParticle(10, new THREE.Vector3(10,10,10));
        self.particleSystem.addParticle(10, new THREE.Vector3(10,10,20));
        self.particleSystem.addSpring(self.particleSystem.particles[0], self.particleSystem.particles[1], 1, 0.1);
        requestAnimationFrame(self.loop);
    } 
    

    if (event.key === 'p')
    {
        self.currentScene = self.scene; // Switch to scene1 if p is pressed
        self.particleSystem = new ParticleSystem(self.scene)
        
        requestAnimationFrame(self.loop)
    }

});

self.init();
self.loop();
