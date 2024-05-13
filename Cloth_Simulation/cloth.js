import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { Particle, ParticleSystem, SpringMassSystem } from './ParticleSystem.js';


var CLOTHSIM = {
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

        //Init Particle System
        this.particleSystem = new SpringMassSystem(this.scene);

        //OBJ Loader
        this.self = this; //reference to this
        this.loader = new OBJLoader();
        this.loader.setPath('./models/');
        this.loader.load(
            // resource URL
            'cloth.obj',
            // called when resource is loaded
            ( object ) => {
                if (object.children[0] instanceof THREE.Mesh)
                    object.children[0].material.side = THREE.DoubleSide;
                this.scene.add( object );

                const geometry = object.children[0].geometry;
                const position = geometry.attributes.position;
            
                const vertices = [];
                const numVertices = position.count;
            
                // Define neighborhood radius
                const neighborhoodRadius = 15; // 
            
                // Create spheres representing neighborhoods around each vertex
                const spheres = [];
                for (let i = 0; i < numVertices; ++i) {
                    const vertex = new THREE.Vector3().fromBufferAttribute(position, i); // Get vertex position
                    vertices.push(vertex);
                }
            
                const stiffness = 1;
                const damping = 1;

                //Create particle in each vertex
                for (let i = 0; i < numVertices; ++i)
                {
                    const vertex = vertices[i];
                    var particle = CLOTHSIM.particleSystem.getParticleFromPos(vertex);

                    // If no particle in position, create particle and add it to particleSystem
                    const mass = 1;
                    if (!particle) 
                    {
                        particle = new Particle(mass, vertex, this.scene);
                        CLOTHSIM.particleSystem.addParticle(particle);
                        const sphere = new THREE.Sphere(vertex, neighborhoodRadius);
                        spheres.push(sphere);
                    }

                }
                
                //Create links between neighbor particles
                for (let i = 0; i < CLOTHSIM.particleSystem.particles.length; ++i)
                    for (let j = 0; j < spheres.length; ++j)
                    {
                        var particle = CLOTHSIM.particleSystem.particles[i];
                        var sphere = spheres[j];

                        if(sphere.center.equals(particle.pos))
                            continue;

                        if(sphere.containsPoint(particle.pos))
                            CLOTHSIM.particleSystem.addSpring(particle, CLOTHSIM.particleSystem.particles[j], stiffness, damping);

                    }   
            },
            // called when loading is in progress
            ( xhr ) => {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            // called when loading has errors
            ( error ) => {
                console.error('An error occurred while loading the OBJ file:', error);
            }
        );
        // Variables for user interaction
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();

        //Delta time computation
        this.currentTime = performance.now();
        this.dt = 1/60;

        console.log(this.particleSystem.particles)
    },

    loop: function ()
    {
        var self = CLOTHSIM;
        self.controls.update();

        var newTime = performance.now();
        var frameTime = newTime - self.currentTime;
        self.currentTime = newTime;

        while(frameTime > 0.0)
        {
            var deltaTime = Math.min(frameTime, self.dt);
            //self.particleSystem.update(deltaTime);

            frameTime -= deltaTime;
        }

        self.renderer.render(self.scene, self.camera);
        
        requestAnimationFrame(self.loop);
    }
}

CLOTHSIM.init();
CLOTHSIM.loop();
