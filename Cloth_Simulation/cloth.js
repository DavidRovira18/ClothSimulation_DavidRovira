import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { Particle, ParticleSystem, LinksSystem } from './ParticleSystem.js';
import { BoxBody, SphereBody } from './RigidBody.js';

(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='https://mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

class CLOTHSIM {
    constructor() {
        // scene attributes
        this.scene = null;
        this.renderer = null;
        this.clothMass = 1;
        this.dt = 1/60;
        this.collidableVisible = false;
        this.simulationRunning = false;

        //Simulation Parameters Interactivity
        this.gravityForce = -9.8;
        this.applyWind = true;
        this.windForce = 1;
        this.windDirection = new THREE.Vector3(1,0,0);

        this.stiffness = 0.001;
        this.substeps = 3; 
        this.mode = 'BC'; // 'DC' Apply only Distance Constraint 'BC' Apply Bending Constraint and Distance Constraint
    }   
    
    init() {
        //Set up scene
        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        //Add ambiental light
        this.ambient_light = new THREE.AmbientLight(0x404040); // soft white light
        this.scene.add(this.ambient_light);

        //Set up camera and controls
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0,30,50);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enableZooming = true;
        this.controls.dampingFactor = 0.25;

        //Init Particle System
        this.particleSystem = new LinksSystem(this.scene);

        //OBJ Loader
        this.loader = new OBJLoader();
        this.loader.setPath('./models/');
        this.loader.load(
            'female.obj',
            (object) => {
                if (object.children[0] instanceof THREE.Mesh)
                    object.children[0].material.side = THREE.DoubleSide;
                this.scene.add( object );
            },
            // called when loading is in progress
            ( xhr ) => {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            // called when loading has errors
            ( error ) => {
                console.error('An error occurred while loading the OBJ file:', error);
            }

        )
        this.loader.load(
            // resource URL
            'cape.obj',
            // called when resource is loaded
            ( object ) => {
                if (object.children[0] instanceof THREE.Mesh)
                    object.children[0].material.side = THREE.DoubleSide;

                object.position.set(0,91,-22);
                object.updateMatrixWorld();
                
                this.scene.add( object );

                this.geometry = object.children[0].geometry;

                const position = this.geometry.attributes.position;

                const vertices = [];
                const numVertices = position.count;

                for (let i = 0; i < numVertices; ++i) {
                    const vertex = new THREE.Vector3().fromBufferAttribute(position, i); // Get vertex position

                    vertex.applyMatrix4(object.matrixWorld);

                    vertices.push(vertex);
                }

                // Define neighborhood radius for links
                const neighborhoodRadiusDistanceConstraint = 2;
                const neighborhoodRadiusBendingConstraint = 3;

                // Create spheres representing neighborhoods around each vertex
                const spheresDistanceConstraint = [];
                const spheresBendingConstraint = [];

                //Create particle in each vertex
                for (let i = 0; i < numVertices; ++i)
                {
                    const vertex = vertices[i];
                    var particle = this.particleSystem.getParticleFromPos(vertex);

                    // If no particle in position, create particle and add it to particleSystem
                    if (!particle) 
                    {
                        this.particleSystem.createParticle(this.clothMass, vertex, i);

                        const sphereDistanceConstraint = new THREE.Sphere(vertex, neighborhoodRadiusDistanceConstraint);
                        const sphereBendingConstraint = new THREE.Sphere(vertex, neighborhoodRadiusBendingConstraint);
                        spheresDistanceConstraint.push(sphereDistanceConstraint);
                        spheresBendingConstraint.push(sphereBendingConstraint);
                    }

                }

                this.createLinks(spheresDistanceConstraint, spheresBendingConstraint)                 

                this.loop();
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

        
       this.addRigidBodies();

       this.addGUI();

        // Variables for user interaction
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();

        // Event listener for mouse clicks
        window.addEventListener('click', this.onMouseClick.bind(this));

        //Delta time computation
        this.currentTime = performance.now();

        this.paused_text = document.getElementById("paused");
        this.running_text = document.getElementById("running");
        this.toggle_simulation_btn = document.getElementsByClassName("toggle_simulation")[0];
        this.toggle_simulation_btn.addEventListener("click", () => {
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
        });

        this.mode_switch = document.getElementById('mode_switch');
        this.mode_switch.addEventListener('change', (event) => {
            this.mode = event.target.checked ? 'BC' : 'DC';
            console.log(mode)
            if (!this.simulationRunning)
                return;
                
            this.particleSystem.linksDistanceConstraint.forEach((link) => {
                link.update();
            })

            this.particleSystem.linksBendingConstraint.forEach((link) => {
                link.update();
            })
        })
    }

    loop()
    {
        this.controls.update();

        var newTime = performance.now();
        var frameTime = (newTime - this.currentTime) / 1000;
        if (frameTime > 1) frameTime = 1;
        this.currentTime = newTime;
        if(this.simulationRunning)
        {
            while(frameTime > 0.0)
            {
                var deltaTime = Math.min(frameTime, this.dt);
                this.particleSystem.update(deltaTime, this.substeps, this.stiffness, this.mode, this.gravityForce, this.applyWind, this.windForce, this.windDirection);
                frameTime -= deltaTime;
            }

            // this.updateVerticesFromParticles(this.geometry, this.particleSystem.particles);

        }
        this.renderer.render(this.scene, this.camera);
        
        requestAnimationFrame(this.loop.bind(this));
    }

    createLinks(spheresDistanceConstraint, spheresBendingConstraint)
    {
        //Create links between neighbor particles (Distance Constraint)
        for (let i = 0; i < this.particleSystem.particles.length; ++i)
            for (let j = 0; j < spheresDistanceConstraint.length; ++j)
            {
                var particle = this.particleSystem.particles[i];
                var sphere = spheresDistanceConstraint[j];

                if(sphere.center.equals(particle.pos))
                    continue;

                if(sphere.containsPoint(particle.pos))
                    this.particleSystem.addLinkDistanceConstraint(particle, this.particleSystem.particles[j], this.mode);
            }  

        //Create links between neighbor particles (Distance Constraint + Bending Constraint)
        for (let i = 0; i < this.particleSystem.particles.length; ++i)
            for (let j = 0; j < spheresBendingConstraint.length; ++j)
            {
                var particle = this.particleSystem.particles[i];
                var sphere = spheresBendingConstraint[j];

                if(sphere.center.equals(particle.pos))
                    continue;

                if(sphere.containsPoint(particle.pos))
                    this.particleSystem.addLinkBendingConstraint(particle, this.particleSystem.particles[j], this.mode);

            } 
    }

    updateVerticesFromParticles(geometry, particles)
    {
        const position = geometry.attributes.position;

            particles.forEach(particle => {
                const index = particle.vertexIndex;

                if(!index) return;

                position.setXYZ(index, particle.pos.x, particle.pos.y, particle.pos.z);
            });

            position.needsUpdate = true;
    }

    addRigidBodies()
    {
        const rigidBodies = [
            new SphereBody(new THREE.Vector3(0, 50, 0), 10, this.scene, this.collidableVisible),
            new SphereBody(new THREE.Vector3(0, 60, 0), 10, this.scene, this.collidableVisible),
            new SphereBody(new THREE.Vector3(0, 70, 0), 10, this.scene, this.collidableVisible),
            new SphereBody(new THREE.Vector3(0, 80, 0), 10, this.scene, this.collidableVisible),
            new SphereBody(new THREE.Vector3(0, 90, 2.5), 10, this.scene, this.collidableVisible),
            new SphereBody(new THREE.Vector3(5, 90, 2.5), 10, this.scene, this.collidableVisible),
            new SphereBody(new THREE.Vector3(-5, 90, 2.5), 10, this.scene, this.collidableVisible),
            new SphereBody(new THREE.Vector3(5, 85, -2.5), 7.5, this.scene, this.collidableVisible),
            new SphereBody(new THREE.Vector3(-5, 85, -2.5), 7.5, this.scene, this.collidableVisible),
        ];

        rigidBodies.forEach(rigidBody => this.particleSystem.addRigidBody(rigidBody))
    }

    addGUI()
    {
        const gui = new GUI();

        //External Forces GUI
        const externalForcesObject = {
            gravityForce: this.gravityForce,
            applyWind: this.applyWind,
            windForce: this.windForce,
            windDirection: this.windDirection
        };
    
        const externalForces = gui.addFolder('External Forces')

        externalForces.add(externalForcesObject, 'gravityForce', -30, 0, 0.5).onChange(() => {
            this.gravityForce = externalForcesObject.gravityForce;
        })

        externalForces.add(externalForcesObject, 'applyWind').onChange(() => {
            this.applyWind = externalForcesObject.applyWind;
        })

        externalForces.add(externalForcesObject, 'windForce', 0, 20, 0.5).onChange(() => {
            this.windForce = externalForcesObject.windForce;
        })

        const windDirectionFolder = externalForces.addFolder('Wind Direction');
        
        
        windDirectionFolder.add(externalForcesObject.windDirection, 'x', -1, 1, 0.1).onChange(() => {
            this.windDirection.x = externalForcesObject.windDirection.x;
        });
        windDirectionFolder.add(externalForcesObject.windDirection, 'y',-1, 1, 0.1).onChange(() => {
            this.windDirection.y = externalForcesObject.windDirection.y;
        });;
        windDirectionFolder.add(externalForcesObject.windDirection, 'z',-1, 1, 0.1).onChange(() => {
            this.windDirection.z = externalForcesObject.windDirection.z;
        });;

        //Simulations Parameters GUI
        const simulationParametersObject = {
            substeps: this.substeps,
            stiffness: 1
        }

        const simulationParametersFolder = gui.addFolder('Simulation Parameters');
        simulationParametersFolder.add(simulationParametersObject, 'substeps', 1, 10, 1).onChange(() => {
            this.substeps = simulationParametersObject.substeps;
        })

        simulationParametersFolder.add(simulationParametersObject, 'stiffness', 1, 10, 1).onChange(() => {
            this.stifness = simulationParametersObject.stiffness * 0.01;
        })
    }

    onMouseClick(event)
    {
        if(this.simulationRunning) return;
        
        event.preventDefault();

        const rect = this.renderer.domElement.getBoundingClientRect();

        //Normalize mouse coordinates
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersections = this.raycaster.intersectObjects(this.particleSystem.particles.map(particle => particle.mesh));

        if (intersections.length > 0) {
            const intersectedParticle = intersections[0].object;

            this.particleSystem.particles.forEach((particle) => {
                if(particle.pos.equals(intersectedParticle.position))
                    {
                        if(particle.attached)
                        {
                            particle.mass = particle.initMass;
                            particle.w = 1/particle.mass;
                            intersectedParticle.material.color.set(0xFF0000);
                        }
                        else
                        {
                            particle.mass = Infinity
                            particle.w = 1/particle.mass;
                            // Change color to white to know which particles are attached
                            intersectedParticle.material.color.set(0xFFFFFF);
                            particle.attached = true;
                        }
                    }
            })
        }
    }
}

let app = new CLOTHSIM();
app.init();
