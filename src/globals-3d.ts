import { THREE } from './three'

const windowOptions = location.hash.split('#')

export const LIGHT_ENABLED: boolean = !windowOptions.includes('no-light')

export const RENDER_IF_NOT_FOCUS: boolean = !windowOptions.includes('pause-on-blur')

export const textureLoader = new THREE.TextureLoader()

export const enum MaterialType {
	TopLight,
	TopDark,
	SideLight,
	SideDark,
	WhitePawn,
	AttackedWhitePawn,
	BlackPawn,
	AttackedBlackPawn,
	Lantern,
	GlintParticle,
	AngryParticle,
	EnchantedItem,
	BoxOutline,
	EndCrystalCore,
	EndCrystalFrame,
	EndCrystalBeam,
	FlameParticle,
}

export const commonMaterials: THREE.Material[] = []
export const poofMaterials: THREE.Material[] = []

const loadPixelatedTexture = (url: string): THREE.Texture => {
	const t = textureLoader.load(`res/${url}.png`)
	t.magFilter = THREE.NearestFilter
	t.minFilter = THREE.NearestFilter
	// t.wrapS = THREE.RepeatWrapping
	// t.wrapT = THREE.RepeatWrapping
	return t
}

function loadMaterials() {
	if (commonMaterials.length) return

	const fileNames = []
	fileNames[MaterialType.TopLight] = 'stripped_oak_log_top'
	fileNames[MaterialType.TopDark] = 'stripped_dark_oak_log_top'
	fileNames[MaterialType.SideLight] = 'stripped_oak_log'
	fileNames[MaterialType.SideDark] = 'stripped_dark_oak_log'
	fileNames[MaterialType.BlackPawn] = 'coal_block'
	fileNames[MaterialType.WhitePawn] = 'iron_block'
	fileNames[MaterialType.EndCrystalCore] = 'end_crystal_inside'
	fileNames[MaterialType.EndCrystalFrame] = 'end_crystal_glass'

	const materialType = LIGHT_ENABLED ? THREE.MeshStandardMaterial : THREE.MeshBasicMaterial

	for (let index in fileNames) {
		if (fileNames[index])
			commonMaterials[index] =
				new materialType({
					map: loadPixelatedTexture(fileNames[index]),
				})
	}

	const beamMaterial = commonMaterials[MaterialType.EndCrystalBeam] = new THREE.MeshBasicMaterial({
		map: loadPixelatedTexture('end_crystal_beam'),
		transparent: true,
		side: THREE.DoubleSide
	})
	beamMaterial.map.wrapT = beamMaterial.map.wrapS = THREE.RepeatWrapping

	commonMaterials[MaterialType.EndCrystalFrame].transparent = true
	commonMaterials[MaterialType.EndCrystalFrame].side = THREE.DoubleSide

	commonMaterials[MaterialType.Lantern] = new THREE.MeshBasicMaterial({
		map: loadPixelatedTexture('lantern'),
	})

	const enchantedItem = commonMaterials[MaterialType.EnchantedItem] = new THREE.MeshBasicMaterial({
		map: loadPixelatedTexture('enchanted_item_glint'),
		transparent: true,
		opacity: .3,
		depthWrite: false,
	})
	enchantedItem.map.wrapT = THREE.MirroredRepeatWrapping
	enchantedItem.map.wrapS = THREE.MirroredRepeatWrapping
	enchantedItem.map.minFilter = enchantedItem.map.magFilter = THREE.LinearFilter

	commonMaterials[MaterialType.AttackedBlackPawn] = commonMaterials[MaterialType.BlackPawn].clone()
	commonMaterials[MaterialType.AttackedWhitePawn] = commonMaterials[MaterialType.WhitePawn].clone()


	const attacked = <THREE.MeshBasicMaterial>commonMaterials[MaterialType.AttackedBlackPawn]
	attacked.map = loadPixelatedTexture('red_coal_block')

	const redOverlayColor = 0xFF7777

	// @ts-ignore
	commonMaterials[MaterialType.AttackedWhitePawn].color.setHex(redOverlayColor)

	const createParticleMaterial = (textureName: string, size: number): THREE.PointsMaterial => {
		return new THREE.PointsMaterial({
			// blending: THREE.AdditiveBlending,
			transparent: true,
			size: size,
			sizeAttenuation: true,
			depthTest: true,
			map: loadPixelatedTexture(`particle/${textureName}`),
		})
	}

	for (let i = 0; i < 8; i++)
		poofMaterials.push(createParticleMaterial(`generic_${i}`, 8))


	commonMaterials[MaterialType.GlintParticle] = createParticleMaterial('glint', 4)
	commonMaterials[MaterialType.AngryParticle] = createParticleMaterial('angry', 4)
	commonMaterials[MaterialType.FlameParticle] = createParticleMaterial('flame', 4)

	commonMaterials[MaterialType.BoxOutline] = new THREE.LineBasicMaterial({
		linewidth: 3,
		depthTest: true,
		color: 0x000000,
	})
}

loadMaterials()
