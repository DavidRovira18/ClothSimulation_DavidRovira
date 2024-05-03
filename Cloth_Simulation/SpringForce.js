import { Vector3 } from "three";

export class SpringForce{
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
        this.p2.applyForce(f.clone().negate());
    }

    calculateForce()
    {
        const l = new Vector3().copy(this.p1.pos).sub(this.p2.pos); // Vector from p2 to p1

        const distance = this.p1.pos.distanceTo(this.p2.pos);

        const i = new Vector3().copy(this.p1.vel).sub(this.p2.vel); // Derivative of l (particle velocity 1 - particle velocity 2)

        const springMagnitude = this.ks * (distance - this.r); // Spring force magnitude

        const idotl = i.dot(l);
        const dampingMagnitude = this.kd * (idotl / distance); // Damping force magnitude

        const direction = l.clone().normalize();
        return direction.multiplyScalar(-springMagnitude - dampingMagnitude); // Final force vector
    }
}