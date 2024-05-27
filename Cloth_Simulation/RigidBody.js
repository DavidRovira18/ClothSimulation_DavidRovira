import { Vector3, BoxGeometry, SphereGeometry, CylinderGeometry, MeshBasicMaterial, Mesh } from "three";


class RigidBody{
    constructor(scene)
    {
        this.scene = scene;
    }
}

class Box extends RigidBody{
    constructor(min, max, scene)
    {
        super(scene);
        this.min = min;
        this.max = max;
        this.center = min.clone().add(max).multiplyScalar(0.5);

        this.geometry = new BoxGeometry(max.x - min.x, max.y - min.y, max.z - min.z);
        this.material = new MeshBasicMaterial({ color: 0x0000ff });
        this.mesh = new Mesh(this.geometry, this.material);

        this.scene.add(this.mesh);
    }
}

class Sphere extends RigidBody{
    constructor(center, radius, scene)
    {
        super(scene);
        this.center = center;
        this.radius = radius;

        this.geometry = new SphereGeometry(radius, 32, 32);
        this.material = new MeshBasicMaterial({ color: 0x0000ff });
        this.mesh = new Mesh(this.geometry, this.material);

        this.scene.add(this.mesh);
    }
}