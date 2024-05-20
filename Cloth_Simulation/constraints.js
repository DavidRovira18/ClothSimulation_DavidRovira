import { Vector3 } from "three";

export function solveDistanceConstraint(particle1, particle2, r, compliance, dt) {
    const alpha = compliance / (dt * dt);

    const totalWeight = particle1.w + particle2.w;

    // Compute gradient
    var gradient = particle2.pos.clone().sub(particle1.pos);

    var length = gradient.length();
    gradient.divideScalar(length);

    // Compute Constraint current value
    const C = length - r;

    console.log("Constraint value", C);

    // Lagrangian multiplier
    const lagrangianMultiplier = -C / (totalWeight + alpha);

    // Correct positions of particles
    const deltaX1 = gradient.clone().multiplyScalar(lagrangianMultiplier * particle1.w);
    particle1.pos.add(deltaX1);

    const deltaX2 = gradient.clone().multiplyScalar(-lagrangianMultiplier * particle2.w);
    particle2.pos.add(deltaX2);
}