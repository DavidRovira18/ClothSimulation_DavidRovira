import { BoxBody, SphereBody } from "./RigidBody.js"

export function detectCollisions(particle, rigidBody)
{
    if (rigidBody instanceof BoxBody)
        return detectCollisionsBox(particle, rigidBody);   

    if (rigidBody instanceof SphereBody)
        return detectCollisionsSphere(particle, rigidBody);

    return { collision: false };
}

export function resolveCollisions(particle, rigidBody, colInfo)
{
    if (rigidBody instanceof BoxBody)
        resolveCollisionsBox(particle, rigidBody, colInfo);   

    if (rigidBody instanceof SphereBody)
        resolveCollisionsSphere(particle, rigidBody, colInfo);
}

function detectCollisionsBox(particle, rigidBody)
{
    if (particle.pos.x >= rigidBody.min.x && particle.pos.x <= rigidBody.max.x &&
        particle.pos.y >= rigidBody.min.y && particle.pos.y <= rigidBody.max.y &&
        particle.pos.z >= rigidBody.min.z && particle.pos.z <= rigidBody.max.z) {
        
        const collisionPoint = particle.pos.clone();
        const collisionNormal = new Vector3(0, 1, 0);
        return { collision: true, point: collisionPoint, normal: collisionNormal };
    }
    return { collision: false };
}

function detectCollisionsSphere(particle, rigidBody)
{
    const distance = particle.pos.distanceTo(rigidBody.center);
    if (distance < rigidBody.radius) { 
        const collisionNormal = particle.pos.clone().sub(rigidBody.center).normalize();
        const collisionPoint = rigidBody.center.clone().add(collisionNormal.clone().multiplyScalar(rigidBody.radius));
        return { collision: true, point: collisionPoint, normal: collisionNormal };
    }
    return { collision: false };
}

function resolveCollisionsBox(particle, rigidBody, colInfo)
{

}

function resolveCollisionsSphere(particle, rigidBody, colInfo)
{
    const colDepth = rigidBody.radius - particle.pos.distanceTo(rigidBody.center); // How much the particle is inside the sphere
    
    // Move the particle outside the Sphere direction to the normal of the colision
    const posCorrection = colInfo.normal.clone().multiplyScalar(colDepth); 
    particle.pos.add(posCorrection); 
}