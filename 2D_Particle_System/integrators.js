function EulerIntegrator(p, dt) {
    // Calculate acceleration using force and mass: a = f / m
    var a = new vec2(p.f.x / p.mass, p.f.y / p.mass);

    // Update velocity: change in velocity = velocity + acceleration * dt
    p.vel = p.vel.add(a.scale(dt));
    console.log(p.vel)

    // Update position: change in position = position + velocity * dt
    p.pos = p.pos.add(p.vel.scale(dt));
    console.log(p.pos)
}