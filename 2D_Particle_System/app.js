const canvas = document.getElementById("container");
const ctx = canvas.getContext("2d");

ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;

const particleSystem = new ParticleSystem();

particles_mass = 10;
canvas.addEventListener("click", (event) => {
    particleSystem.addParticle(particles_mass, new vec2(event.clientX, event.clientY));
  });

var dt = 1/60;

var currentTime = performance.now();

function update()
{
    // var currentElapsed_dt = performance.now();
    // dt = (currentElapsed_dt - elapsed_dt) / 1000;
    // elapsed_dt = currentElapsed_dt;
    var newTime = performance.now();
    var frameTime = newTime - currentTime;
    currentTime = newTime;

    while(frameTime > 0.0)
    {
        var deltaTime = Math.min(frameTime, dt);
        particleSystem.update(deltaTime);
        frameTime -= deltaTime;
    }
}

function render()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particleSystem.render(ctx);
}

function loop()
{
    update();
    render();

    requestAnimationFrame(loop);
}

loop();