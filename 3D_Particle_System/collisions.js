export function particleIntersectsPlane(particleBB, planeBB)
{
    if(particleBB.intersectsBox(planeBB))
        return true;

    return false;
}