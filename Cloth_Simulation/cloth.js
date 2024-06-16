import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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
        this.simulationRunning = false;

        this.loaderGLB = new GLTFLoader();

        //Simulation Parameters Interactivity
        this.gravityForce = -9.8;
        this.applyWind = true;
        this.windForce = 1;
        this.windDirection = new THREE.Vector3(1,0,0);

        this.stiffness = 0.001;
        this.substeps = 3; 
        this.mode = 'BC'; // 'DC' Apply only Distance Constraint 'BC' Apply Bending Constraint and Distance Constraint

        this.renderHelpers = true;
    }   
    
    init() {
        //Set up scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x2c2c2c );
        this.scene.add( new THREE.GridHelper(10, 10) );

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Set up lights
        let hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.25 );
        this.scene.add(hemiLight);

        let spotLight = new THREE.SpotLight( 0xffffff, 10);
        spotLight.position.set( 0.5, 2, 2 );
        spotLight.target.position.set( 0, 1, 0 );
        this.scene.add( spotLight.target );
        this.scene.add( spotLight );

        //Set up camera and controls
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100);
        this.camera.position.set(0.5,1.5,-1);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enableZooming = true;
        this.controls.dampingFactor = 0.25;
        this.controls.target = new THREE.Vector3( 0, 1, 0 );
        this.controls.update();

        //Init Particle System
        this.particleSystem = new LinksSystem(this.scene);

        //AVATAR Loader
        this.loaderGLB.load("https://webglstudio.org/3Dcharacters/Eva_Low/Eva_Low.glb", (gltf) => {
            let model = gltf.scene;
            model.name = "Eva";
            model.visible = true;
            
            model.traverse( (o) => {
                if (o.isMesh || o.isSkinnedMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                    o.frustumCulled = false;
                    if ( o.skeleton ) { 
                        this.skeleton = o.skeleton;
                    }
                    if (o.name == "Body")
                            o.name == "BodyMesh";
                    o.material.side = THREE.FrontSide;
                }
            } );

            this.scene.add( model );
        });

        //OBJ Loader
        this.loader = new OBJLoader();
        this.loader.setPath('./models/');
        this.loader.load(
            // resource URL
            'cape_small_morevertices.obj',
            // called when resource is loaded
            ( object ) => {
                if (object.children[0] instanceof THREE.Mesh)
                    object.children[0].material.side = THREE.DoubleSide;

                object.position.set(0,1.40,-0.32);
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
                const neighborhoodRadiusDistanceConstraint = 0;
                const neighborhoodRadiusBendingConstraint = 0.02;

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

        //Event listener for window resize
        window.addEventListener('resize', this.onWindowResize.bind(this), false);

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

        setInterval(() => {document.getElementById("fps").innerHTML = (1.0/this.frameTime).toFixed(2) + " fps";}, 100);

    }

    loop()
    {
        this.controls.update();

        var newTime = performance.now();
        var frameTime = this.frameTime = (newTime - this.currentTime) / 1000;
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
        const objectgroup = this.particleSystem.objectgroup;
        const rigidBodies = [
            new SphereBody(new THREE.Vector3(0, 1, 0), 0.15, objectgroup),
            new SphereBody(new THREE.Vector3(0, 1.1, 0), 0.15, objectgroup),
            new SphereBody(new THREE.Vector3(0, 1.2, 0), 0.15, objectgroup),
            new SphereBody(new THREE.Vector3(0, 1.3, 0), 0.15, objectgroup),
            new SphereBody(new THREE.Vector3(0.12, 1.3, 0), 0.15, objectgroup),
            new SphereBody(new THREE.Vector3(-0.12, 1.3, 0), 0.15, objectgroup),
            new SphereBody(new THREE.Vector3(0.1, 0.85, 0), 0.15, objectgroup),
            new SphereBody(new THREE.Vector3(-0.1, 0.85, 0), 0.15, objectgroup),
        ];

        rigidBodies.forEach(rigidBody => this.particleSystem.addRigidBody(rigidBody));
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
            stiffness: this.stiffness,
            activeConstraint: this.mode
        }

        const simulationParametersFolder = gui.addFolder('Simulation Parameters');
        simulationParametersFolder.add(simulationParametersObject, 'substeps', 1, 10, 1).onChange(() => {
            this.substeps = simulationParametersObject.substeps;
        })

        simulationParametersFolder.add(simulationParametersObject, 'stiffness', 0.0001, 0.01).onChange(() => {
            this.stiffness = simulationParametersObject.stiffness;
        })

        simulationParametersFolder.add(simulationParametersObject, 'activeConstraint', {AllConstraints: 'BC', DistanceConstraint: 'DC'} ).onChange(() => {
            this.mode = simulationParametersObject.activeConstraint;
        })

        simulationParametersFolder.add({ resetSimulation: this.resetSimulation.bind(this) }, 'resetSimulation').name('Reset Simulation');

        const renderParametersObject = {
            renderHelpers: this.renderHelpers
        }

        const renderParametersFolder = gui.addFolder('Render Parameters');
        renderParametersFolder.add(renderParametersObject, 'renderHelpers').onChange(() => {
            this.renderHelpers = renderParametersObject.renderHelpers;

            if(this.renderHelpers)
                this.particleSystem.objectgroup.visible = true;

            else
                this.particleSystem.objectgroup.visible = false;
        });
    }

    resetSimulation()
    {
        this.simulationRunning = false;
        this.paused_text.className = "visible";
        this.running_text.className = "hidden";
        this.toggle_simulation_btn.innerHTML = "Play Simulation";

        this.particleSystem.particles.forEach((particle) => {
            particle.resetParticle();
        })

        this.particleSystem.linksBendingConstraint.forEach((link) => {
            link.updateLinkMesh();
        })

        this.particleSystem.linksDistanceConstraint.forEach((link) => {
            link.updateLinkMesh();
        })
    }

    onMouseClick(event)
    {
        if(this.simulationRunning) return;

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

    onWindowResize() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Update camera aspect ratio
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }
}

let app = new CLOTHSIM();
app.init();
