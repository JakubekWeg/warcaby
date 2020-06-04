import { CameraController } from './camera-controller'
import { GameLogic, PossibleMove } from './game-logic'
import { GameNetworking } from './game-networking'
import { commonMaterials, LIGHT_ENABLED, MaterialType, RENDER_IF_NOT_FOCUS } from './globals-3d'
import { BOARD_ITEMS_COUNT, getBoardMesh } from './models/board'
import { getLanternMesh } from './models/lantern'
import { ParticlesEngine } from './particles-engine'
import { DEFAULT_PAWN_Y, Pawn, PAWN_HEIGHT, PAWN_SIZE, pawnEdgesGeometry, pawnIndexToPosition } from './pawns'
import { PlayerType, Table2d, TILE_SIZE } from './shared'
import { THREE } from './three'
import { hideTimer, runTimer, showBigToast, showSubToast } from './ui-controller'

class SelectedPawnController {
	public pawn?: Pawn
	public mesh1: THREE.Mesh
	public mesh2: THREE.Mesh
	private animationStep = 0.02
	private material = commonMaterials[MaterialType.EnchantedItem]

	constructor(scene: THREE.Scene) {
		const offset1 = .1
		const box1 = new THREE.BoxGeometry(PAWN_SIZE + offset1, PAWN_HEIGHT + offset1, PAWN_SIZE + offset1)
		const offset2 = offset1 * 2
		const box2 = new THREE.BoxGeometry(PAWN_HEIGHT + offset2, PAWN_SIZE + offset2, PAWN_SIZE + offset2)
		for (const face of box1.faceVertexUvs[0])
			for (const uv of face) {
				uv.x /= 4
				uv.y /= 4
			}
		for (const face of box2.faceVertexUvs[0])
			for (const uv of face) {
				uv.x /= 7
				uv.y /= 7
			}
		this.mesh1 = new THREE.Mesh(box1, this.material)
		this.mesh2 = new THREE.Mesh(box2, this.material)
		this.mesh2.rotateZ(-Math.PI / 2)

		this.mesh1.visible = this.mesh2.visible = false
		scene.add(this.mesh1)
		scene.add(this.mesh2)
	}

	public setSelected(pawn: Pawn | null): boolean {
		if (this.pawn === pawn)
			return false
		this.pawn = pawn
		if (this.pawn)
			this.mesh1.visible = this.mesh2.visible = true
		return true
	}

	public update() {
		if (!this.pawn) {
			if (this.material.opacity > this.animationStep)
				this.material.opacity -= this.animationStep
			else if (this.mesh1.visible) {
				this.mesh1.visible = this.mesh2.visible = false
			}
			return
		}
		if (this.material.opacity < .3)
			this.material.opacity += this.animationStep
		this.mesh1.position.copy(this.mesh2.position.copy(this.pawn.object3d.position))

		for (const face of (<THREE.Geometry>this.mesh1.geometry).faceVertexUvs[0])
			for (const uv of face) {
				uv.x -= .0018
				uv.y -= .0023
			}
		(<THREE.Geometry>this.mesh1.geometry).uvsNeedUpdate = true
		for (const face of (<THREE.Geometry>this.mesh2.geometry).faceVertexUvs[0])
			for (const uv of face) {
				uv.x -= .0007
				uv.y += .0016
			}
		(<THREE.Geometry>this.mesh2.geometry).uvsNeedUpdate = true
	}
}

export class FrontEndGameInstance {
	public readonly camera: CameraController = new CameraController()
	public readonly scene: THREE.Scene = new THREE.Scene()
	public readonly renderer: THREE.WebGLRenderer
	public readonly networking: GameNetworking = new GameNetworking()
	public readonly particles: ParticlesEngine = new ParticlesEngine(this.scene)
	readonly pawnsList: Pawn[] = []
	private readonly frameClock = new THREE.Clock()
	private readonly rayCaster = new THREE.Raycaster()
	private readonly canvas = <HTMLCanvasElement>document.getElementById('3d-game')
	private readonly renderFunction = this.render.bind(this)
	private windowHasFocus: boolean = true /*document.hasFocus()*/
	private readonly logic: GameLogic = new GameLogic()
	private readonly pawnsTable = new Table2d<Pawn>(BOARD_ITEMS_COUNT, BOARD_ITEMS_COUNT)
	private board: THREE.Object3D
	private readonly selected = new SelectedPawnController(this.scene)

	private hoverTileBox: THREE.Object3D
	private hoverPawnBox: THREE.Object3D

	private possibleMoves: PossibleMove[]
	private possibleMovesBoxes: THREE.Object3D[] = []
	private hoveredPossibleMove: THREE.Vector3 = null

