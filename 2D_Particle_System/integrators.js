function EulerIntegrator(p, dt) //Recieves a particle and the time step
{
    // a = f/m (mirar de fer.ho mes eficientment)
    var a = new vec2(0,0);
    a.x = p.f.x / p.mass;
    a.y = p.f.y / p.mass;
    // change in x = velocity * dt
    p.pos = p.pos.add(p.vel.scale(dt));
    //change in v = acceleration * dt
    p.vel = p.vel.add(a.scale(dt));
}