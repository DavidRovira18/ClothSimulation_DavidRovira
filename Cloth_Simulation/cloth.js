import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { Particle, ParticleSystem, LinksSystem } from './ParticleSystem.js';
import { BoxBody, CapsuleBody, SphereBody } from './RigidBody.js';

(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='https://mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

class CLOTHSIM {
    constructor() {
        // scene attributes
        this.scene = null;
        this.renderer = null;
        this.clothMass = 1;
        this.dt = 1/60;
        this.substeps = 3; 
        this.collidableVisible = true;
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
            // resource URL
            'cloth_final.obj',
            // called when resource is loaded
            ( object ) => {
                if (object.children[0] instanceof THREE.Mesh)
                    object.children[0].material.side = THREE.DoubleSide;
                this.scene.add( object );

                this.geometry = object.children[0].geometry;
                const position = this.geometry.attributes.position;

                const vertices = [];
                const numVertices = position.count;

                for (let i = 0; i < numVertices; ++i) {
                    const vertex = new THREE.Vector3().fromBufferAttribute(position, i); // Get vertex position
                    vertices.push(vertex);
                }

                // Define neighborhood radius for links
                const neighborhoodRadiusDistanceConstraint = 3;
                const neighborhoodRadiusBendingConstraint = 6;

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
                
                //Create links between neighbor particles (Distance Constraint)
                for (let i = 0; i < this.particleSystem.particles.length; ++i)
                    for (let j = 0; j < spheresDistanceConstraint.length; ++j)
                    {
                        var particle = this.particleSystem.particles[i];
                        var sphere = spheresDistanceConstraint[j];

                        if(sphere.center.equals(particle.pos))
                            continue;

                        if(sphere.containsPoint(particle.pos))
                            this.particleSystem.addLinkDistanceConstraint(particle, this.particleSystem.particles[j]);

                    }  

                //Create links between neighbor particles (Bending Constraint)
                for (let i = 0; i < spheresBendingConstraint.length; ++i)
                {
                    const firstQuadrant = [null, null, null, null];
                    const secondQuadrant = [null, null, null, null];

                    var sphere = spheresBendingConstraint[i];

                    for (let j = 0; j < this.particleSystem.particles.length; ++j)
                    {
                        var particle = this.particleSystem.particles[j];

                        if(sphere.containsPoint(particle.pos))
                        {
                            var quadrant = this.getQuadrant(sphere.center, particle.pos); //Get quadrant to classify particles in first or second quadrant

                            if(sphere.center.equals(particle.pos))
                            {
                                firstQuadrant[1] = particle;
                                secondQuadrant[1] = particle;
                                continue;
                            }

                            if (quadrant)
                            {
                                const referenceVector = new THREE.Vector3(0,0,-1);
                                var dirVector = particle.pos.clone().sub(sphere.center);
                                var angle = referenceVector.angleTo(dirVector).toPrecision(3);

                                if (quadrant == 1)
                                {
                                    
                                    if (angle == 0)
                                        firstQuadrant[0] = particle;

                                    if(angle == 1.57)
                                        firstQuadrant[3] = particle;

                                    else
                                        firstQuadrant[2] = particle;
                                }
                                if (quadrant == 2)
                                {
                                    if (angle == 0)
                                        secondQuadrant[0] = particle;
                                            
                                    if(angle == 1.57)
                                        secondQuadrant[3] = particle;
                                    
                                    else
                                        secondQuadrant[2] = particle;
                                }

                                if (quadrant == -1) 
                                {
                                    firstQuadrant[0] = particle;
                                    secondQuadrant[0] = particle;
                                }
                            } 
                        }
                    }

                    if (!firstQuadrant.includes(null))
                            this.particleSystem.addLinkBendingConstraint(firstQuadrant[0], firstQuadrant[1], firstQuadrant[2], firstQuadrant[3]);
                    
                    if (!secondQuadrant.includes(null))
                            this.particleSystem.addLinkBendingConstraint(secondQuadrant[0], secondQuadrant[1], secondQuadrant[2], secondQuadrant[3])
                        
                }

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

        //Add rigid body sphere for collision
        const rigidBody = new SphereBody(new THREE.Vector3(0, -30   , 0), 15, this.scene, this.collidableVisible);
        this.particleSystem.addRigidBody(rigidBody);

        //Add rigid body box for collision
        // const rigidBody = new BoxBody(new THREE.Vector3(-20, -20, -10), new THREE.Vector3(20, -10, 10), this.scene);
        // this.particleSystem.addRigidBody(rigidBody);

        //Add rigid body capsule for collision
        // const rigidBody = new CapsuleBody(10, 10, new THREE.Vector3(0, -15, 0), this.scene, this.collidableVisible);
        // this.particleSystem.addRigidBody(rigidBody);

        // Variables for user interaction
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();

        // Event listener for mouse clicks
        window.addEventListener('click', this.onMouseClick.bind(this));

        //Delta time computation
        this.currentTime = performance.now();

        //Interactivity parameters
        this.simulationRunning = false;

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
                this.particleSystem.update(deltaTime, this.substeps);
                frameTime -= deltaTime;
            }

            // this.updateVerticesFromParticles(this.geometry, this.particleSystem.particles);
        }
        this.renderer.render(this.scene, this.camera);
        
        requestAnimationFrame(this.loop.bind(this));
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

    getQuadrant(sphereCenter, point) //Determine in which quadrant is a point relative to a sphere center
    {
        const dx = point.x - sphereCenter.x;
        const dz = point.z - sphereCenter.z;

        //Only interested in quadrants where the particle is further away in z-axis respect to the sphere center (to avoid repeated links)
        if(dz <= 0)
        {
            if(dx < 0) 
                return 1; //First quadrant (left one)

            if (dx > 0) 
                return 2; //Second quadrant (right one)

            if(dx == 0)
                return -1 //Front direction
        }
        return;
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