	// @ts-ignore
	public constructor() {
		// @ts-ignore
		window.instance = this
		this.renderer = new THREE.WebGLRenderer({
			alpha: false,
			antialias: LIGHT_ENABLED,
			canvas: this.canvas,
			stencil: false,
			powerPreference: LIGHT_ENABLED ? 'high-performance' : 'low-power',
		})
		this.renderer.shadowMap.enabled = LIGHT_ENABLED
		this.renderer.setClearColor(0x222222)

		const listenerArgs = {passive: true}

		window.addEventListener('resize', this.updateCameraAspect.bind(this), listenerArgs)
		this.updateCameraAspect()

		window.addEventListener('focus', () => this.windowHasFocus = true, listenerArgs)
		window.addEventListener('blur', () => this.windowHasFocus = false, listenerArgs)

		// this.canvas.addEventListener('click', limitEvents(100, this.onMouseMoved.bind(this)))
		this.canvas.addEventListener('click', this.onMouseClicked.bind(this), listenerArgs)
		this.canvas.addEventListener('mousemove', this.onMouseMoved.bind(this), listenerArgs)
		this.canvas.addEventListener('touchmove', e => this.translateTouchEvent(e, e => this.onMouseMoved(e)), listenerArgs)

		this.canvas.addEventListener('touchend', e => {
			e.preventDefault()
			e.stopPropagation()
			this.translateTouchEvent(e, e => this.onMouseClicked(e))
		})

		this.setUp3dScene()

		this.networking.addEventListener('move-made', ({x, y, index, player}) => this.playMove(x, y, index, player))

		this.networking.addEventListener('move-subject-updated', (({player, expires}) => {
			if (player === 'spectator') {
				hideTimer()
			} else {
				if (player === this.networking.myType) {
					setTimeout(() => {
						showBigToast('Your move!', 1000)
					}, 1000)
				}
				runTimer(expires)
			}
		}))

		this.networking.addEventListener('game-finished', ({reason, won, lost}) => {
			if (this.networking.myType === won)
				showBigToast('You won!', 100_000)
			else if (this.networking.myType === lost)
				showBigToast('You lost!', 100_000)

			showSubToast(`Game finished: ${reason}`, 5_000)
			this.showPossibleMoves(null)
			this.selected.setSelected(null)
			hideTimer()
		})


	}

	public startGame() {
		switch (this.networking.myType) {
			case 'black':
				this.camera.startInitialAnimation(true)
				break
			case 'white':
				this.camera.startInitialAnimation(false)
				break
			case 'spectator':
				return alert('Oglądanie rozgrywki nie jest jeszcze obsługiwane')
			default:
				return alert('Nieznany typ gracza')
		}

		this.createPawns()
		requestAnimationFrame(this.renderFunction)
		this.frameClock.start()
	}

	private playMove(x: number, y: number, index: number, player: PlayerType) {
		this.hoverPawnBox.visible = this.hoverTileBox.visible = false
		this.selected.setSelected(null)
		this.showPossibleMoves(null)
		const move = this.logic.getAvailableMoves(x, y, player)[index]
		if (!move) return alert('Attempt to make undefined move!')

		const movingPawn = this.pawnsTable.get(move.from.x, move.from.y)
		if (!movingPawn) return alert('Attempt to move undefined mesh!')

		const killed: Pawn[] = []

		if (move.attackedPawns)
			for (const attacked of move.attackedPawns) {
				const p = this.pawnsTable.get(attacked.x, attacked.y)
				if (!p) return alert('Attempt to kill undefined mesh!')
				killed.push(p)
			}

		this.logic.commitMove(move)

		if (movingPawn.type !== 'king' || killed.length === 0) {
			for (const killedPawn of killed) {
				killedPawn.playDeathByPawnAnimation()
				this.pawnsTable.set(killedPawn.boardX, killedPawn.boardY, null)
			}
			movingPawn.goToPosition(move.to.x, move.to.y, move.type)
		} else {
			// king is killing other
			for (const killedPawn of killed) {
				killedPawn.playDeathByKingAnimation()
				this.pawnsTable.set(killedPawn.boardX, killedPawn.boardY, null)
			}
			const lastKill = move.attackedPawns[move.attackedPawns.length - 1]
			movingPawn.goToPositionAfterKilling(move.to.x, move.to.y, lastKill.x, lastKill.y)
		}

		this.pawnsTable.swap(move.from.x, move.from.y, move.to.x, move.to.y)

		if (move.upgradeToKingAfterMove)
			movingPawn.upgradeToKing()

		if (move.hasContinuation && player === this.networking.myType) {
			showSubToast('Continue with the same pawn', 2000)
			setTimeout(() => this.selectPawnIfRequired(true), 1000)
		}
	}

