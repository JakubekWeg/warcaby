import { commonMaterials, poofMaterials } from './globals-3d';
import { THREE } from './three';
const basicParticleGeometry = new THREE.BufferGeometry();
basicParticleGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
class ParticlesGroup {
    constructor(creator, spawner, onExecWhenValid, onFrame = null) {
        this.creator = creator;
        this.spawner = spawner;
        this.onExecWhenValid = onExecWhenValid;
        this.onFrame = onFrame;
        this.active = [];
        this.inactive = [];
        if (!onFrame)
            this.onFrame = (p, now) => {
                if (now > p.userData.dieAt) {
                    p.visible = false;
                    return false;
                }
                return true;
            };
    }
    doFrame(now) {
        for (let i = this.active.length - 1; i >= 0; i--) {
            const p = this.active[i];
            if (this.onFrame(p, now))
                this.onExecWhenValid(p);
            else {
                this.active.splice(i, 1);
                this.inactive.push(p);
            }
        }
    }
    spawn(x, y, z, dieAt) {
        this.active.push(this.spawner(this.get(), x, y, z, dieAt));
    }
    get() {
        const t = this.inactive.pop();
        return (t !== undefined) ? t : this.creator();
    }
}
export class ParticlesEngine {
    constructor(scene) {
        this.scene = scene;
        this.createParticle = (material, cloneMaterial = false) => {
            const p = new THREE.Points(basicParticleGeometry, cloneMaterial ? commonMaterials[material].clone() : commonMaterials[material]);
            this.scene.add(p);
            return p;
        };
        this.glint = new ParticlesGroup(() => this.createParticle(9 /* GlintParticle */), ParticlesEngine.setUpParticle.bind(this), p => p.position.y += 0.01);
        this.angry = new ParticlesGroup(() => this.createParticle(10 /* AngryParticle */), ParticlesEngine.setUpParticle.bind(this), p => p.position.y += 0.02);
        this.poof = new ParticlesGroup(() => this.createParticle(10 /* AngryParticle */), ParticlesEngine.setUpPoof.bind(this), (obj) => obj.position.y += .2, (obj, now) => {
            if (now > obj.userData.expiresMaterial) {
                if (--(obj.userData.materialIndex) < 0) {
                    obj.visible = false;
                    return false;
                }
                obj.material = poofMaterials[obj.userData.materialIndex];
                obj.userData.expiresMaterial = now + Math.random() * 1000;
            }
            return true;
        });
        this.flame = new ParticlesGroup(() => this.createParticle(16 /* FlameParticle */, true), ParticlesEngine.setUpFlameParticle.bind(this), p => {
            // @ts-ignore
            p.material.size *= .99;
        });
    }
    static setUpParticle(obj, x, y, z, dieAtMs) {
        obj.visible = true;
        obj.position.set(x, y, z);
        obj.userData.dieAt = dieAtMs;
        return obj;
    }
    static setUpFlameParticle(obj, x, y, z, dieAtMs) {
        obj.visible = true;
        obj.position.set(x, y, z);
        obj.userData.dieAt = dieAtMs;
        // @ts-ignore
        obj.material.size = commonMaterials[16 /* FlameParticle */].size * (Math.random() + .5);
        return obj;
    }
    static setUpPoof(obj, x, y, z) {
        obj.visible = true;
        obj.position.set(x, y, z);
        const materialIndex = Math.random() * 8 | 0;
        obj.material = poofMaterials[materialIndex];
        obj.userData.materialIndex = materialIndex;
        obj.userData.expiresMaterial = Date.now() + Math.random() * 2000;
        return obj;
    }
    doFrame() {
        const now = Date.now();
        this.glint.doFrame(now);
        this.angry.doFrame(now);
        this.poof.doFrame(now);
        this.flame.doFrame(now);
    }
}
