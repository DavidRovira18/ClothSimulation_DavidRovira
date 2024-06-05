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

export function solveBendingConstraint(particle1, particle2, particle3, particle4, r, compliance, dt)
{
    const alpha = compliance / (dt * dt);
    const particles = [particle1, particle2, particle3, particle4];

    const x0 = particles[0].pos;
    const x1 = particles[1].pos;
    const x2 = particles[2].pos;
    const x3 = particles[3].pos;

    const e0 = x1.clone().sub(x0);
    const e1 = x2.clone().sub(x1);
    const e2 = x0.clone().sub(x2);
    const e3 = x3.clone().sub(x0);
    const e4 = x1.clone().sub(x3);

    const cot01 = cotTheta(e0, e1.multiplyScalar(-1));
    const cot02 = cotTheta(e0, e2.multiplyScalar(-1));
    const cot03 = cotTheta(e0, e3);
    const cot04 = cotTheta(e0, e4);

    const K = [
        [cot01 + cot04],
        [cot02 + cot03],
        [-cot01 - cot02],
        [-cot03 - cot04],
    ];

  const A0 = 0.5 * vecNorm(vecCross(e0, e1));
  const A1 = 0.5 * vecNorm(vecCross(e0, e3));

  const Q = matrixScale(multiply4dColumnVectorByTranspose(K), 3.0 / (A0 + A1));

    const sumQ = 0;
    
    for (var i = 0; i < 4; ++i) 
        for (var j = 0; j < 4; ++j) 
            sumQ += Q[i][j] * vecDot(particles[i].p, particles[j].p);
        
      
    C = 0.5 * sumQ;
}

function cotTheta (a, b)
{
    const cosTheta = a.clone().dot(b);
    const cross = a.clone().cross(b);
    const sinTheta = cross.length();
  
    return cosTheta / sinTheta;
};