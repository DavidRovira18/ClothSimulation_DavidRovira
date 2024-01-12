import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import * as CANNON from './node_modules/cannon-es/dist/cannon-es.js';

//Set up scene
const scene = new THREE.Scene();
console.log(scene);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//Set up physics world
const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.81, 0)
});
const timeStep = 1/60;

//Set up camera and controls
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10;
const controls = new OrbitControls( camera, renderer.domElement );
controls.enableDamping = true;
controls.dampingFactor = 0.25;

//Set up particles
const Nx = 20;
const Ny = 20;
const mass = 1;
const cloth_size = 1;
const dist = cloth_size / Nx; //Distance between each pair of particles

const shape = new CANNON.Particle(); //Instance to Cannon particle class
const particles = [];
const particles_mesh = []; //Mesh of particles (to visualize particles DEBUG purposes)

//Create cloth mesh
const cloth_geometry = new THREE.PlaneGeometry(10,10,Nx,Ny);
const cloth_mat = new THREE.MeshBasicMaterial({ color: 0x9b9b9b, side: THREE.DoubleSide, wireframe: true });
const cloth = new THREE.Mesh(cloth_geometry, cloth_mat);


scene.add(cloth)

//Create Cannon bodies for each particle in a grid
for(let i = 0; i < Nx + 1; ++i) {
    particles.push([]);
    particles_mesh.push([]);
    for(let j = 0; j < Ny + 1; ++j) {
        var particle_position = new THREE.Vector3((i - Nx * 0.5) * dist, (j - Ny * 0.5) * dist, 0);
        const particle = new CANNON.Body({
            mass: j === Ny ? 0 : mass, //Set the first row mass to 0 as it was attached to somewhere
            shape,
            position: particle_position,
            velocity: new THREE.Vector3(0, 0, 0.5)
        });
        particles[i].push(particle);
        world.addBody(particle);

        const particleMesh = new THREE.Mesh(new THREE.SphereGeometry(0.01), new THREE.MeshBasicMaterial({ color: 0x9b9b9b }));
        particleMesh.position.copy(particle_position);
        scene.add(particleMesh);
        particles_mesh[i].push(particleMesh);
    }
}

//Connect particles with Distance Constraint (between neighboring particles) to form a cloth
function connect(i1,j1,i2,j2){
    world.addConstraint(new CANNON.DistanceConstraint(particles[i1][j1],
        particles[i2][j2],
        dist));
}

for(let i = 0; i < Nx + 1; ++i) {
    for(let j = 0; j < Ny + 1; ++j) {
        if(i < Nx)
            connect(i, j, i+1, j)
        if(j < Ny)
            connect(i, j, i, j+1)
    }
}

//Updating the particle position 
function updateParticles(){
    for(let i = 0; i < Nx + 1; ++i){
        for(let j = 0; j < Ny + 1; ++j){
            var index = j * (Nx + 1) + i; //index of which triplet of coordinates we are going to update for example i = 0 j = 0 -> index = 0 1st vertex of the 1st column

            var position_attribute = cloth_geometry.attributes.position; //Returns the x,y,z position of the vertex
            var position = particles[i][Ny-j].position; //Position of the cannon particle

            position_attribute.setXYZ(index, position.x, position.y, position.z); //Set position to match the cannon particle position
            position_attribute.needsUpdate = true; //Crucial when we want to change coordinates of a geometry 

            var particle = particles_mesh[i][Ny-j]; //Get particle mesh to update the position
            particle.position.copy(position);
            particle.position.needsUpdate = true;
        }
    }
}
function loop(){
    updateParticles();
    world.step(timeStep);
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
}

loop();

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
