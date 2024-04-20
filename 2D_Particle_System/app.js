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
var elapsed_dt = 0;

function update()
{
    // var currentElapsed_dt = performance.now();
    // dt = (currentElapsed_dt - elapsed_dt) / 1000;
    // elapsed_dt = currentElapsed_dt;

    particleSystem.update(dt);
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