	private getTileByMousePointer({offsetX, offsetY}) {
		const x = offsetX / this.canvas.width * window.devicePixelRatio * 2 - 1
		const y = offsetY / this.canvas.height * window.devicePixelRatio * -2 + 1

		this.rayCaster.setFromCamera({x, y}, this.camera.raw)
		const result = []
		this.rayCaster.intersectObject(this.board, false, result)

		if (result.length > 0) {
			const point = result[0].point
			const indexX = (point.x + TILE_SIZE * BOARD_ITEMS_COUNT / 2) / TILE_SIZE | 0
			const indexZ = (point.z + TILE_SIZE * BOARD_ITEMS_COUNT / 2) / TILE_SIZE | 0
			if (this.pawnsTable.isIndexValid(indexX, indexZ))
				return {
					point,
					indexX,
					indexZ,
					pawn: this.pawnsTable.get(indexX, indexZ),
					move: (this.possibleMoves ? (this.possibleMoves.find(e => e.to.x === indexX && e.to.y === indexZ)) : null),
				}
		}
		return null
	}

	private selectPawnIfRequired(forceHideMessage: boolean = false) {
		if (this.networking.isMyTurn && this.logic.continuationEntry) {
			const tile = this.pawnsTable.get(this.logic.continuationEntry.x, this.logic.continuationEntry.y)
			if (!tile) alert('Unable to select required pawn')
			else if (this.selected.setSelected(tile)) {
				this.showPossibleMoves(this.logic.getAvailableMoves(tile.boardX, tile.boardY, tile.player))
				if (!forceHideMessage)
					showSubToast('Use again this pawn', 1000)
			}
			return true
		}
		return false
	}

	private onMouseClicked(event: MouseEvent) {
		if (!this.networking.isMyTurn) {
			showSubToast('Wait for your move')
		} else {
			const result = this.getTileByMousePointer(event)
			if (result !== null) {
				if (result.move) {
					this.networking.requestMovement(result.move.from.x, result.move.from.y, this.possibleMoves.indexOf(result.move))
						.then(ok => ok || showBigToast('Cannot make this move'))

				} else if (result.pawn) {
					if (this.selectPawnIfRequired()) return
					if (result.pawn.player === this.networking.myType) {
						this.selected.setSelected(result.pawn)
						this.showPossibleMoves(this.logic.getAvailableMoves(result.pawn.boardX, result.pawn.boardY, this.networking.myType))
						return
					} else {
						const pos = result.pawn.object3d.position
						const spread = TILE_SIZE / 2
						for (let i = 0; i < 3; i++) {
							this.particles.angry.spawn(
								pos.x + THREE.MathUtils.randFloat(-spread, spread),
								pos.y + THREE.MathUtils.randFloat(-spread, spread),
								pos.z + THREE.MathUtils.randFloat(-spread, spread),
								Date.now() + THREE.MathUtils.randFloat(400, 2000),
							)
						}
					}
				}
			}
			if (this.selectPawnIfRequired()) return
		}

		this.selected.setSelected(null)
		this.showPossibleMoves(null)
	}

	private translateTouchEvent(event: any, call: (event: any) => void) {
		const touch = event.touches[0] || event.changedTouches[0]
		if (touch) {
			call({
				offsetX: (touch.pageX - (<HTMLElement>this.canvas).offsetLeft) * window.devicePixelRatio,
				offsetY: (touch.pageY - (<HTMLElement>this.canvas).offsetTop) * window.devicePixelRatio,
			})
		}
	}

	private onMouseMoved(event: { offsetX, offsetY }) {
		if (!this.windowHasFocus && !RENDER_IF_NOT_FOCUS || !this.board) return

		const result = this.networking.isMyTurn ? this.getTileByMousePointer(event) : null
		if (result) {
			if (result.pawn) {
				if (result.pawn.player !== this.networking.myType) {
					this.hoverPawnBox.visible = this.hoverTileBox.visible = false
					return
				}
				this.hoveredPossibleMove = null
				this.hoverPawnBox.visible = true
				this.hoverTileBox.visible = false

				this.hoverPawnBox.position.set(
					pawnIndexToPosition(result.indexX),
					DEFAULT_PAWN_Y + .5,
					pawnIndexToPosition(result.indexZ),
				)
				this.hoverPawnBox.updateMatrix()
			} else if (result.move) {
				this.hoverPawnBox.visible = false
				this.hoverTileBox.visible = false
				this.hoveredPossibleMove = new THREE.Vector3(
					pawnIndexToPosition(result.move.to.x),
					DEFAULT_PAWN_Y,
					pawnIndexToPosition(result.move.to.y),
				)
			} else {
				this.hoveredPossibleMove = null
				this.hoverPawnBox.visible = false
				this.hoverTileBox.visible = true
				this.hoverTileBox.position.set(
					pawnIndexToPosition(result.indexX),
					PAWN_HEIGHT * 1.5 / 2 + .5,
					pawnIndexToPosition(result.indexZ),
				)
				this.hoverTileBox.updateMatrix()
			}
		} else {
			this.hoverPawnBox.visible = this.hoverTileBox.visible = false
		}

	}

