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
            'cloth_v3.obj',
            // called when resource is loaded
            ( object ) => {
                if (object.children[0] instanceof THREE.Mesh)
                    object.children[0].material.side = THREE.DoubleSide;
                this.scene.add( object );

                const geometry = object.children[0].geometry;
                const position = geometry.attributes.position;

                const vertices = [];
                const numVertices = position.count;

                for (let i = 0; i < numVertices; ++i) {
                    const vertex = new THREE.Vector3().fromBufferAttribute(position, i); //Get vertex position
                    vertices.push(vertex);
                }

                const stiffness = 1;
                const damping = 1;

                // Iterate through vertices in sets of three to create springs between neighboring vertices
                for (let i = 0; i < numVertices; i += 3) {
                    // Get the positions of the vertices forming the face
                    const position1 = vertices[i].clone().applyMatrix4(object.children[0].matrixWorld);
                    const position2 = vertices[i + 1].clone().applyMatrix4(object.children[0].matrixWorld);
                    const position3 = vertices[i + 2].clone().applyMatrix4(object.children[0].matrixWorld);
                    
                    //Get particle in each position
                    var particle1 = CLOTHSIM.particleSystem.getParticleFromPos(position1);
                    var particle2 = CLOTHSIM.particleSystem.getParticleFromPos(position2);
                    var particle3 = CLOTHSIM.particleSystem.getParticleFromPos(position3);

                    // If no particle in position create particle and add it to particleSystem
                    if (!particle1) {
                        particle1 = new Particle(1, position1, this.scene);
                        CLOTHSIM.particleSystem.addParticle(particle1);
                    }
                    if (!particle2) {
                        particle2 = new Particle(1, position2, this.scene);
                        CLOTHSIM.particleSystem.addParticle(particle2);
                    }
                    if (!particle3) {
                        particle3 = new Particle(1, position3, this.scene);
                        CLOTHSIM.particleSystem.addParticle(particle3);
                    }

                    // Create springs between each pair of neighboring vertices in the face
                    CLOTHSIM.particleSystem.addSpring(particle1, particle2, stiffness, damping);
                    CLOTHSIM.particleSystem.addSpring(particle2, particle3, stiffness, damping);
                    CLOTHSIM.particleSystem.addSpring(particle3, particle1, stiffness, damping);
                }

                console.log(CLOTHSIM.particleSystem.particles.length)
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
    },

    loop: function ()
    {
        var self = CLOTHSIM;
        self.controls.update();

        self.renderer.render(self.scene, self.camera);
        
        requestAnimationFrame(self.loop);
    }
}

CLOTHSIM.init();
CLOTHSIM.loop();
