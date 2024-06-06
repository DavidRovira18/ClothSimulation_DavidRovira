import { Vector3, BoxGeometry, SphereGeometry, CapsuleGeometry, Mesh, MeshBasicMaterial } from "three";

export class RigidBody{
    constructor(scene, visible)
    {
        this.scene = scene;
        this.visible = visible;
        this.mesh = undefined;
    }

    toogleVisibility()
    {
        this.mesh.visible = this.visible;
    }
}

export class BoxBody extends RigidBody{
    constructor(min, max, scene, visible)
    {
        super(scene, visible);
        this.min = min;
        this.max = max;
        this.center = min.clone().add(max).multiplyScalar(0.5);

        this.geometry = new BoxGeometry(max.x - min.x, max.y - min.y, max.z - min.z);
        this.material = new MeshBasicMaterial({ color: 0x0000ff });
        this.mesh = new Mesh(this.geometry, this.material);
        
        this.mesh.position.copy(this.center);
        this.scene.add(this.mesh);

        this.toogleVisibility();
    }
}

export class SphereBody extends RigidBody{
    constructor(center, radius, scene, visible)
    {
        super(scene, visible);
        this.center = center;
        this.radius = radius;

        this.geometry = new SphereGeometry(radius, 32, 32);
        this.material = new MeshBasicMaterial({ color: 0x0000ff });
        this.mesh = new Mesh(this.geometry, this.material);

        this.mesh.position.copy(this.center);
        this.scene.add(this.mesh);

        this.toogleVisibility();
    }
}