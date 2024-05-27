import { Vector3, BoxGeometry, SphereGeometry, MeshBasicMaterial, Mesh } from "three";


export class RigidBody{
    constructor(scene)
    {
        this.scene = scene;
    }
}

export class BoxBody extends RigidBody{
    constructor(min, max, scene)
    {
        super(scene);
        this.min = min;
        this.max = max;
        this.center = min.clone().add(max).multiplyScalar(0.5);

        this.geometry = new BoxGeometry(max.x - min.x, max.y - min.y, max.z - min.z);
        this.material = new MeshBasicMaterial({ color: 0x0000ff });
        this.mesh = new Mesh(this.geometry, this.material);
        
        this.mesh.position.copy(center);
        this.scene.add(this.mesh);
    }
}

export class SphereBody extends RigidBody{
    constructor(center, radius, scene)
    {
        super(scene);
        this.center = center;
        this.radius = radius;

        this.geometry = new SphereGeometry(radius, 32, 32);
        this.material = new MeshBasicMaterial({ color: 0x0000ff });
        this.mesh = new Mesh(this.geometry, this.material);

        this.mesh.position.copy(center);
        this.scene.add(this.mesh);
    }
}