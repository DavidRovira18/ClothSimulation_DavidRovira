//3D particle system implementation
import { Vector3, Quaternion, SphereGeometry, CylinderGeometry, MeshBasicMaterial, Mesh, Sphere, DoubleSide, Object3D } from "three";
import { EulerIntegrator, SemiImplicitEulerIntegrator } from '../3D_Particle_System/integrators.js';
import { solveDistanceConstraint } from "./constraints.js";
import { RigidBody } from "./RigidBody.js";
import { detectCollisions, resolveCollisions } from "./collisions.js";

export class Particle{
    constructor(id, mass, pos, index, objectgroup)
    {
        if (! (pos instanceof Vector3))
            console.error("Position is not a Vector3")

        this.id = id;
        this.mass = mass;
        this.initMass = mass;
        this.pos = pos;
        this.initPos = pos.clone();
        this.vel = new Vector3(0,0,0);
        this.f = new Vector3(0,0,0);

        this.w = 1/this.mass; //Inverse mass

        this.prevPos = new Vector3();

        this.attached = false;

        this.geometry = new SphereGeometry(0.008, 32, 32);
        this.material = new MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new Mesh(this.geometry, this.material);
        objectgroup.add(this.mesh);

        this.vertexIndex = index;

        this.mesh.position.copy(this.pos)
    }

    applyForce(force)
    {
        if (!(force instanceof Vector3))
            console.error("Force is not a Vector3");
        
        this.f.add(force);
    }

    clearForce()
    {
        this.f.fromArray([0,0,0]);
    }

    update(dt)
    {
        if (this.grounded) return;

        //Clear acting forces 
        this.clearForce();

        //Apply gravity force
        this.applyForce(new Vector3(0, -9.81 * this.mass, 0));

        //Euler integrator
        SemiImplicitEulerIntegrator(this, dt);

        //Update mesh
        this.mesh.position.copy(this.pos);
    }

    resetParticle()
    {
        this.mass = this.initMass;
        this.w = 1/this.mass;
        this.pos = this.initPos;
        this.vel = new Vector3(0,0,0);
        this.clearForce();
        this.prevPos = new Vector3(0,0,0);
        this.attached = false;
        this.mesh.position.copy(this.pos);
        this.mesh.material.color.set(0xff000);
    }
}

class Link
{
    constructor(particle1, particle2, mode, objectgroup)
    {
        this.particle1 = particle1;
        this.particle2 = particle2;

        this.r = particle1.pos.distanceTo(particle2.pos); //Resting length
    }
}

export class LinkDistanceConstraint extends Link
{
    constructor(particle1, particle2, mode, objectgroup)
    {
        super(particle1, particle2, mode, objectgroup);

        //Spring mesh
        const springGeometry = new CylinderGeometry(0.001, 0.001, this.r, 4);
        const springMaterial = new MeshBasicMaterial({ color: 0x00ff00, side: DoubleSide });
        this.springMesh = new Mesh(springGeometry, springMaterial);
        this.springMesh.frustumCulled = false;

        springMaterial.transparent = true;
        springMaterial.opacity = mode == 'DC' ? 1.0 : 0.0;

        // Compute position
        const midpoint = new Vector3().copy(this.particle1.pos).add(this.particle2.pos).multiplyScalar(0.5);
        this.springMesh.position.copy(midpoint);

        // Compute rotation for the cylinder to align with the line between particles
        const direction = new Vector3().copy(particle2.pos).sub(particle1.pos).normalize();
        const up = new Vector3(0, 1, 0); // Assuming the cylinder is initially oriented along the y-axis
        const quaternion = new Quaternion().setFromUnitVectors(up, direction);
        this.springMesh.quaternion.copy(quaternion);

        objectgroup.add(this.springMesh);
    }

