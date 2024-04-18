function EulerIntegrator(p, dt)
 {
    var a = new vec2(p.f.x / p.mass, p.f.y / p.mass);

    p.pos = p.pos.add(p.vel.scale(dt));
    
    p.vel = p.vel.add(a.scale(dt));
}

function SemiImplicitEulerIntegrator(p, dt)
{
    var a = new vec2(p.f.x / p.mass, p.f.y / p.mass);

    p.vel = p.vel.add(a.scale(dt));

    p.pos = p.pos.add(p.vel.scale(dt));
}