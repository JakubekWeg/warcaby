import { commonMaterials, MaterialType } from '../globals-3d'
import { BOARD_SIZE, TILE_SIZE } from '../shared'
import { THREE } from '../three'

export const BOARD_ITEMS_COUNT = BOARD_SIZE
let cachedGeometry: THREE.BufferGeometry;

const buildGeometry = (): THREE.BufferGeometry => {
	if (cachedGeometry) return cachedGeometry
	const geometry = new THREE.Geometry()
	let currentNormal: THREE.Vector3

	const addFaces = (a: number, b: number, c: number, d: number, material: MaterialType) => {
		geometry.faces.push(
			new THREE.Face3(a, b, c, currentNormal, null, material),
			new THREE.Face3(b, d, c, currentNormal, null, material),
		)
	}
	const addFaces2 = (a: number, b: number, c: number, d: number, material: MaterialType) => {
		geometry.faces.push(
			new THREE.Face3(a, b, c, currentNormal, null, material),
			new THREE.Face3(a, d, b, currentNormal, null, material),
		)
	}
	const addFaces3 = (a: number, b: number, c: number, d: number, material: MaterialType) => {
		geometry.faces.push(
			new THREE.Face3(a, b, c, currentNormal, null, material),
			new THREE.Face3(a, c, d, currentNormal, null, material),
		)
	}

	// vertexes for main board
	for (let i = 0; i <= BOARD_ITEMS_COUNT; ++i) {
		for (let j = 0; j <= BOARD_ITEMS_COUNT; ++j) {
			geometry.vertices.push(new THREE.Vector3(i * TILE_SIZE, 0, j * TILE_SIZE))
		}
	}

	// main board faces
	currentNormal = new THREE.Vector3(0, 1, 0)
	let alternativeMaterial = false
	for (let i = 0; i < BOARD_ITEMS_COUNT; ++i) {
		for (let j = 0; j < BOARD_ITEMS_COUNT; ++j) {

			addFaces(j * (BOARD_ITEMS_COUNT + 1) + i,
				j * (BOARD_ITEMS_COUNT + 1) + i + 1,
				(j + 1) * (BOARD_ITEMS_COUNT + 1) + i,
				(j + 1) * (BOARD_ITEMS_COUNT + 1) + i + 1,
				alternativeMaterial ? MaterialType.TopLight : MaterialType.TopDark)
			alternativeMaterial = !alternativeMaterial

			geometry.faceVertexUvs[0].push(
				[new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(0, 1)],
				[new THREE.Vector2(1, 0), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1)],
			)
		}
		alternativeMaterial = !alternativeMaterial
	}


	// sides, vertexes:
	// side 1
	currentNormal = new THREE.Vector3(-1, 0, 0)
	let vertexesCount = geometry.vertices.length
	for (let i = 0; i <= BOARD_ITEMS_COUNT; ++i) {
		geometry.vertices.push(new THREE.Vector3(0, -TILE_SIZE, i * TILE_SIZE))
		geometry.vertices.push(new THREE.Vector3(0, -TILE_SIZE, (i + 1) * TILE_SIZE))
	}

	for (let i = 0; i < BOARD_ITEMS_COUNT; ++i) {
		const vertexStart = vertexesCount + i + i
		addFaces(i, vertexStart, i + 1, vertexStart + 1, alternativeMaterial ? MaterialType.SideLight : MaterialType.SideDark)
		alternativeMaterial = !alternativeMaterial
		geometry.faceVertexUvs[0].push(
			[new THREE.Vector2(0, 1), new THREE.Vector2(0, 0), new THREE.Vector2(1, 1)],
			[new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1)],
		)
	}

	// side 2
	currentNormal = new THREE.Vector3(0, 0, -1)
	vertexesCount = geometry.vertices.length
	for (let i = 0; i <= BOARD_ITEMS_COUNT; ++i) {
		geometry.vertices.push(new THREE.Vector3(i * TILE_SIZE, -TILE_SIZE, 0))
		geometry.vertices.push(new THREE.Vector3((i + 1) * TILE_SIZE, -TILE_SIZE, 0))
	}

	for (let i = 0; i < BOARD_ITEMS_COUNT; ++i) {
		const vertexStart = vertexesCount + i + i
		addFaces(
			vertexStart + 1,
			vertexStart,
			(BOARD_ITEMS_COUNT + 1) * (i + 1),
			(BOARD_ITEMS_COUNT + 1) * i,
			alternativeMaterial ? MaterialType.SideLight : MaterialType.SideDark)

		alternativeMaterial = !alternativeMaterial
		geometry.faceVertexUvs[0].push(
			[new THREE.Vector2(1, 0), new THREE.Vector2(0, 0), new THREE.Vector2(1, 1)],
			[new THREE.Vector2(0, 0), new THREE.Vector2(0, 1), new THREE.Vector2(1, 1)],
		)
	}


	// side 3
	currentNormal = new THREE.Vector3(1, 0, 0)
	let tmp = (BOARD_ITEMS_COUNT + 1) ** 2 - BOARD_ITEMS_COUNT - 1
	vertexesCount = geometry.vertices.length
	for (let i = 0; i <= BOARD_ITEMS_COUNT; ++i) {
		geometry.vertices.push(new THREE.Vector3(TILE_SIZE * BOARD_ITEMS_COUNT, -TILE_SIZE, i * TILE_SIZE))
		geometry.vertices.push(new THREE.Vector3(TILE_SIZE * BOARD_ITEMS_COUNT, -TILE_SIZE, (i + 1) * TILE_SIZE))
	}

	alternativeMaterial = !alternativeMaterial
	for (let i = 0; i < BOARD_ITEMS_COUNT; ++i) {
		const vertexStart = vertexesCount + i + i
		addFaces2(tmp + i, vertexStart + 1, vertexStart, tmp + i + 1,
			alternativeMaterial ? MaterialType.SideLight : MaterialType.SideDark)
		alternativeMaterial = !alternativeMaterial

		geometry.faceVertexUvs[0].push(
			[new THREE.Vector2(1, 1), new THREE.Vector2(0, 0), new THREE.Vector2(1, 0)],
			[new THREE.Vector2(1, 1), new THREE.Vector2(0, 1), new THREE.Vector2(0, 0)],
		)
	}


	// side 4
	currentNormal = new THREE.Vector3(0, 0, 1)
	vertexesCount = geometry.vertices.length
	for (let i = 0; i <= BOARD_ITEMS_COUNT; ++i) {
		geometry.vertices.push(new THREE.Vector3(i * TILE_SIZE, -TILE_SIZE, TILE_SIZE * BOARD_ITEMS_COUNT))
		geometry.vertices.push(new THREE.Vector3((i + 1) * TILE_SIZE, -TILE_SIZE, TILE_SIZE * BOARD_ITEMS_COUNT))
	}

	for (let i = 0; i < BOARD_ITEMS_COUNT; ++i) {
		const vertexStart = vertexesCount + i + i
		addFaces3((i + 2) * (BOARD_ITEMS_COUNT + 1) - 1, (i + 1) * (BOARD_ITEMS_COUNT + 1) - 1, vertexStart, vertexStart + 1,
			alternativeMaterial ? MaterialType.SideLight : MaterialType.SideDark)
		alternativeMaterial = !alternativeMaterial

		geometry.faceVertexUvs[0].push(
			[new THREE.Vector2(0, 1), new THREE.Vector2(1, 1), new THREE.Vector2(1, 0)],
			[new THREE.Vector2(0, 1), new THREE.Vector2(1, 0), new THREE.Vector2(0, 0)],
		)
	}

	// geometry.computeFaceNormals()
	cachedGeometry = new THREE.BufferGeometry().fromGeometry(geometry)
	geometry.dispose()
	return cachedGeometry
}

export const getBoardMesh = (): THREE.Mesh => {

	const mesh = new THREE.Mesh(buildGeometry(), commonMaterials)
	mesh.position.x = -TILE_SIZE * BOARD_ITEMS_COUNT / 2
	mesh.position.z = -TILE_SIZE * BOARD_ITEMS_COUNT / 2
	mesh.receiveShadow = true

	mesh.matrixAutoUpdate = false
	mesh.updateMatrix()


	return mesh
}
