import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    Material,
    ShaderMaterial,
    MeshStandardMaterial,
    MeshNormalMaterial,
    NearestFilter,
    PlaneGeometry,
    SphereGeometry,
    TextureLoader,
    DoubleSide,
    Vector3,
    Sphere,
    MathUtils,
    UniformsUtils,
    UniformsLib,
    Matrix4,
    SRGBColorSpace,
    MeshBasicMaterial,
} from "three";
import {CompositeGeometry} from "./compositeGeometry";
import {BlockPos} from "../positions/blockPos";
import Buffer from "three/src/renderers/common/Buffer.js";
import {SimplexNoise} from "three/examples/jsm/Addons.js";
import grassVertexShader from '../shaders/grassVertexShader.glsl?raw';
import grassFragmentShader from '../shaders/grassFragmentShader.glsl?raw';
import waterVertexShader from '../shaders/waterVertexShader.glsl?raw';
import waterFragmentShader from '../shaders/waterFragmentShader.glsl?raw';

export abstract class CubeMesh {
    protected static readonly planeMatrices: Matrix4[] = [];
    protected static readonly materialCache = new Map<string, MeshStandardMaterial>;
    protected static readonly textureLoader = new TextureLoader();
    protected static readonly planeGeometry: PlaneGeometry = new PlaneGeometry(1, 1);

    public readonly transparent: boolean;

    static {
        if (CubeMesh.planeMatrices.length === 0) {
            const translation = new Matrix4();
            const rotation = new Matrix4();

            translation.makeTranslation(-0.5, 0.0, 0.0);
            rotation.makeRotationY(Math.PI / 2);
            CubeMesh.planeMatrices.push(new Matrix4().multiplyMatrices(translation, rotation));

            translation.makeTranslation(0.5, 0.0, 0.0);
            rotation.makeRotationY(-Math.PI / 2);
            CubeMesh.planeMatrices.push(new Matrix4().multiplyMatrices(translation, rotation));

            translation.makeTranslation(0.0, -0.5, 0.0);
            rotation.makeRotationX(-Math.PI / 2);
            CubeMesh.planeMatrices.push(new Matrix4().multiplyMatrices(translation, rotation));

            translation.makeTranslation(0.0, 0.5, 0.0);
            rotation.makeRotationX(Math.PI / 2);
            CubeMesh.planeMatrices.push(new Matrix4().multiplyMatrices(translation, rotation));

            translation.makeTranslation(0.0, 0.0, -0.5);
            rotation.makeRotationY(0);
            CubeMesh.planeMatrices.push(new Matrix4().multiplyMatrices(translation, rotation));

            translation.makeTranslation(0.0, 0.0, 0.5);
            rotation.makeRotationY(Math.PI);
            CubeMesh.planeMatrices.push(new Matrix4().multiplyMatrices(translation, rotation));
        }
    }

    protected constructor(transparent: boolean) {
        this.transparent = transparent;
    }

    public abstract addFaceToCompositeGeometry(index: number, compositeGeometry: CompositeGeometry, blockPos: BlockPos): void;

    protected static getTextureMaterial(transparent: boolean, path: string): Material {
        let mat = CubeMesh.materialCache.get(path);

        if (!mat) {
            const texture = CubeMesh.textureLoader.load(import.meta.env.BASE_URL + path, (tex) => {
                tex.needsUpdate = true
            });
            texture.magFilter = NearestFilter;
            texture.minFilter = NearestFilter;
            texture.generateMipmaps = false;
            texture.colorSpace = SRGBColorSpace;

            mat = new MeshStandardMaterial({map: texture, transparent: transparent, alphaTest: transparent ? 0.5 : 0});
            CubeMesh.materialCache.set(path, mat);
        }

        return mat;
    }
}

export class CubeMeshOneMaterial extends CubeMesh {
    private readonly instanceIndex: number;

    public constructor(
        transparent: boolean,
        material: Material
    ) {
        super(transparent);

        this.instanceIndex = CompositeGeometry.addInstancedGeometryType(CubeMeshOneMaterial.planeGeometry, material);
    }

    public addFaceToCompositeGeometry(index: number, compositeGeometry: CompositeGeometry, blockPos: BlockPos): void {
        compositeGeometry.addGeometryInstance(this.instanceIndex, CubeMesh.planeMatrices[index].clone());
    }
}

export class CubeMeshMultiMaterial extends CubeMesh {
    protected readonly topInstanceIndex: number;
    protected readonly bottomInstanceIndex: number;
    protected readonly sideInstanceIndex: number;

