import { THREE } from './three';
const windowOptions = location.hash.split('#');
export const LIGHT_ENABLED = !windowOptions.includes('no-light');
export const RENDER_IF_NOT_FOCUS = !windowOptions.includes('pause-on-blur');
export const textureLoader = new THREE.TextureLoader();
export const commonMaterials = [];
export const poofMaterials = [];
const loadPixelatedTexture = (url) => {
    const t = textureLoader.load(`res/${url}.png`);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    // t.wrapS = THREE.RepeatWrapping
    // t.wrapT = THREE.RepeatWrapping
    return t;
};
function loadMaterials() {
    if (commonMaterials.length)
        return;
    const fileNames = [];
    fileNames[0 /* TopLight */] = 'stripped_oak_log_top';
    fileNames[1 /* TopDark */] = 'stripped_dark_oak_log_top';
    fileNames[2 /* SideLight */] = 'stripped_oak_log';
    fileNames[3 /* SideDark */] = 'stripped_dark_oak_log';
    fileNames[6 /* BlackPawn */] = 'coal_block';
    fileNames[4 /* WhitePawn */] = 'iron_block';
    fileNames[13 /* EndCrystalCore */] = 'end_crystal_inside';
    fileNames[14 /* EndCrystalFrame */] = 'end_crystal_glass';
    const materialType = LIGHT_ENABLED ? THREE.MeshStandardMaterial : THREE.MeshBasicMaterial;
    for (let index in fileNames) {
        if (fileNames[index])
            commonMaterials[index] =
                new materialType({
                    map: loadPixelatedTexture(fileNames[index]),
                });
    }
    const beamMaterial = commonMaterials[15 /* EndCrystalBeam */] = new THREE.MeshBasicMaterial({
        map: loadPixelatedTexture('end_crystal_beam'),
        transparent: true,
        side: THREE.DoubleSide
    });
    beamMaterial.map.wrapT = beamMaterial.map.wrapS = THREE.RepeatWrapping;
    commonMaterials[14 /* EndCrystalFrame */].transparent = true;
    commonMaterials[14 /* EndCrystalFrame */].side = THREE.DoubleSide;
    commonMaterials[8 /* Lantern */] = new THREE.MeshBasicMaterial({
        map: loadPixelatedTexture('lantern'),
    });
    const enchantedItem = commonMaterials[11 /* EnchantedItem */] = new THREE.MeshBasicMaterial({
        map: loadPixelatedTexture('enchanted_item_glint'),
        transparent: true,
        opacity: .3,
        depthWrite: false,
    });
    enchantedItem.map.wrapT = THREE.MirroredRepeatWrapping;
    enchantedItem.map.wrapS = THREE.MirroredRepeatWrapping;
    enchantedItem.map.minFilter = enchantedItem.map.magFilter = THREE.LinearFilter;
    commonMaterials[7 /* AttackedBlackPawn */] = commonMaterials[6 /* BlackPawn */].clone();
    commonMaterials[5 /* AttackedWhitePawn */] = commonMaterials[4 /* WhitePawn */].clone();
    const attacked = commonMaterials[7 /* AttackedBlackPawn */];
    attacked.map = loadPixelatedTexture('red_coal_block');
    const redOverlayColor = 0xFF7777;
    // @ts-ignore
    commonMaterials[5 /* AttackedWhitePawn */].color.setHex(redOverlayColor);
    const createParticleMaterial = (textureName, size) => {
        return new THREE.PointsMaterial({
            // blending: THREE.AdditiveBlending,
            transparent: true,
            size: size,
            sizeAttenuation: true,
            depthTest: true,
            map: loadPixelatedTexture(`particle/${textureName}`),
        });
    };
    for (let i = 0; i < 8; i++)
        poofMaterials.push(createParticleMaterial(`generic_${i}`, 8));
    commonMaterials[9 /* GlintParticle */] = createParticleMaterial('glint', 4);
    commonMaterials[10 /* AngryParticle */] = createParticleMaterial('angry', 4);
    commonMaterials[16 /* FlameParticle */] = createParticleMaterial('flame', 4);
    commonMaterials[12 /* BoxOutline */] = new THREE.LineBasicMaterial({
        linewidth: 3,
        depthTest: true,
        color: 0x000000,
    });
}
loadMaterials();
