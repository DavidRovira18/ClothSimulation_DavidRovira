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

const vecAdd = (a, b) => a.map((val, i) => val + b[i]);
const vecScale = (a, s) => a.map(el => el * s);
const vecSub = (a, b) => a.map((val, i) => val - b[i]);
const vecDot = (a, b) => a.reduce((sum, val, i) => sum + val * b[i], 0);
const vecCross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
];
const vecNorm = a => Math.sqrt(vecDot(a, a));

const cotTheta = (a, b) => vecDot(a, b) / vecNorm(vecCross(a, b));

const multiply4dColumnVectorByTranspose = a => a.map((val1, i) => a.map(val2 => val1[0] * val2[0]));
const matrixScale = (a, s) => a.map(arr => vecScale(arr, s));
const vecScalarWiseMultiply = (a, b) => a.map((val, i) => val * b[i]);

const initBendingConstraint = particles => {
    const x = particles.map(p => [p.pos.x, p.pos.y, p.pos.z]);

    const e0 = vecSub(x[1], x[0]);
    const e1 = vecSub(x[2], x[1]);
    const e2 = vecSub(x[0], x[2]);
    const e3 = vecSub(x[3], x[0]);
    const e4 = vecSub(x[1], x[3]);

    const cot01 = cotTheta(e0, vecScale(e1, -1));
    const cot02 = cotTheta(e0, vecScale(e2, -1));
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

    return matrixScale(multiply4dColumnVectorByTranspose(K), 3.0 / (A0 + A1));
};

const calculateConstraintValue = (Q, particles) => {
    let sum = 0;
    const x = particles.map(p => [p.pos.x, p.pos.y, p.pos.z]);

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            sum += Q[i][j] * vecDot(x[i], x[j]);
        }
    }

    return 0.5 * sum;
};

const calculateGrad = (Q, particles) => {
    const grad = Array(4).fill().map(() => [0, 0, 0]);
    const x = particles.map(p => [p.pos.x, p.pos.y, p.pos.z]);

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            grad[i] = vecAdd(grad[i], vecScale(x[j], Q[i][j]));
        }
    }

    return grad;
};

export function solveBendingConstraint(particle1, particle2, particle3, particle4, compliance, dt) {
    const alpha = compliance / (dt * dt);

    const particles = [particle1, particle2, particle3, particle4];

    const wMatrix = new Array(particles.length * 3).fill(0).map((_, i) => particles[Math.floor(i / 3)].w);

    const Q = initBendingConstraint(particles);

    const C = calculateConstraintValue(Q, particles); // calculate the current constraint value
    if (C < 1e-12) {
        return;
    }

    const grad = calculateGrad(Q, particles).flat();
    const deltaLagrangianMultiplier = -C / (vecDot(vecScalarWiseMultiply(grad, wMatrix), grad) + alpha);
    const deltaX = vecScalarWiseMultiply(vecScale(wMatrix, deltaLagrangianMultiplier), grad);

    const deltaX1 = new Vector3(...deltaX.slice(0, 3));
    const deltaX2 = new Vector3(...deltaX.slice(3, 6));
    const deltaX3 = new Vector3(...deltaX.slice(6, 9));
    const deltaX4 = new Vector3(...deltaX.slice(9, 12));

    particle1.pos.add(deltaX1);
    particle2.pos.add(deltaX2);
    particle3.pos.add(deltaX3);
    particle4.pos.add(deltaX4);
};