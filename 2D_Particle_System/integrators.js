function EulerIntegrator(p, dt) {
    // Calculate acceleration using force and mass: a = f / m
    var a = new vec2(p.f.x / p.mass, p.f.y / p.mass);

    p.pos = p.pos.add(p.vel.scale(dt));
    
    p.vel = p.vel.add(a.scale(dt));
}