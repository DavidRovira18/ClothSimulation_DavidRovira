class Particle{
    constructor(position){
        this.position = position.clone();
        this.prev_position = position.clone();
        this.acceleration = new THREE.Vector3();
        this.mass = 1;
    }
}

