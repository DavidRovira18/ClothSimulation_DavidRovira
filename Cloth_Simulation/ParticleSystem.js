//3D particle system implementation
import { Vector3, Quaternion, SphereGeometry, CylinderGeometry, MeshBasicMaterial, Mesh, Sphere } from "three";
import { EulerIntegrator, SemiImplicitEulerIntegrator } from '../3D_Particle_System/integrators.js';
import { SpringForce } from "../3D_Particle_System/SpringForce.js";
import { solveDistanceConstraint } from "./constraints.js";

export class Particle{
    constructor(id, mass, pos, scene)
    {
        if (! (pos instanceof Vector3))
            console.error("Position is not a Vector3")

        this.id = id;
        this.mass = mass;
        this.pos = pos;
        this.vel = new Vector3(0,0,0);
        this.f = new Vector3(0,0,0);

        this.w = 1/this.mass; //Inverse mass

        this.prevPos = new Vector3();

        this.geometry = new SphereGeometry(1, 32, 32);
        this.material = new MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new Mesh(this.geometry, this.material);
        scene.add(this.mesh);

        this.mesh.position.copy(this.pos)

        this.BB = new Sphere(this.pos, 1); //BoundingSphere for collisions
        this.grounded = false;
    }

    applyForce(force)
    {
        if (!(force instanceof Vector3))
            console.error("Force is not a Vector3");
        
        this.f.add(force);
    }

    clearForce()
    {
        this.f.fromArray([0,0,0]);
    }

    update(dt)
    {
        if (this.grounded) return;

        //Clear acting forces 
        this.clearForce();

        //Apply gravity force
        this.applyForce(new Vector3(0, -9.81 * this.mass, 0));

        //Euler integrator
        SemiImplicitEulerIntegrator(this, dt);

        //Update mesh and BoundingBox position
        this.mesh.position.copy(this.pos);
        this.BB.center.copy(this.pos);
    }
}

export class Link{
    constructor(particle1, particle2, scene)
    {
        this.particle1 = particle1;
        this.particle2 = particle2;

        this.r = particle1.pos.distanceTo(particle2.pos); //Resting length

        //Spring mesh
        const springGeometry = new CylinderGeometry(0.05, 0.05, this.r, 8);
        const springMaterial = new MeshBasicMaterial({ color: 0x00ff00 });
        this.springMesh = new Mesh(springGeometry, springMaterial);

        // Compute position
        const midpoint = new Vector3().copy(this.particle1.pos).add(this.particle2.pos).multiplyScalar(0.5);
        this.springMesh.position.copy(midpoint);

        // Compute rotation for the cylinder to align with the line between particles
        const direction = new Vector3().copy(particle2.pos).sub(particle1.pos).normalize();
        const up = new Vector3(0, 1, 0); // Assuming the cylinder is initially oriented along the y-axis
        const quaternion = new Quaternion().setFromUnitVectors(up, direction);
        this.springMesh.quaternion.copy(quaternion);

        scene.add(this.springMesh);
    }

