function EulerIntegrator(p, dt) //Recieves a particle and the time step
{
    var a = new vec2(p.f.x / p.mass, p.f.y / p.mass);

    // Update position: change in position = velocity * dt
    p.pos = p.pos.add(p.vel.scale(dt));

    // Update velocity: change in velocity = acceleration * dt
    p.vel = p.vel.add(a.scale(dt));
}