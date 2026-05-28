import {
    Color,
    Material,
    Matrix4,
    MeshStandardMaterial,
    NearestFilter,
    PlaneGeometry,
    SRGBColorSpace,
    TextureLoader
} from "three";
import {CompositeGeometry} from "./compositeGeometry";

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

    public abstract addFaceToCompositeGeometry(index: number, compositeGeometry: CompositeGeometry): void;

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
    private readonly material: Material;

    public constructor(
        transparent: boolean,
        material: Material
    ) {
        super(transparent);

        this.instanceIndex = CompositeGeometry.addInstancedGeometryType(CubeMeshOneMaterial.planeGeometry.clone(), material);
        this.material = material;
    }

    public addFaceToCompositeGeometry(index: number, compositeGeometry: CompositeGeometry): void {
        //compositeGeometry.addGeometry(CubeMesh.planeGeometry.clone().applyMatrix4(CubeMesh.planeMatrices[index]), this.material);
        compositeGeometry.addGeometryInstance(this.instanceIndex, CubeMesh.planeMatrices[index].clone());
    }
}

export class CubeMeshMultiMaterial extends CubeMesh {
    private readonly topInstanceIndex: number;
    private readonly bottomInstanceIndex: number;
    private readonly sideInstanceIndex: number;

    public constructor(
        transparent: boolean,
        topMaterial: Material,
        bottomMaterial: Material,
        sideMaterial: Material
    ) {
        super(transparent);

        this.topInstanceIndex = CompositeGeometry.addInstancedGeometryType(CubeMeshOneMaterial.planeGeometry.clone(), topMaterial);
        this.bottomInstanceIndex = CompositeGeometry.addInstancedGeometryType(CubeMeshOneMaterial.planeGeometry.clone(), bottomMaterial);
        this.sideInstanceIndex = CompositeGeometry.addInstancedGeometryType(CubeMeshOneMaterial.planeGeometry.clone(), sideMaterial);
    }

    public addFaceToCompositeGeometry(index: number, compositeGeometry: CompositeGeometry): void {
        //if (index == 2) compositeGeometry.addGeometry(CubeMesh.planeGeometry.clone().applyMatrix4(CubeMesh.planeMatrices[index]), this.topMaterial);
        //else if (index == 3) compositeGeometry.addGeometry(CubeMesh.planeGeometry.clone().applyMatrix4(CubeMesh.planeMatrices[index]), this.bottomMaterial);
        //else compositeGeometry.addGeometry(CubeMesh.planeGeometry.clone().applyMatrix4(CubeMesh.planeMatrices[index]), this.sideMaterial);
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