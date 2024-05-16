import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { Particle, ParticleSystem, LinksSystem } from './ParticleSystem.js';


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
        this.particleSystem = new LinksSystem(this.scene);

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
                // const numVertices = position.count;
                const numVertices = 3;
            
                // Define neighborhood radius
                const neighborhoodRadius = 20; // 
            
                // Create spheres representing neighborhoods around each vertex
                const spheres = [];
                for (let i = 0; i < numVertices; ++i) {
                    const vertex = new THREE.Vector3().fromBufferAttribute(position, i); // Get vertex position
                    vertices.push(vertex);
                }

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
                            CLOTHSIM.particleSystem.addLink(particle, CLOTHSIM.particleSystem.particles[j]); //THIS WORKS BUT TJERE ARE REPETED LINKS think how to solve that

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

        // Event listener for mouse clicks
        window.addEventListener('click', this.onMouseClick);

        //Delta time computation
        this.currentTime = performance.now();
        this.dt = 1/60;

        const axesHelper = new THREE.AxesHelper( 50 );  //The X axis is red. The Y axis is green. The Z axis is blue.
        this.scene.add( axesHelper );

        //Interactivity parameters
        this.simulationRunning = false;

        this.paused_text = document.getElementById("paused");
        this.running_text = document.getElementById("running");
        this.toggle_simulation_btn = document.getElementsByClassName("toggle_simulation")[0];
        this.toggle_simulation_btn.addEventListener("click", function ()
        {
            this.simulationRunning = this.simulationRunning ? false : true;
            
            if(this.simulationRunning)
            {
                this.paused_text.className = "hidden";
                this.running_text.className = "visible";
                this.toggle_simulation_btn.innerHTML = "Pause Simulation"
            }

            else
            {
                this.paused_text.className = "visible";
                this.running_text.className = "hidden";
                this.toggle_simulation_btn.innerHTML = "Play Simulation"
            }
        }.bind(this))
    },

    loop: function ()
    {
        var self = CLOTHSIM;
        self.controls.update();

        if(self.simulationRunning)
        {
            var newTime = performance.now();
            var frameTime = newTime - self.currentTime;
            self.currentTime = newTime;

            while(frameTime > 0.0)
            {
                var deltaTime = Math.min(frameTime, self.dt);
                self.particleSystem.update(deltaTime);

                frameTime -= deltaTime;
            }
        }

        self.renderer.render(self.scene, self.camera);
        
        requestAnimationFrame(self.loop);
    },

    onMouseClick(event)
    {
        const self = CLOTHSIM;
        
        if(self.simulationRunning) return;
        
        event.preventDefault();

        const rect = self.renderer.domElement.getBoundingClientRect();

        //Normalize mouse coordinates
        self.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        self.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        self.raycaster.setFromCamera(self.mouse, self.camera);

        const intersections = self.raycaster.intersectObjects(self.particleSystem.particles.map(particle => particle.mesh));

        if (intersections.length > 0) {
            const intersectedParticle = intersections[0].object;

            self.particleSystem.particles.forEach((particle) => {
                if(particle.pos.equals(intersectedParticle.position))
                    {
                        particle.mass = Infinity
                        particle.w = 1/particle.mass;
                        // Change color to white to know which particles are attached
                        intersectedParticle.material.color.set(0xFFFFFF);
                    }
            })
        }
    }
}

CLOTHSIM.init();
CLOTHSIM.loop();
