import { commonMaterials } from '../globals-3d';
import { THREE } from '../three';
const mainMaterial = commonMaterials[8 /* Lantern */];
const hangingMaterial = mainMaterial.clone();
hangingMaterial.transparent = true;
hangingMaterial.side = THREE.DoubleSide;
const finalMaterials = [mainMaterial, hangingMaterial];
let cachedGeometry;
const createBottomPart = () => {
    const g = new THREE.Geometry();
    // bottom
    let normal = new THREE.Vector3(0, -1, 0);
    g.vertices.push(new THREE.Vector3(-3, 0, -3), new THREE.Vector3(-3, 0, 3), new THREE.Vector3(3, 0, 3), new THREE.Vector3(3, 0, -3));
    g.faces.push(new THREE.Face3(2, 1, 0, normal), new THREE.Face3(0, 3, 2, normal));
    //top
    normal = new THREE.Vector3(0, 1, 0);
    g.vertices.push(new THREE.Vector3(-3, 7, -3), new THREE.Vector3(-3, 7, 3), new THREE.Vector3(3, 7, 3), new THREE.Vector3(3, 7, -3));
    g.faces.push(new THREE.Face3(4, 5, 6, normal), new THREE.Face3(6, 7, 4, normal));
    // bottom/top UV
    g.faceVertexUvs[0].push([new THREE.Vector2(0, 1 / 16), new THREE.Vector2(0, 7 / 16), new THREE.Vector2(6 / 16, 7 / 16)], [new THREE.Vector2(0, 1 / 16), new THREE.Vector2(0, 7 / 16), new THREE.Vector2(6 / 16, 7 / 16)], [new THREE.Vector2(0, 1 / 16), new THREE.Vector2(0, 7 / 16), new THREE.Vector2(6 / 16, 7 / 16)], [new THREE.Vector2(0, 1 / 16), new THREE.Vector2(0, 7 / 16), new THREE.Vector2(6 / 16, 7 / 16)]);
    //sides
    normal = new THREE.Vector3(-1., 0, 0);
    g.faces.push(new THREE.Face3(0, 1, 4, normal), new THREE.Face3(4, 1, 5, normal));
    normal = new THREE.Vector3(0, 0, 1);
    g.faces.push(new THREE.Face3(1, 2, 5, normal), new THREE.Face3(5, 2, 6, normal));
    normal = new THREE.Vector3(1, 0, 0);
    g.faces.push(new THREE.Face3(2, 3, 6, normal), new THREE.Face3(6, 3, 7, normal));
    normal = new THREE.Vector3(0, 0, -1);
    g.faces.push(new THREE.Face3(3, 0, 7, normal), new THREE.Face3(7, 0, 4, normal));
    const uvVectors1 = [new THREE.Vector2(0, 14 / 16), new THREE.Vector2(6 / 16, 14 / 16), new THREE.Vector2(0, 7 / 16)];
    const uvVectors2 = [new THREE.Vector2(0, 7 / 16), new THREE.Vector2(6 / 16, 14 / 16), new THREE.Vector2(6 / 16, 7 / 16)];
    for (let i = 0; i < 4; i++) {
        g.faceVertexUvs[0].push(uvVectors1, uvVectors2);
    }
    return g;
};
const addTopPart = (g) => {
    const vertexesStart = g.vertices.length;
    // bottom
    let normal;
    g.vertices.push(new THREE.Vector3(-2, 7, -2), new THREE.Vector3(-2, 7, 2), new THREE.Vector3(2, 7, 2), new THREE.Vector3(2, 7, -2));
    //top
    normal = new THREE.Vector3(0, 1, 0);
    g.vertices.push(new THREE.Vector3(-2, 9, -2), new THREE.Vector3(-2, 9, 2), new THREE.Vector3(2, 9, 2), new THREE.Vector3(2, 9, -2));
    g.faces.push(new THREE.Face3(vertexesStart + 4, vertexesStart + 5, vertexesStart + 6, normal), new THREE.Face3(vertexesStart + 6, vertexesStart + 7, vertexesStart + 4, normal));
    // top/bottom UV
    g.faceVertexUvs[0].push([new THREE.Vector2(1 / 16, 2 / 16), new THREE.Vector2(1 / 16, 6 / 16), new THREE.Vector2(5 / 16, 6 / 16)], [new THREE.Vector2(1 / 16, 2 / 16), new THREE.Vector2(1 / 16, 6 / 16), new THREE.Vector2(5 / 16, 6 / 16)]);
    //sides
    normal = new THREE.Vector3(-1, 0, 0);
    g.faces.push(new THREE.Face3(vertexesStart, vertexesStart + 1, vertexesStart + 4, normal), new THREE.Face3(vertexesStart + 4, vertexesStart + 1, vertexesStart + 5, normal));
    normal = new THREE.Vector3(0, 0, 1);
    g.faces.push(new THREE.Face3(vertexesStart + 1, vertexesStart + 2, vertexesStart + 5, normal), new THREE.Face3(vertexesStart + 5, vertexesStart + 2, vertexesStart + 6, normal));
    normal = new THREE.Vector3(1, 0, 0);
    g.faces.push(new THREE.Face3(vertexesStart + 2, vertexesStart + 3, vertexesStart + 6, normal), new THREE.Face3(vertexesStart + 6, vertexesStart + 3, vertexesStart + 7, normal));
    normal = new THREE.Vector3(0, 0, -1);
    g.faces.push(new THREE.Face3(vertexesStart + 3, vertexesStart + 0, vertexesStart + 7, normal), new THREE.Face3(vertexesStart + 7, vertexesStart + 0, vertexesStart + 4, normal));
    // ld pd lg
    const uvVectors1 = [new THREE.Vector2(1 / 16, 14 / 16), new THREE.Vector2(5 / 16, 14 / 16), new THREE.Vector2(1 / 16, 16 / 16)];
    const uvVectors2 = [new THREE.Vector2(1 / 16, 16 / 16), new THREE.Vector2(5 / 16, 14 / 16), new THREE.Vector2(5 / 16, 16 / 16)];
    for (let i = 0; i < 4; i++) {
        g.faceVertexUvs[0].push(uvVectors1, uvVectors2);
    }
};
const addHangingPart = (g) => {
    const vertexesStart = g.vertices.length;
    const normal = new THREE.Vector3(0, 1, 0);
    g.vertices.push(new THREE.Vector3(-2, 11, -2), new THREE.Vector3(-2, 11, 2), new THREE.Vector3(2, 11, 2), new THREE.Vector3(2, 11, -2));
    g.faces.push(new THREE.Face3(vertexesStart - 4, vertexesStart - 2, vertexesStart, normal, null, 1));
    g.faces.push(new THREE.Face3(vertexesStart, vertexesStart - 2, vertexesStart + 2, normal, null, 1));
    g.faces.push(new THREE.Face3(vertexesStart - 3, vertexesStart - 1, vertexesStart + 1, normal, null, 1));
    g.faces.push(new THREE.Face3(vertexesStart + 1, vertexesStart - 1, vertexesStart + 3, normal, null, 1));
    const uvVertexes1 = [new THREE.Vector2(10 / 16, 4 / 16), new THREE.Vector2(15 / 16, 4 / 16), new THREE.Vector2(10 / 16, 6 / 16)];
    const uvVertexes2 = [new THREE.Vector2(10 / 16, 6 / 16), new THREE.Vector2(15 / 16, 4 / 16), new THREE.Vector2(15 / 16, 6 / 16)];
    g.faceVertexUvs[0].push(uvVertexes1, uvVertexes2, uvVertexes1, uvVertexes2);
};
const buildGeometry = () => {
    if (cachedGeometry)
        return cachedGeometry;
    // const g = new THREE.Geometry()
    const g = createBottomPart();
    addTopPart(g);
    addHangingPart(g);
    cachedGeometry = new THREE.BufferGeometry().fromGeometry(g);
    g.dispose();
    return cachedGeometry;
};
export const getLanternMesh = () => {
    return new THREE.Mesh(buildGeometry(), finalMaterials);
};
