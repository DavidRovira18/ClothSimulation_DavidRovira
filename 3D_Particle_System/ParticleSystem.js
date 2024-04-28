//3D particle system implementation
import { Vector3, SphereGeometry, MeshBasicMaterial, Mesh, Sphere } from "three";
import { EulerIntegrator, SemiImplicitEulerIntegrator } from './integrators.js';

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

export class ParticleSystem{
    constructor(scene)
    {
        this.particles = [];
        this.forces = [];
        this.time = null; //NOSE PERQUE ENCARA

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

