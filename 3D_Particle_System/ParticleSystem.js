//3D particle system implementation
import { Vector3, SphereGeometry, MeshBasicMaterial, Mesh } from "three";
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
            //Clear acting forces 
            particle.clearForce();

            //Apply gravity force
            particle.applyForce(new Vector3(0, 9.81 * particle.mass, 0));
 
            //Euler integrator
            SemiImplicitEulerIntegrator(particle, dt);
        })
    }
}

