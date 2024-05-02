import { Vector3 } from "three";

export function EulerIntegrator(p, dt)
 {
    var a = new Vector3(p.f.x / p.mass, p.f.y / p.mass, p.f.z / p.mass);

    p.pos = p.pos.add(p.vel.multiplyScalar(dt));
    
    p.vel = p.vel.add(a.multiplyScalar(dt));
}

export function SemiImplicitEulerIntegrator(p, dt)
{
    var a = new Vector3(p.f.x / p.mass, p.f.y / p.mass, p.f.z / p.mass);

    p.vel = p.vel.add(a.multiplyScalar(dt));

    p.pos = p.pos.add(p.vel.multiplyScalar(dt));
}