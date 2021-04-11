import { DoubleJumpInterpolator, FrameAnimation, LinearInterpolator, SmoothInterpolator } from './frame-animation';
import { commonMaterials } from './globals-3d';
import { EndCrystal } from './models/end-crystal';
import { EndCrystalBeam } from './models/end-crystal-beam';
import { BOARD_SIZE, FAST_TEST_ENABLED, TILE_SIZE } from './shared';
import { THREE } from './three';
export const PAWN_SIZE = TILE_SIZE * .75;
export const PAWN_HEIGHT = TILE_SIZE * .4;
const pawnGeometry = new THREE.BoxBufferGeometry(PAWN_SIZE, PAWN_HEIGHT, PAWN_SIZE);
export const pawnEdgesGeometry = new THREE.EdgesGeometry(new THREE.BoxBufferGeometry(PAWN_SIZE + 0.5, PAWN_HEIGHT - 1, PAWN_SIZE + 0.5));
export const DEFAULT_PAWN_Y = PAWN_HEIGHT / 2;
export const pawnIndexToPosition = (index) => TILE_SIZE / 2 + index * TILE_SIZE - TILE_SIZE * BOARD_SIZE / 2;
export class Pawn {
    constructor(game, type, player, _boardX, _boardY) {
        this.game = game;
        this.type = type;
        this.player = player;
        this._boardX = _boardX;
        this._boardY = _boardY;
        this.crystal = null;
        this.beam = null;
        let materialIndex;
        switch (type) {
            case 'king':
            case 'pawn':
                materialIndex = {
                    ['black']: materialIndex = 6 /* BlackPawn */,
                    ['white']: materialIndex = 4 /* WhitePawn */,
                }[player];
                break;
        }
        const material = commonMaterials[materialIndex];
        if (!material)
            throw new Error(`Unable to find material for pawn type ${type} and color ${player}`);
        const mesh = new THREE.Mesh(pawnGeometry, material);
        mesh.position.set(pawnIndexToPosition(_boardX), DEFAULT_PAWN_Y, pawnIndexToPosition(_boardY));
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.matIndex = materialIndex;
        mesh.matrixAutoUpdate = false;
        mesh.updateMatrix();
        this.object3d = mesh;
        if (type === 'king') {
            this.type = 'pawn';
            this.upgradeToKing();
        }
    }
    get boardX() {
        return this._boardX;
    }
    get boardY() {
        return this._boardY;
    }
    goToPosition(boardX, boardY, movementType) {
        const start = new THREE.Vector3(pawnIndexToPosition(this.boardX), DEFAULT_PAWN_Y, pawnIndexToPosition(this.boardY));
        const end = new THREE.Vector3(pawnIndexToPosition(boardX), DEFAULT_PAWN_Y + (PAWN_HEIGHT * (movementType !== 'movement' ? 3 : 2)), pawnIndexToPosition(boardY));
        this._boardX = boardX;
        this._boardY = boardY;
        const useDoubleJumpAnimation = movementType === 'attack';
        new FrameAnimation(1000, progress => {
            const offsetWithComeBack = SmoothInterpolator(progress * 2) * 0.5;
            // this.object3d.position.y = start.y + (end.y - start.y) * offsetWithComeBack
            // this.object3d.position.y = start.y + (end.y - start.y) * DoubleJumpInterpolator(progress)
            this.object3d.position.y = start.y + (end.y - start.y) * (useDoubleJumpAnimation ? DoubleJumpInterpolator(progress) : offsetWithComeBack);
            const smooth = SmoothInterpolator(progress);
            this.object3d.position.x = start.x + (end.x - start.x) * smooth;
            this.object3d.position.z = start.z + (end.z - start.z) * smooth;
            const rotationValue = Math.PI * offsetWithComeBack * 0.3;
            this.object3d.rotation.z = -Math.sign(end.x - start.x) * rotationValue;
            this.object3d.rotation.x = Math.sign(end.z - start.z) * rotationValue;
            this.object3d.updateMatrix();
        }, LinearInterpolator).start();
    }
    goToPositionAfterKilling(destinationX, destinationY, lastKillX, lastKillY) {
        const oldX = this._boardX;
        const oldY = this._boardY;
        this._boardX = destinationX;
        this._boardY = destinationY;
        if (!this.beam) {
            this.beam = new EndCrystalBeam();
            this.object3d.add(this.beam);
        }
        this.beam.updateBeamDirection(new THREE.Vector3(pawnIndexToPosition(lastKillX), 0, pawnIndexToPosition(lastKillY)));
        setTimeout(() => {
            this._boardX = oldX;
            this._boardY = oldY;
            this.goToPosition(destinationX, destinationY, 'movement');
            this.object3d.remove(this.beam);
            this.beam = null;
        }, 2000);
    }
    playDeathByPawnAnimation(instant = false) {
        const attackedMesh = this.object3d;
        setTimeout(() => {
            new FrameAnimation(500, value => {
                // attackedMesh.position.y = start.y - TILE_SIZE * value * value
                attackedMesh.rotation.z = Math.PI * value * .5;
                attackedMesh.updateMatrix();
            }).start();
            // @ts-ignore
            attackedMesh.material = commonMaterials[attackedMesh.userData.matIndex + 1];
            setTimeout(() => {
                // @ts-ignore
                attackedMesh.material = commonMaterials[attackedMesh.userData.matIndex];
            }, 250);
        }, instant ? 0 : 500);
        const spawnParticlesLocationX = attackedMesh.position.x;
        const spawnParticlesLocationZ = attackedMesh.position.z;
        setTimeout(() => {
            this.game.pawnsList.splice(this.game.pawnsList.indexOf(this), 1);
            this.game.scene.remove(attackedMesh);
            const count = Math.random() * 10 + 10;
            for (let i = 0; i < count; i++) {
                this.game.particles.poof.spawn(spawnParticlesLocationX + THREE.MathUtils.randFloat(-TILE_SIZE, TILE_SIZE), THREE.MathUtils.randFloat(-10, TILE_SIZE), spawnParticlesLocationZ + THREE.MathUtils.randFloat(-TILE_SIZE, TILE_SIZE), 0);
            }
        }, instant ? 500 : 1000);
    }
    playDeathByKingAnimation() {
        this.isGeneratingFlames = true;
        setTimeout(() => {
            const damageAnimation = new FrameAnimation(300, value => {
                this.object3d.rotation.z = (1 - value) * Math.PI / 6;
                this.object3d.updateMatrix();
            }, LinearInterpolator, null, () => {
                const obj = this.object3d;
                obj.material = commonMaterials[obj.userData.matIndex + 1];
                setTimeout(() => {
                    obj.material = commonMaterials[obj.userData.matIndex];
                }, 100);
            });
            damageAnimation.start();
            setTimeout(() => damageAnimation.start(), 300);
            setTimeout(() => damageAnimation.start(), 700);
            setTimeout(() => damageAnimation.start(), 1100);
            setTimeout(() => this.playDeathByPawnAnimation(true), 1500);
        }, Math.random() * 400);
    }
    upgradeToKing() {
        if (this.type !== 'pawn')
            return console.warn('Unable to upgrade, invalid current type', this.type);
        this.type = 'king';
        setTimeout(() => {
            const x = this.object3d.position.x;
            const z = this.object3d.position.z;
            new FrameAnimation(FAST_TEST_ENABLED ? 0 : 2000, value => {
                this.game.particles.glint.spawn(x + THREE.MathUtils.randFloat(-10, +10), DEFAULT_PAWN_Y + Math.random() * 10, z + THREE.MathUtils.randFloat(-10, +10), Date.now() + Math.random() * 2000);
                value = 1 + value * .5;
                this.object3d.scale.set(value, value, value);
                this.object3d.updateMatrix();
            }, null, () => {
                this.object3d.scale.set(1, 1, 1);
                this.object3d.updateMatrix();
                const x = this.object3d.position.x;
                const z = this.object3d.position.z;
                for (let i = 0; i < 100; i++)
                    this.game.particles.poof.spawn(x + THREE.MathUtils.randFloat(-TILE_SIZE, TILE_SIZE), DEFAULT_PAWN_Y + Math.random() * TILE_SIZE * 1.5, z + THREE.MathUtils.randFloat(-TILE_SIZE, TILE_SIZE), 0);
                this.crystal = new EndCrystal();
                this.object3d.add(this.crystal);
            }).start();
        }, 1000);
    }
    update(delta, elapsedTime) {
        if (this.crystal !== null)
            this.crystal.update(delta, elapsedTime);
        if (this.beam !== null)
            this.beam.update(delta, elapsedTime);
        if (this.isGeneratingFlames) {
            const pos = this.object3d.position;
            const spread = TILE_SIZE * .5;
            this.game.particles.flame.spawn(pos.x + THREE.MathUtils.randFloat(-spread, spread), pos.y + THREE.MathUtils.randFloat(-spread, spread), pos.z + THREE.MathUtils.randFloat(-spread, spread), Date.now() + Math.random() * 5000);
        }
    }
}