    public constructor(
        transparent: boolean,
        topMaterial: Material,
        bottomMaterial: Material,
        sideMaterial: Material
    ) {
        super(transparent);

        this.topInstanceIndex = CompositeGeometry.addInstancedGeometryType(CubeMeshOneMaterial.planeGeometry, topMaterial);
        this.bottomInstanceIndex = CompositeGeometry.addInstancedGeometryType(CubeMeshOneMaterial.planeGeometry, bottomMaterial);
        this.sideInstanceIndex = CompositeGeometry.addInstancedGeometryType(CubeMeshOneMaterial.planeGeometry, sideMaterial);
    }

    public addFaceToCompositeGeometry(index: number, compositeGeometry: CompositeGeometry, blockPos: BlockPos): void {
        if (index === 2) compositeGeometry.addGeometryInstance(this.topInstanceIndex, CubeMesh.planeMatrices[index].clone());
        else if (index === 3) compositeGeometry.addGeometryInstance(this.bottomInstanceIndex, CubeMesh.planeMatrices[index].clone());
        else compositeGeometry.addGeometryInstance(this.sideInstanceIndex, CubeMesh.planeMatrices[index].clone());
    }
}

export class CubeMeshOneColor extends CubeMeshOneMaterial {
    public constructor(
        opacity: number,
        color: Color, 
        isWireFrame: boolean
    ) {
        super(opacity < 1, new MeshStandardMaterial({color: color, transparent: opacity < 1, depthWrite: opacity >= 1, opacity: opacity, wireframe: isWireFrame}));
    }
}

export class CubeMeshOneTexture extends CubeMeshOneMaterial {
    public constructor(
        transparent: boolean,
        texturePath: string
    ) {
        super(transparent, CubeMesh.getTextureMaterial(transparent, texturePath));
    }
}

export class CubeMeshMultiTexture extends CubeMeshMultiMaterial {
    public constructor(
        transparent: boolean,
        topTexturePath: string,
        bottomTexturePath: string,
        sideTexturePath: string
    ) {
        super(transparent,
            CubeMesh.getTextureMaterial(transparent, topTexturePath),
            CubeMesh.getTextureMaterial(transparent, bottomTexturePath),
            CubeMesh.getTextureMaterial(transparent, sideTexturePath)
        );
    }
}

export class CubeMeshGrassBlock extends CubeMeshMultiTexture {
    protected readonly grassInstanceIndex: number;


    static grassGeometry: BufferGeometry;
    static grassMaterial: ShaderMaterial;
    static grassNoise: SimplexNoise;

    static {
        let segments = 4;
        let positions = [], uvs = [], indices = [];

        for(let i = 0; i <= segments; ++i) {
            let t = i / segments;
            let width = 0.15 * (1 - t);
            let height = t * 0.6;
            let bend = t * t * 0.3;

            positions.push(-width, height, bend);
            positions.push(width, height, bend);
            uvs.push(0, t, 1, t);

            if (i < segments) {
                let base = i * 2;
                indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
            }
        }

        CubeMeshGrassBlock.grassNoise = new SimplexNoise();

        let geo = new BufferGeometry();
        geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
        geo.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
        geo.setIndex(indices);
        geo.computeVertexNormals();
        geo.computeBoundingBox();
        geo.computeBoundingSphere(); 
        CubeMeshGrassBlock.grassGeometry = geo;


        
        CubeMeshGrassBlock.grassMaterial = new ShaderMaterial({
            vertexShader: grassVertexShader,
            fragmentShader: grassFragmentShader,
            fog: true,
            uniforms: UniformsUtils.merge([
                UniformsLib.lights,
                UniformsLib.fog,
                {
                    uTime:         { value: 0 },
                    uPlayerFeetPos: { value : new Vector3(0, 0, 0) },
                    uRootColor: { value : new Vector3(81./255., 161./255., 53./255.) },
                    uTipColor1: { value : new Vector3(0.4, 0.7, 0.1) },
                    uTipColor2: { value : new Vector3(0.7, 0.6, 0.1) },
                },
            ]),
            side: DoubleSide,
            lights: true,
            alphaTest: 0.1,
            
        });

        CubeMeshGrassBlock.grassMaterial.userData.castShadow    = false;
        CubeMeshGrassBlock.grassMaterial.userData.receiveShadow = true;
        
    }

