//3D particle system implementation
import { Vector3, Quaternion, SphereGeometry, CylinderGeometry, MeshBasicMaterial, Mesh, Sphere } from "three";
import { EulerIntegrator, SemiImplicitEulerIntegrator } from './integrators.js';
import { SpringForce } from "./SpringForce.js";

export class Particle{
    constructor(mass, pos, scene)
    {
        if (! (pos instanceof Vector3))
            console.error("Position is not a Vector3")

        this.mass = mass;
        this.pos = pos;
        this.vel = new Vector3(0,0,0);
        this.f = new Vector3(0,0,0);

        this.geometry = new SphereGeometry(1, 32, 32);
        this.material = new MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new Mesh(this.geometry, this.material);
        scene.add(this.mesh);

        this.mesh.translateOnAxis(pos, 1);

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

export class Spring{
    constructor(particle1, particle2, stifness, damping, scene)
    {
        this.particle1 = particle1;
        this.particle2 = particle2;
        this.ks = stifness;
        this.kd = damping;

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

        //Init Spring Force
        this.springForce = new SpringForce(this.particle1, this.particle2, this.ks, this.kd, this.r);
    }

    update(dt)
    {
        this.particle2.clearForce();
        this.particle2.applyForce(new Vector3(0, -9.81 * this.particle2.mass, 0));

        this.springForce.applyForce();

        SemiImplicitEulerIntegrator(this.particle1, dt);
        SemiImplicitEulerIntegrator(this.particle2, dt);

        this.particle1.mesh.position.copy(this.particle1.pos);
        this.particle2.mesh.position.copy(this.particle2.pos);

        this.updateSpringMesh();
    }

    updateSpringMesh() {
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

        this.scene = scene;
    }

    addParticle(mass, pos)
    {
        this.particles.push(new Particle(mass, pos, this.scene));
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
}

export class SpringMassSystem extends ParticleSystem{
    constructor(scene)
    {
        super(scene)
        this.springs = [];
        this.scene = scene;
    }

    addSpring(particle1, particle2, stifness, damping) //Create spring between particles
    {
        this.springs.push(new Spring(particle1, particle2, stifness, damping, this.scene));
    }

    update(dt) {
        // Update particle system
        // super.update(dt);

        // Update springs
        this.springs.forEach((spring) => {
            spring.update(dt);
        });
    }
}

