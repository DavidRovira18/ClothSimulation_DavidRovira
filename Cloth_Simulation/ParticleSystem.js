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
            
        }
    }
}
