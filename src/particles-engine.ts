import { commonMaterials, MaterialType, poofMaterials } from './globals-3d'
import { THREE } from './three'

const basicParticleGeometry = new THREE.BufferGeometry()
basicParticleGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3))


type FrameFunction<T> = (p: T, now: number) => boolean
type SpawnFunction<T> = (obj: T, x: number, y: number, z: number, dieAt: number) => T

class ParticlesGroup<T extends THREE.Object3D = THREE.Points> {
	private readonly active: T[] = []
	private readonly inactive: T[] = []

	constructor(private readonly creator: () => T,
	            private readonly spawner: SpawnFunction<T>,
	            private readonly onExecWhenValid: (p: T) => void,
	            private readonly onFrame: FrameFunction<T> = null) {
		if (!onFrame) this.onFrame = (p, now) => {
			if (now > p.userData.dieAt) {
				p.visible = false
				return false
			}
			return true
		}
	}

	public doFrame(now: number) {
		for (let i = this.active.length - 1; i >= 0; i--) {
			const p = this.active[i]
			if (this.onFrame(p, now))
				this.onExecWhenValid(p)
			else {
				this.active.splice(i, 1)
				this.inactive.push(p)
			}
		}
	}

	public spawn(x: number, y: number, z: number, dieAt: number) {
		this.active.push(this.spawner(this.get(), x, y, z, dieAt))
	}

	private get(): T {
		const t = this.inactive.pop()
		return (t !== undefined) ? t : this.creator()
	}
}

export class ParticlesEngine {
	public constructor(private readonly scene: THREE.Scene) {
	}


	private static setUpParticle(obj: THREE.Object3D, x: number, y: number, z: number, dieAtMs: number): THREE.Object3D {
		obj.visible = true
		obj.position.set(x, y, z)
		obj.userData.dieAt = dieAtMs
		return obj
	}
	private static setUpFlameParticle(obj: THREE.Object3D, x: number, y: number, z: number, dieAtMs: number): THREE.Object3D {
		obj.visible = true
		obj.position.set(x, y, z)
		obj.userData.dieAt = dieAtMs
		// @ts-ignore
		obj.material.size = commonMaterials[MaterialType.FlameParticle].size * (Math.random() + .5)
		return obj
	}

	private static setUpPoof(obj: THREE.Points, x: number, y: number, z: number): THREE.Object3D {
		obj.visible = true
		obj.position.set(x, y, z)


		const materialIndex = Math.random() * 8 | 0
		obj.material = poofMaterials[materialIndex]
		obj.userData.materialIndex = materialIndex
		obj.userData.expiresMaterial = Date.now() + Math.random() * 2000

		return obj
	}

	public doFrame() {
		const now = Date.now()

		this.glint.doFrame(now)
		this.angry.doFrame(now)
		this.poof.doFrame(now)
		this.flame.doFrame(now)
	}

	private createParticle = (material: MaterialType, cloneMaterial: boolean = false) => {
		const p = new THREE.Points(basicParticleGeometry, cloneMaterial ? commonMaterials[material].clone() : commonMaterials[material])
		this.scene.add(p)
		return p
	}

	public readonly glint = new ParticlesGroup(
		() => this.createParticle(MaterialType.GlintParticle),
		ParticlesEngine.setUpParticle.bind(this),
		p => p.position.y += 0.01)
	public readonly angry = new ParticlesGroup(
		() => this.createParticle(MaterialType.AngryParticle),
		ParticlesEngine.setUpParticle.bind(this),
		p => p.position.y += 0.02)
	public readonly poof = new ParticlesGroup(
		() => this.createParticle(MaterialType.AngryParticle),
		ParticlesEngine.setUpPoof.bind(this),
		(obj) => obj.position.y += .2,
		(obj, now) => {
			if (now > obj.userData.expiresMaterial) {
				if (--(obj.userData.materialIndex) < 0) {
					obj.visible = false
					return false
				}
				obj.material = poofMaterials[obj.userData.materialIndex]
				obj.userData.expiresMaterial = now + Math.random() * 1000
			}
			return true
		})

	public readonly flame = new ParticlesGroup(
		() => this.createParticle(MaterialType.FlameParticle, true),
		ParticlesEngine.setUpFlameParticle.bind(this),
		p => {
			// @ts-ignore
			p.material.size *= .99
		})
}