    update(dt, substeps)
    {
        var ts = dt/substeps;

        for(let i = 0; i < substeps; ++i)
        {
            //PBD Simple Loop (Distance Constraint Only, Simulating a Mass Spring System)
            this.particle1.clearForce();
            this.particle2.clearForce();

            // Add gravity force
            var gravityForce = new Vector3(0, -9.8, 0);
            this.particle1.applyForce(gravityForce);
            this.particle2.applyForce(gravityForce);

            // Store previous position of particles (update this after computing new positions)
            var prevPos1 = this.particle1.pos.clone();
            var prevPos2 = this.particle2.pos.clone();

            // Compute predicted position of particles
            SemiImplicitEulerIntegrator(this.particle1, ts);
            SemiImplicitEulerIntegrator(this.particle2, ts);

            // // Apply Distance Constraint C(x1,x2) = |x2-x1| - r. In cloth simulation distance constraint can be seen as stretching the cloth
            // var currentLength = this.particle1.pos.distanceTo(this.particle2.pos);
            // var posSubs = this.particle2.pos.clone().sub(this.particle1.pos);
            // posSubs.divideScalar(currentLength);
            // var totalWeight = this.particle1.w + this.particle2.w;

            // if(currentLength == 0)
            //     return;
            
            // // Correct positions based on the constraint
            // if (this.particle1.w != 0) {
            //     var deltaX1 = posSubs.clone().multiplyScalar((currentLength - this.r) * (this.particle1.w / totalWeight));
            //     this.particle1.pos.add(deltaX1);
            // }

            // if (this.particle2.w != 0) {
            //     var deltaX2 = posSubs.clone().multiplyScalar((currentLength - this.r) * (-this.particle2.w / totalWeight));
            //     this.particle2.pos.add(deltaX2);
            // }

            // // Update velocities based on the corrected positions
            // this.particle1.vel.copy(this.particle1.pos).sub(prevPos1).divideScalar(ts);
            // this.particle2.vel.copy(this.particle2.pos).sub(prevPos2).divideScalar(ts);

            // //CLAMP VEL NOSE
            // // var minVel = new Vector3(-50,-50,-50);
            // // var maxVel = new Vector3(20,20,20);

            // // this.particle1.vel.clamp(minVel, maxVel);
            // // this.particle2.vel.clamp(minVel, maxVel);

            solveDistanceConstraint(this.particle1, this.particle2, this.r, 0.01, ts); 

            console.log("Particle " + this.particle1.id + " position: " + this.particle1.pos.x + ", " + this.particle1.pos.y + ", " + this.particle1.pos.z);
            console.log("Particle " + this.particle2.id + " position: " + this.particle2.pos.x + ", " + this.particle2.pos.y + ", " + this.particle2.pos.z);
        }

        this.particle1.mesh.position.copy(this.particle1.pos);
        this.particle2.mesh.position.copy(this.particle2.pos);

        this.updateLinkMesh();

    }

    updateLinkMesh() {
        // Compute position
        const midpoint = new Vector3().copy(this.particle1.pos).add(this.particle2.pos).multiplyScalar(0.5);
        this.springMesh.position.copy(midpoint);

        // Compute rotation
        const direction = new Vector3().copy(this.particle2.pos).sub(this.particle1.pos).normalize();
        const up = new Vector3(0, 1, 0); // Assuming the cylinder is initially oriented along the y-axis
        const quaternion = new Quaternion().setFromUnitVectors(up, direction);
        this.springMesh.quaternion.copy(quaternion);
    }
}

export class ParticleSystem{
    constructor(scene)
    {
        this.particles = [];
        this.forces = [];
        this.idCount = 0;

        this.scene = scene;
    }

    createParticle(mass, pos)
    {
        this.particles.push(new Particle(this.idCount, mass, pos, this.scene));
        this.idCount++
    }

    addParticle(particle)
    {
        this.particles.push(particle);
    }

    addForce(f)
    {
        if (!(f instanceof Vector3))    
            console.error("Force is not a Vector3");

        this.forces.push(f);
    }

    update(dt)
    {
        this.particles.forEach((particle) => {
            particle.update(dt);
        })
    }

    getParticleFromPos(pos)
    {
        return this.particles.find(particle => particle.pos.equals(pos));
    }
}

export class LinksSystem extends ParticleSystem{
    constructor(scene)
    {
        super(scene)
        this.links = [];
        this.idLinks = [];
        this.scene = scene;
    }

    addLink(particle1, particle2) //Create spring between particles
    {
        // prevent repeated links
        if (this.idLinks.find((el) => {if (el[0] == particle1.id && el[1] == particle2.id) return true;}) || this.idLinks.find((el) => {if (el[0] == particle2.id && el[1] == particle1.id) return true;}))
            return;

        this.idLinks.push([particle1.id, particle2.id]);
        this.links.push(new Link(particle1, particle2, this.scene));
    }

    update(dt, substeps) {
        // Update particle system
        // super.update(dt);

        // Update springs
        this.links.forEach((link) => {
            link.update(dt, substeps);
        });
    }
}

