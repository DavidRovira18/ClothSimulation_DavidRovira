class Particle{
    constructor(mass, pos)
    {
        if (! (pos instanceof THREE.Vector2))
            console.error("Position is not a Vector 2")

    }
}

class ParticleSystem{
    constructor()
    {
        this.particles = [];
    }

    update()
    {
        for (var particle in this.particles){
            //Advance by time step
            //Add force to each particle
            //Acceleration of the sum force
            //Use solver to find the next position
            //Redraw the particle position
        }
    }
}
