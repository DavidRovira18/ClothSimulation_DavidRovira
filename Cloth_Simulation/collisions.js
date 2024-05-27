import { BoxBody, SphereBody } from "./RigidBody"
export function detectCollisions(particle, rigidBody)
{
    if (rigidBody instanceof BoxBody)
        detectCollisionsBox(particle, rigidBody);   

    if (rigidBody instanceof SphereBody)
        detectCollisionsSphere(particle, rigidBody);
}

export function resolveCollisions(particle, rigidBody, colInfo)
{

}

detectCollisionsBox(particle, rigidBody)
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

detectCollisionsSphere(particle, rigidBody)
{
    const distance = particle.pos.distanceTo(rigidBody.center);
    if (distance < rigidBody.radius) { 
        const collisionNormal = particle.pos.clone().sub(rigidBody.center).normalize();
        const collisionPoint = rigidBody.center.clone().add(collisionNormal.clone().multiplyScalar(rigidBody.radius));
        return { collision: true, point: collisionPoint, normal: collisionNormal };
    }
    return { collision: false };
}