    update(mode)
    {
        this.updateLinkMesh();

        var opacity = this.springMesh.material.opacity;
        
        if (mode == 'BC' && opacity == 1.0)
            {
                this.springMesh.material.opacity = 0.0;
            }
        
        if (mode == 'DC' && opacity == 0.0)
            opacity = 1.0;
    }

    updateLinkMesh() 
    {
        // Compute position
        const midpoint = new Vector3().copy(this.particle1.pos).add(this.particle2.pos).multiplyScalar(0.5);
        this.springMesh.position.copy(midpoint);

        // Compute rotation
        const direction = new Vector3().copy(this.particle2.pos).sub(this.particle1.pos).normalize();
        const up = new Vector3(0, 1, 0); // Assuming the cylinder is initially oriented along the y-axis
        const quaternion = new Quaternion().setFromUnitVectors(up, direction);
        this.springMesh.quaternion.copy(quaternion);
    }
}

export class LinkBendingConstraint extends Link
{
    constructor(particle1, particle2, mode, objectgroup)
    {
        super(particle1, particle2, mode, objectgroup);

        //Spring mesh
        const springGeometry = new CylinderGeometry(0.001, 0.001, this.r, 4);
        const springMaterial = new MeshBasicMaterial({ color: 0xA020F0, side: DoubleSide });
        
        // springMaterial.transparent = true;
        springMaterial.opacity = mode == 'DC' ? 0.0 : 1.0;

        this.springMesh = new Mesh(springGeometry, springMaterial);
        this.springMesh.frustumCulled = false;

        // Compute position
        const midpoint = new Vector3().copy(this.particle1.pos).add(this.particle2.pos).multiplyScalar(0.5);
        this.springMesh.position.copy(midpoint);

        // Compute rotation for the cylinder to align with the line between particles
        const direction = new Vector3().copy(particle2.pos).sub(particle1.pos).normalize();
        const up = new Vector3(0, 1, 0); // Assuming the cylinder is initially oriented along the y-axis
        const quaternion = new Quaternion().setFromUnitVectors(up, direction);
        this.springMesh.quaternion.copy(quaternion);

        //scene.add(this.springMesh);
        objectgroup.add(this.springMesh);
    }

    update(mode)
    {
        this.updateLinkMesh();

        var opacity = this.springMesh.material.opacity;
        
        if (mode == 'DC' && opacity == 1.0)
            {
                this.springMesh.material.opacity = 0.0;
            }
        
        if (mode == 'BC' && opacity == 0.0)
            opacity = 1.0;
    }

    updateLinkMesh() 
    {
        // Compute position
        const midpoint = new Vector3().copy(this.particle1.pos).add(this.particle2.pos).multiplyScalar(0.5);
        this.springMesh.position.copy(midpoint);

        // Compute rotation
        const direction = new Vector3().copy(this.particle2.pos).sub(this.particle1.pos).normalize();
        const up = new Vector3(0, 1, 0); // Assuming the cylinder is initially oriented along the y-axis
        const quaternion = new Quaternion().setFromUnitVectors(up, direction);
        this.springMesh.quaternion.copy(quaternion);
    }
}

export class ParticleSystem{
    constructor(scene)
    {
        this.particles = [];
        this.forces = [];
        this.rigidBodies = [];
        this.idCount = 0;

        this.objectgroup = new Object3D();
        this.scene = scene;
        this.scene.add(this.objectgroup)
    }

    createParticle(mass, pos, index)
    {
        this.particles.push(new Particle(this.idCount, mass, pos, index, this.objectgroup));
        this.idCount++
    }

    addParticle(particle)
    {
        this.particles.push(particle);
    }

    addForce(f)
    {
        if (!(f instanceof Vector3))    
            console.error("Force is not a Vector3");

        this.forces.push(f);
    }

    addRigidBody(rigidBody) 
    {
        if (!(rigidBody instanceof RigidBody))
            console.error("Not a RigidBody");

        this.rigidBodies.push(rigidBody);
    }

    update(dt)
    {
        this.particles.forEach((particle) => {
            particle.update(dt);
        })
    }

