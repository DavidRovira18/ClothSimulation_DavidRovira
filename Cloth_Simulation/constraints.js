import { Vector3 } from "three";

export function solveDistanceConstraint(particle1, particle2, r, compliance, dt) {
    const alpha = compliance / (dt * dt);

    const totalWeight = particle1.w + particle2.w;
  
    // Init Gradient Vector
    const grad = new Vector3().subVectors(particle1.pos, particle2.pos);
  
    // Lenght of grad vector (distance between particles)
    const length = grad.length();
  
    // Obtain the direction of the gradient
    grad.divideScalar(length);
  
    // Constraint current value
    const C = length - r;
  
    // Compute Lagrangian Multiplier
    const lagrangianMultiplier = -C / (totalWeight + alpha);
  
    // Update position
    const deltaX1 = grad.clone().multiplyScalar(lagrangianMultiplier * particle1.w);
    particle1.pos.add(deltaX1);
  
    const deltaX2 = grad.clone().multiplyScalar(-lagrangianMultiplier * particle2.w);
    particle2.pos.add(deltaX2);
}