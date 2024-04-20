//2D particle system implementation
class Particle{
    constructor(mass, pos)
    {
        if (! (pos instanceof vec2))
            console.error("Position is not a vec2")

        this.mass = mass;
        this.pos = pos;
        this.vel = new vec2(0,0);
        this.f = new vec2(0,0);
    }

    applyForce(force)
    {
        if (!(force instanceof vec2))
            console.error("Force is not a vec2");
        
        this.f.add(force);
    }

    clearForce()
    {
        this.f.fromArray([0,0]);
    }

    render(ctx)
    {
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 10, 0, 2 * Math.PI);
        ctx.fill();
    }
}

class ParticleSystem{
    constructor()
    {
        this.particles = [];
        this.forces = [];
        this.time = null; //NOSE PERQUE ENCARA
    }

    addParticle(mass, pos)
    {
        this.particles.push(new Particle(mass, pos));
    }

    addForce(f)
    {
        if (!(f instanceof vec2))
            console.error("Force is not a vec2");

        this.forces.push(f);
    }

    render(ctx)
    {
        this.particles.forEach((particle) => particle.render(ctx));
    }

    update(dt)
    {
        this.particles.forEach((particle) => {
            //Clear acting forces 
            particle.clearForce();

            //Apply gravity force
            particle.applyForce(new vec2(0, 9.81 * particle.mass));
 
            //Euler integrator
            SemiImplicitEulerIntegrator(particle, dt);
        })
    }
}
