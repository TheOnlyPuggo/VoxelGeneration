import {Color, Material, MeshStandardMaterial, NearestFilter, PlaneGeometry, TextureLoader} from "three";
import {CompositeGeometry} from "./compositeGeometry";
import {FaceMap} from "./faceMap";

export abstract class CubeMesh {
    protected static readonly planeGeometries: PlaneGeometry[] = [];
    protected static readonly materialCache = new Map<string, MeshStandardMaterial>;
    protected static readonly textureLoader = new TextureLoader();

    public readonly transparent: boolean;

    static {
        if (CubeMesh.planeGeometries.length === 0) {
            const pxFace = new PlaneGeometry(1, 1);
            pxFace.rotateY(Math.PI / 2);
            pxFace.translate(-0.5, 0.0, 0.0);
            CubeMesh.planeGeometries.push(pxFace);

            const nxFace = new PlaneGeometry(1, 1);
            nxFace.rotateY(-Math.PI / 2);
            nxFace.translate(0.5, 0.0, 0.0);
            CubeMesh.planeGeometries.push(nxFace);

            const pyFace = new PlaneGeometry(1, 1);
            pyFace.rotateX(-Math.PI / 2);
            pyFace.translate(0.0, -0.5, 0.0);
            CubeMesh.planeGeometries.push(pyFace);

            const nyFace = new PlaneGeometry(1, 1);
            nyFace.rotateX(Math.PI / 2);
            nyFace.translate(0.0, 0.5, 0.0);
            CubeMesh.planeGeometries.push(nyFace);

            const pzFace = new PlaneGeometry(1, 1);
            pzFace.translate(0.0, 0.0, -0.5);
            CubeMesh.planeGeometries.push(pzFace);

            const nzFace = new PlaneGeometry(1, 1);
            nzFace.rotateY(Math.PI);
            nzFace.translate(0.0, 0.0, 0.5);
            CubeMesh.planeGeometries.push(nzFace);
        }
    }

    protected constructor(transparent: boolean) {
        this.transparent = transparent;
    }

    public abstract getMaterial(index: number): Material;

    // obsolete, we are now rendering the cubes inside out
    public constructGeometry(faces: FaceMap): CompositeGeometry | null {
        const geometries: PlaneGeometry[] = [];
        const materials: Material[] = [];

        const addFace = (visible: boolean, geomIndex: number, matIndex: number) => {
            if (visible) {
                geometries.push(CubeMesh.planeGeometries[geomIndex].clone());
                materials.push(this.getMaterial(matIndex));
            }
        }

        addFace(faces.px, 0, 0);
        addFace(faces.nx, 1, 1);
        addFace(faces.py, 2, 2);
        addFace(faces.ny, 3, 3);
        addFace(faces.pz, 4, 4);
        addFace(faces.nz, 5, 5);

        if (geometries.length === 0) return null;

        return new CompositeGeometry(geometries, materials);
    }

    getFaceCompositeGeometry(index: number): CompositeGeometry {
        return new CompositeGeometry([CubeMesh.planeGeometries[index].clone()], [this.getMaterial(index)]);
    }

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
    private readonly material: Material;

    public constructor(
        transparent: boolean,
        material: Material
    ) {
        super(transparent);

        this.material = material;
    }

    public getMaterial(index: number): Material {
        return this.material;
    }
}

export class CubeMeshMultiMaterial extends CubeMesh {
    private readonly topMaterial: Material;
    private readonly bottomMaterial: Material;
    private readonly sideMaterial: Material;

    public constructor(
        transparent: boolean,
        topMaterial: Material,
        bottomMaterial: Material,
        sideMaterial: Material
    ) {
        super(transparent);

        this.topMaterial = topMaterial;
        this.bottomMaterial = bottomMaterial;
        this.sideMaterial = sideMaterial;
    }

    public getMaterial(index: number): Material {
        if (index == 2) {
            return this.topMaterial;
        } else if (index == 3) {
            return this.bottomMaterial;
        } else {
            return this.sideMaterial;
        }
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