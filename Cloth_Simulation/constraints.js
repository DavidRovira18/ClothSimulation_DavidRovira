import { Vector3 } from "three";

export function solveDistanceConstraint(particle1, particle2, r, compliance, dt) {
    const alpha = compliance / (dt * dt);

    const totalWeight = particle1.w + particle2.w;
  
    // Inicializar el vector gradiente como el vector de distancia desde p1 hacia p0.
    const grad = new Vector3().subVectors(particle1.pos, particle2.pos);
  
    // Obtener la longitud del vector gradiente antes de la normalización
    const length = grad.length();
  
    // Normalizar el vector gradiente para obtener solo la dirección
    grad.divideScalar(length);
  
    const C = length - r; // calcular el valor actual del constraint
  
    // Calculamos el multiplicador Lagrangiano
    const deltaLagrangianMultiplier = -C / (totalWeight + alpha);
  
    // Actualizar posiciones
    const deltaX1 = grad.clone().multiplyScalar(deltaLagrangianMultiplier * particle1.w);
    particle1.pos.add(deltaX1);
  
    const deltaX2 = grad.clone().multiplyScalar(-deltaLagrangianMultiplier * particle2.w);
    particle2.pos.add(deltaX2);
}