    public constructor(
        transparent: boolean,
        topTexturePath: string,
        bottomTexturePath: string,
        sideTexturePath: string
    ) {
        super(transparent,
            topTexturePath,
            bottomTexturePath,
            sideTexturePath
        );

        this.grassInstanceIndex = CompositeGeometry.addInstancedGeometryType(CubeMeshGrassBlock.grassGeometry, CubeMeshGrassBlock.grassMaterial); 
    }


    override addFaceToCompositeGeometry(index: number, compositeGeometry: CompositeGeometry, blockPos: BlockPos): void {
        
        super.addFaceToCompositeGeometry(index, compositeGeometry, blockPos);


        if (index === 2) {
            for(let x = 0; x < 1; x += 0.13) {
                for(let y = 0; y < 1; y += 0.13) {
                    let grassMatrix = new Matrix4();
                    let modifyMatrix = new Matrix4();

                    let randScale = 0.6 + CubeMeshGrassBlock.grassNoise.noise(x, y + 15) * 0.3;

                    modifyMatrix.makeScale(randScale, randScale, randScale);
                    grassMatrix.premultiply(modifyMatrix);

                    modifyMatrix.makeRotationY(CubeMeshGrassBlock.grassNoise.noise(x + 100, y) * Math.PI * 2);
                    grassMatrix.premultiply(modifyMatrix);

                    let noiseScale = 10;
                    modifyMatrix.makeTranslation((CubeMeshGrassBlock.grassNoise.noise((x + blockPos.x + 100) * noiseScale, (y + blockPos.z + 50) * noiseScale) + 1) * 50 % 1 - 0.5, -0.5, (CubeMeshGrassBlock.grassNoise.noise((x + blockPos.x - 100) * noiseScale, (y + blockPos.z - 50) * noiseScale) + 1) * 50 % 1 - 0.5);
                    grassMatrix.premultiply(modifyMatrix);

                    compositeGeometry.addGeometryInstance(this.grassInstanceIndex, grassMatrix);
                }
            }
        }
    }
}

export class CubeMeshWaterBlock extends CubeMeshMultiMaterial {
    //protected readonly waterInstanceIndex: number;
    static waterTopMaterial: ShaderMaterial;
    static waterTopGeometry: PlaneGeometry;
    protected readonly waterTopInstanceIndex: number;

    static {
        CubeMeshWaterBlock.waterTopMaterial = new ShaderMaterial({
            vertexShader: waterVertexShader,
            fragmentShader: waterFragmentShader,
            fog: true,
            uniforms: UniformsUtils.merge([
                // UniformsLib.lights,
                UniformsLib.fog,
                {
                    uTime: { value: 0 },
                    uDisplace: { value: true },
                    uWaterCol: { value: new Vector3(25/255, 100/255, 230/255) },
                    uCausticCol: { value: new Vector3(1, 1, 1) },
                    uIsTransparent: { value: true },
                    uGScale: { value: 1 },
                    uGSpeed: { value: 1 },
                    uDisplacementAmp: { value: 0.2 },
                    uFBMIntensity: { value: 3 },
                    uFBMScale: { value: 0.2 },

                    uLightDir:    { value: new Vector3(1, 2, 1).normalize() },
                    uLightColor:  { value: new Vector3(1, 1, 1) },
                    uCameraPos:   { value: new Vector3() },
                    uShininess:   { value: 128. },
                    uSpecularStr: { value: 0.8 },
                }
            ]),
            side: DoubleSide,
            transparent: true,
        });

        CubeMeshWaterBlock.waterTopGeometry = new PlaneGeometry(1, 1, 32, 32);
    }

    public constructor() {
        super(true,
            CubeMeshWaterBlock.waterTopMaterial,
            new MeshStandardMaterial(),
            new MeshStandardMaterial()
        );

        this.waterTopInstanceIndex = CompositeGeometry.addInstancedGeometryType(CubeMeshWaterBlock.waterTopGeometry, CubeMeshWaterBlock.waterTopMaterial); 
    }


    override addFaceToCompositeGeometry(index: number, compositeGeometry: CompositeGeometry, blockPos: BlockPos): void {
        if (index === 2) {
            compositeGeometry.addGeometryInstance(this.waterTopInstanceIndex, CubeMesh.planeMatrices[index].clone());
        }
    }

}

export class CubeMeshSandBlock extends CubeMeshOneTexture {
    protected readonly grassInstanceIndex: number;

    static grassMaterial: ShaderMaterial;

