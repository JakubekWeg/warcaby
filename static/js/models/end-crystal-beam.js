import { commonMaterials } from '../globals-3d';
import { TILE_SIZE } from '../shared';
import { THREE } from '../three';
const HEIGHT = 250;
const RADIUS = 5;
const geometry = new THREE
    .CylinderGeometry(RADIUS, RADIUS, HEIGHT, 8, 1, true);
for (let vertex of geometry.vertices) {
    vertex.y += HEIGHT / 2;
}
export class EndCrystalBeam extends THREE.Mesh {
    constructor() {
        super(geometry, commonMaterials[15 /* EndCrystalBeam */]);
        this.position.y = RADIUS;
    }
    updateBeamDirection(position) {
        this.lookAt(position);
        this.rotation.z = Math.PI / 2;
        this.rotation.y += Math.PI / 2;
    }
    update(delta, elapsedTime) {
        for (const face of geometry.faceVertexUvs[0]) {
            face[0].x += .005;
            face[1].x += .005;
            face[2].x += .005;
            face[0].y += .005;
            face[1].y += .005;
            face[2].y += .005;
        }
        geometry.uvsNeedUpdate = true;
        this.position.y = TILE_SIZE + Math.sin(elapsedTime * Math.PI * 1.2) * 5;
    }
}
