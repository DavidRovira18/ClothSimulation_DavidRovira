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

export function solveBendingConstraint(particle1, particle2, particle3, particle4, compliance, dt)
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

    const e0_x_e1 = e0.clone().cross(e1);
    const e0_x_e3 = e0.clone().cross(e3);
    const A0 = 0.5 * e0_x_e1.length();
    const A1 = 0.5 * e0_x_e3.length();

    const wMatrix = new Array(particles.length * 3);
    for (let i = 0; i < particles.length * 3; ++i) 
        wMatrix[i] = particles[Math.floor(i / 3)].w;
    

    const Q = matrixScale(multiply4dColumnVectorByTranspose(K), 3.0 / (A0 + A1));

    var sumQ = 0;
    
    for (var i = 0; i < 4; ++i) 
        for (var j = 0; j < 4; ++j) 
            sumQ += Q[i][j] * particles[i].pos.clone().dot(particles[j].pos);
        
      
    C = 0.5 * sumQ;

    if (C < 1e-12) return;

    const grad = calculateGradBend(Q, particles);

    const grad_w = grad.clone().multiply(wMatrix); 
    const lagrangianMultiplier = - C / (grad_w.clone().dot(grad) + alpha);

    const w_lagrangian = wMatrix.clone().multiplyScalar(lagrangianMultiplier) 
    const deltaX = w_lagrangian.clone().multiply(grad);

    const deltaX1 = new Vector3(...deltaX.slice(0,3));
    const deltaX2 = new Vector3(...deltaX.slice(3,6));
    const deltaX3 = new Vector3(...deltaX.slice(6,9));
    const deltaX4 = new Vector3(...deltaX.slice(9,12));
    
    particle1.pos.add(deltaX1);
    particle2.pos.add(deltaX2);
    particle3.pos.add(deltaX3);
    particle4.pos.add(deltaX4);
}

function cotTheta (a, b)
{
    const cosTheta = a.clone().dot(b);
    const cross = a.clone().cross(b);
    const sinTheta = cross.length();
  
    return cosTheta / sinTheta;
};

function matrixScale(a, s)
{
    return a.map((arr) => {
      return arr.multiplyScalar(s);
    });
};

function multiply4dColumnVectorByTranspose(a)
{
    const out = [[], [], [], []];

    for (let i = 0; i < 4; ++i) {
        for (let j = 0; j < 4; ++j) {
        out[i][j] = a[i] * a[j];
        }
    }

    return out;
};

function calculateGradBend(Q, particles)
{
    const grad = [];
    for (let i = 0; i < 4; ++i) {
      let sum = [0, 0, 0];
      for (let j = 0; j < 4; ++j) {
        sum = sum.clone().add(particles[j].pos.clone().multiplyScalar(Q[i][j]));
      }
  
      grad[i] = sum;
    }
  
    return grad.flat();
  };