	private showPossibleMoves(moves: PossibleMove[] | null) {
		this.hoveredPossibleMove = null
		for (const m of this.possibleMovesBoxes)
			m.visible = false

		this.possibleMoves = moves

		if (moves) {
			let i = 0
			for (const move of moves) {
				let lines = this.possibleMovesBoxes[i++]
				if (!lines) {
					lines = new THREE.LineSegments(pawnEdgesGeometry, commonMaterials[MaterialType.BoxOutline])
					lines.matrixAutoUpdate = false
					this.scene.add(lines)
					this.possibleMovesBoxes.push(lines)
				}
				lines.visible = true
				lines.position.set(
					pawnIndexToPosition(move.to.x),
					DEFAULT_PAWN_Y,
					pawnIndexToPosition(move.to.y),
				)
				lines.updateMatrix()
			}
		}
	}

	private createPawns() {
		this.pawnsTable.forEach(c => c && this.scene.remove(c.object3d))
		this.pawnsTable.fill(() => null)


		this.logic.board.forEach(element => {
			if (element.pawn !== 'none') {
				const pawn = new Pawn(this, element.pawn, element.player, element.x, element.y)
				this.scene.add(pawn.object3d)
				this.pawnsTable.set(element.x, element.y, pawn)
				this.pawnsList.push(pawn)
			}
		})
	}

	private setUp3dScene() {

		this.scene.add(this.board = getBoardMesh())

		const lantern = getLanternMesh()
		lantern.position.y = 48
		this.scene.add(lantern)

		if (LIGHT_ENABLED) {
			const l = new THREE.PointLight(0xffffff, 1.5, 300, 2)
			l.position.set(0, lantern.position.y + 2, 0)
			l.castShadow = true
			this.scene.add(l)
			this.scene.add(new THREE.AmbientLight(0xFFFFFF, .3))
			// this.scene.add(new THREE.PointLightHelper(l))
		}


		{
			this.hoverPawnBox = new THREE.LineSegments(pawnEdgesGeometry, commonMaterials[MaterialType.BoxOutline])
			this.scene.add(this.hoverPawnBox)
		}
		{
			const blockGeometry = new THREE.BoxBufferGeometry(TILE_SIZE, PAWN_HEIGHT * 1.5, TILE_SIZE)
			const edges = new THREE.EdgesGeometry(blockGeometry)

			this.hoverTileBox = new THREE.LineSegments(edges, commonMaterials[MaterialType.BoxOutline])
			this.scene.add(this.hoverTileBox)
		}
		this.hoverPawnBox.visible = this.hoverTileBox.visible = false
		this.hoverPawnBox.matrixAutoUpdate = this.hoverTileBox.matrixAutoUpdate = false
	}

	private updateCameraAspect() {
		const multiplier = window.devicePixelRatio
		// const rect = this.canvas.getBoundingClientRect()
		const w = window.innerWidth //- 2 * window.devicePixelRatio
		const h = window.innerHeight * .90
		this.camera.aspect = w / h
		this.renderer.setSize(w * multiplier | 0,
			h * multiplier | 0, false)
		this.canvas.style.width = `${w}px`
		this.canvas.style.height = `${h}px`
		this.canvas.width = w * multiplier
		this.canvas.height = h * multiplier
	}

	private render() {
		if (this.windowHasFocus || RENDER_IF_NOT_FOCUS) {
			const delta = this.frameClock.getDelta()
			const elapsedTime = this.frameClock.getElapsedTime()

			this.pawnsList.forEach(it => it.update(delta, elapsedTime))
			// this.pawnsTable.forEach(it => {
			// 	if (!it) return
			// 	it.update(delta, elapsedTime)
			// })

			this.particles.doFrame()
			this.camera.doFrame()

			this.selected.update()

			if (this.hoveredPossibleMove && Math.random() > .95) {
				this.particles.glint.spawn(
					this.hoveredPossibleMove.x + THREE.MathUtils.randFloat(-10, 10),
					this.hoveredPossibleMove.y + THREE.MathUtils.randFloat(0, 10),
					this.hoveredPossibleMove.z + THREE.MathUtils.randFloat(-10, 10),
					Date.now() + Math.random() * 1000 + 2000,
				)
			}

			this.renderer.render(this.scene, this.camera.raw)
		}
		requestAnimationFrame(this.renderFunction)
	}

}

