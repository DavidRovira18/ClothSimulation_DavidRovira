class SpringForce{
    constructor(p1, p2, ks, kd, r)
    {
        this.p1 = p1;
        this.p2 = p2;
        this.ks = ks; //Spring coefficient
        this.kd = kd; //Damping coefficient
        this.r = r; //Spring resting length
    }

    applyForce()
    {
        const f = this.calculateForce();
        this.p1.applyForce(f);
        this.p2.applyForce(f.scale(-1));
    }

    calculateForce()
    {
        const l = p1.pos.clone().sub(p2.pos); //Vector from p2 to p1

        const distance = p1.pos.distance(p2.pos);

        const i = p1.vel.clone().sub(p2.vel); //Derivative of l (particle velocity 1 - particle velocity 2)

        const springMagnitude = this.ks * (distance - this.r); //Spring force magnitude

        const idotl = i.dot(l);
        const dampingMagnitude = this.kd * (idotl / distance); //Damping force magnitude

        const direction = l.clone().normalize();
        return direction.scale(-springMagnitude - dampingMagnitude); //Final force vector
    }
}