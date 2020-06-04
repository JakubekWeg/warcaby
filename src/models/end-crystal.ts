import { commonMaterials, MaterialType } from '../globals-3d'
import { TILE_SIZE } from '../shared'
import { THREE } from '../three'

const frameGeometry = new THREE.BoxBufferGeometry(TILE_SIZE, TILE_SIZE, TILE_SIZE)

const POSITION_Y = TILE_SIZE

export class EndCrystal extends THREE.Object3D {
	private readonly outside2: THREE.Mesh
	private readonly inside: THREE.Mesh

	constructor() {
		super()
		const CORE_SCALE = .6
		this.inside = new THREE.Mesh(frameGeometry, commonMaterials[MaterialType.EndCrystalCore])
		this.inside.scale.set(CORE_SCALE, CORE_SCALE, CORE_SCALE)
		this.add(this.inside)

		const outside1 = new THREE.Mesh(frameGeometry, commonMaterials[MaterialType.EndCrystalFrame])
		const FRAME1_SCALE = .8
		this.inside.scale.set(FRAME1_SCALE, FRAME1_SCALE, FRAME1_SCALE)
		outside1.rotateX(Math.PI / 4)
		this.add(outside1)

		this.outside2 = new THREE.Mesh(frameGeometry, commonMaterials[MaterialType.EndCrystalFrame])
		this.outside2.rotateZ(Math.PI / 4)
		this.add(this.outside2)

		this.position.y = POSITION_Y
		const THIS_SCALE = .5
		this.scale.set(THIS_SCALE, THIS_SCALE, THIS_SCALE)
	}

	update(delta: number, elapsedTime: number) {
		this.position.y = POSITION_Y + Math.sin(elapsedTime * Math.PI * 1.2) * 5
		this.rotateY(delta)
		this.outside2.rotateX(delta)
		this.inside.rotateZ(delta)
	}
}