    getParticleFromPos(pos)
    {
        return this.particles.find(particle => particle.pos.equals(pos));
    }

    detectCols() 
    {
        this.particles.forEach((particle) => {
            for (var i = 0; i < this.rigidBodies.length; ++i)
            {
                const rigidBody = this.rigidBodies[i];
                const colInfo = detectCollisions(particle, rigidBody);
                particle.colInfo = colInfo; //Store collision info at each particle
                if(particle.colInfo.collision)
                    break;
            }
        });
    }

    resolveCols() 
    {
        this.particles.forEach((particle) => {
            if(particle.colInfo.collision)
                    resolveCollisions(particle, particle.colInfo); 
        })
    }
}

export class LinksSystem extends ParticleSystem{
    constructor(scene)
    {
        super(scene)
        this.linksDistanceConstraint = [];
        this.idLinksDistanceConstraint = [];
        this.idLinksBendingConstraint = [];
        this.linksBendingConstraint = [];
        this.scene = scene;
    }

    addLinkDistanceConstraint(particle1, particle2, mode) //Create spring between particles
    {
        // prevent repeated links
        if (this.idLinksDistanceConstraint.find((el) => {if (el[0] == particle1.id && el[1] == particle2.id) return true;}) || this.idLinksDistanceConstraint.find((el) => {if (el[0] == particle2.id && el[1] == particle1.id) return true;}))
            return;

        this.idLinksDistanceConstraint.push([particle1.id, particle2.id]);
        this.linksDistanceConstraint.push(new LinkDistanceConstraint(particle1, particle2, mode, this.objectgroup));
    }

    addLinkBendingConstraint(particle1, particle2, mode)
    {
        // prevent repeated links
        if (this.idLinksBendingConstraint.find((el) => {if (el[0] == particle1.id && el[1] == particle2.id) return true;}) || this.idLinksBendingConstraint.find((el) => {if (el[0] == particle2.id && el[1] == particle1.id) return true;}))
            return;

        this.idLinksBendingConstraint.push([particle1.id, particle2.id]);
        this.linksBendingConstraint.push(new LinkBendingConstraint(particle1, particle2, mode, this.objectgroup));
    }

    update(dt, substeps, stiffness, mode, gravityForce, applyWind, windForce, windDirection) {
        
        // XPBD Loop
        var ts = dt / substeps;

        this.detectCols(); //Detect collisions

        for (let i = 0; i < substeps; ++i) {
            this.particles.forEach((particle) => {
                
                if(particle.attached)
                    return;
                    
                particle.clearForce();
                particle.applyForce(new Vector3(0, gravityForce * particle.mass * 0.1, 0)); // Add gravity force

                if(applyWind)
                    particle.applyForce(windDirection.clone().multiplyScalar(windForce * 0.1));
                

                particle.prevPos.copy(particle.pos); // Store previous position
                SemiImplicitEulerIntegrator(particle, ts); // Compute predicted position
                
            });

            if (mode == 'DC')
            {
                this.linksDistanceConstraint.forEach((link) => {
                    solveDistanceConstraint(link.particle1, link.particle2, link.r, stiffness, ts); // Solve distance constraints
                });
            }

            if (mode == 'BC')
            {
                this.linksBendingConstraint.forEach((link) => {
                    solveDistanceConstraint(link.particle1, link.particle2, link.r, stiffness, ts); // Solve bending constraints
                });
            }

            this.resolveCols();            

            // Update velocities based on the corrected positions
            this.particles.forEach((particle) => {
                particle.vel.copy(particle.pos).sub(particle.prevPos).divideScalar(ts);
            });

        }

        this.particles.forEach((particle) => {
            particle.mesh.position.copy(particle.pos);
        })
        
        this.linksDistanceConstraint.forEach((link) => {
            link.updateLinkMesh();
        })        
        
        this.linksBendingConstraint.forEach((link) => {
            link.update(mode);
        })
    }
}