    static {
        CubeMeshSandBlock.grassMaterial = new ShaderMaterial({
            vertexShader: grassVertexShader,
            fragmentShader: grassFragmentShader,
            fog: true,
            uniforms: UniformsUtils.merge([
                UniformsLib.lights,
                UniformsLib.fog,
                {
                    uTime:         { value: 0 },
                    uPlayerFeetPos: { value : new Vector3(0, 0, 0) },
                    uRootColor: { value : new Vector3(104/255, 96/255, 53/255) },
                    uTipColor1: { value : new Vector3(164/255, 121/255, 85/255) },
                    uTipColor2: { value : new Vector3(156/255, 128/255, 109/255) },
                },
            ]),
            side: DoubleSide,
            lights: true,
            alphaTest: 0.1,
            
        });

        CubeMeshSandBlock.grassMaterial.userData.castShadow    = false;
        CubeMeshSandBlock.grassMaterial.userData.receiveShadow = true;
    }

    public constructor(texturePath: string) {
        super(false, texturePath);

        this.grassInstanceIndex = CompositeGeometry.addInstancedGeometryType(CubeMeshGrassBlock.grassGeometry, CubeMeshSandBlock.grassMaterial); 
    }

    override addFaceToCompositeGeometry(index: number, compositeGeometry: CompositeGeometry, blockPos: BlockPos): void {
        
        super.addFaceToCompositeGeometry(index, compositeGeometry, blockPos);

        if (index === 2) {
            for(let x = 0; x < 1; x += 0.25) {
                for(let y = 0; y < 1; y += 0.25) {
                    let shouldSpawnScale = 5;
                    let shouldSpawmCutoff = 0.7;
                    let shouldSpawnSample = CubeMeshGrassBlock.grassNoise.noise((blockPos.x + x) / shouldSpawnScale, (blockPos.z + y) / shouldSpawnScale);

                    let shouldIgnoreScale = 30;
                    let chanceOfIgnore = 0.04;
                    let chanceOfIgnoreSample = CubeMeshGrassBlock.grassNoise.noise((blockPos.x + x) * shouldIgnoreScale, (blockPos.z + y) * shouldIgnoreScale) * 10000 % 1;
                    //let chanceOfIgnoreSample = CubeMeshGrassBlock.grassNoise.noise((blockPos.x + x) / shouldIgnoreScale, (blockPos.z + y) / shouldIgnoreScale);

                    if (shouldSpawnSample < shouldSpawmCutoff && (chanceOfIgnoreSample < (1 - chanceOfIgnore))) continue;

                    let grassMatrix = new Matrix4();
                    let modifyMatrix = new Matrix4();

                    let randScale = 0.6 + CubeMeshGrassBlock.grassNoise.noise(x, y + 15) * 0.3;
                    
                    let grassHeightMult = Math.pow(((shouldSpawnSample - shouldSpawmCutoff) + 1), 2);
                    grassHeightMult = Math.max(grassHeightMult, 0.3);
                    modifyMatrix.makeScale(randScale, randScale * (grassHeightMult * 3), randScale);
                    grassMatrix.premultiply(modifyMatrix);

                    modifyMatrix.makeRotationY(CubeMeshGrassBlock.grassNoise.noise(x + 100, y) * Math.PI * 2);
                    grassMatrix.premultiply(modifyMatrix);

                    let noiseScale = 10;
                    modifyMatrix.makeTranslation((CubeMeshGrassBlock.grassNoise.noise((x + blockPos.x + 100) * noiseScale, (y + blockPos.z + 50) * noiseScale) + 1) * 50 % 1 - 0.5, -0.5, (CubeMeshGrassBlock.grassNoise.noise((x + blockPos.x - 100) * noiseScale, (y + blockPos.z - 50) * noiseScale) + 1) * 50 % 1 - 0.5);
                    grassMatrix.premultiply(modifyMatrix);

                    compositeGeometry.addGeometryInstance(this.grassInstanceIndex, grassMatrix);
                }
            }
        }
    }
}




// // The pbr are outdated rn, i will fix them when we get to using pbr textures.
// export class CuboidMeshPBR extends CuboidMesh {
//     colorPath: string;
//     normalMapPath: string;
//     metalnessMapPath: string;

//     constructor(
//         width: number, 
//         height: number, 
//         depth: number,
//         opacity: number,
//         colorPath: string, 
//         normalMapPath: string, 
//         metalnessMapPath: string,
//         faces: {
//             px: number,
//             nx: number,
//             py: number,
//             ny: number,
//             pz: number,
//             nz: number,
//         } = {
//             px: 1.0,
//             nx: 1.0,
//             py: 1.0,
//             ny: 1.0,
//             pz: 1.0,
//             nz: 1.0
//         }
//     ) {
//         super(width, height, depth, opacity, faces);
//         this.colorPath = colorPath;
//         this.normalMapPath = normalMapPath;
//         this.metalnessMapPath = metalnessMapPath;

//         const loader: TextureLoader = new TextureLoader();
//         this.materials = [new MeshStandardMaterial({transparent: true, opacity: this.opacity})];
//         this.materials[0].map = loader.load(import.meta.env.BASE_URL + colorPath);
//         this.materials[0].normalMap = loader.load(import.meta.env.BASE_URL + normalMapPath);
//         this.materials[0].metalnessMap = loader.load(import.meta.env.BASE_URL + metalnessMapPath);
//     }

//     Mesh(): Mesh | null {
//         if (this.boxGeometries.length === 0) return null;
//         let newMesh: Mesh = new Mesh(this.geometry, this.materials[0]);
//         newMesh.castShadow = true;
//         newMesh.receiveShadow = true;
//         return newMesh;
//     }
// }

// export class CuboidMeshMultiTexturePBR extends CuboidMesh {
//     topTexturePaths: {
//         colorPath: string,
//         normalMapPath: string,
//         metalnessMapPath: string,
//     };
//     bottomTexturePaths: {
//         colorPath: string,
//         normalMapPath: string,
//         metalnessMapPath: string,
//     };
//     sideTexturePaths: {
//         colorPath: string,
//         normalMapPath: string,
//         metalnessMapPath: string,
//     };
//     materials: MeshStandardMaterial[];

//     constructor(
//         width: number, 
//         height: number, 
//         depth: number,
//         opacity: number,
//         topTexturePaths: {
//             colorPath: string,
//             normalMapPath: string,
//             metalnessMapPath: string,
//         },
//         bottomTexturePaths: {
//             colorPath: string,
//             normalMapPath: string,
//             metalnessMapPath: string,
//         },
//         sideTexturePaths: {
//             colorPath: string,
//             normalMapPath: string,
//             metalnessMapPath: string,
//         },
//         faces: {
//             px: number,
//             nx: number,
//             py: number,
//             ny: number,
//             pz: number,
//             nz: number,
//         } = {
//             px: 1.0,
//             nx: 1.0,
//             py: 1.0,
//             ny: 1.0,
//             pz: 1.0,
//             nz: 1.0
//         }
//     ) {
//         super(width, height, depth, opacity, faces);
//         this.topTexturePaths = topTexturePaths;
//         this.bottomTexturePaths = bottomTexturePaths;
//         this.sideTexturePaths = sideTexturePaths;
//         this.materials = [];

//         const loader = new TextureLoader();

//         for (const faceIndex of this.visibleFaces) {
//             let colorPath: string;
//             let normalMapPath: string;
//             let metalnessMapPath: string;

//             if (faceIndex == 2) {
//                 colorPath = topTexturePaths.colorPath;
//                 normalMapPath = topTexturePaths.normalMapPath;
//                 metalnessMapPath = topTexturePaths.metalnessMapPath;
//             } else if (faceIndex == 3) {
//                 colorPath = bottomTexturePaths.colorPath;
//                 normalMapPath = bottomTexturePaths.normalMapPath;
//                 metalnessMapPath = bottomTexturePaths.metalnessMapPath;
//             } else {
//                 colorPath = sideTexturePaths.colorPath;
//                 normalMapPath = sideTexturePaths.normalMapPath;
//                 metalnessMapPath = sideTexturePaths.metalnessMapPath;
//             }

//             this.materials[faceIndex].map = loader.load(import.meta.env.BASE_URL + colorPath);
//             this.materials[faceIndex].normalMap = loader.load(import.meta.env.BASE_URL + normalMapPath);
//             this.materials[faceIndex].metalnessMap = loader.load(import.meta.env.BASE_URL + metalnessMapPath);
//         }
//     }

//     Mesh(): Mesh | null {
//         if (this.boxGeometries.length === 0) return null;
//         let newMesh: Mesh = new Mesh(this.geometry, this.materials);
//         newMesh.castShadow = true;
//         newMesh.receiveShadow = true;
//         return newMesh;
//     }
// }