import * as THREE from 'three';
import {CompositeGeometry} from "./compositeGeometry";
import {FaceMap} from "./faceMap";

export class CuboidMesh {
    static planeGeometries: THREE.PlaneGeometry[] = [];
    static materialCache = new Map<string, THREE.MeshStandardMaterial>;
    static textureLoader = new THREE.TextureLoader();

    width: number;
    height: number;
    depth: number;
    opacity: number;

    constructor(
        width: number, 
        height: number, 
        depth: number,
        opacity: number = 1.0,
    ) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.opacity = opacity;

        if (CuboidMesh.planeGeometries.length === 0) {
            CuboidMesh.planeGeometries = [];

            const pxFace = new THREE.PlaneGeometry(1, 1);
            pxFace.rotateY(Math.PI / 2);
            pxFace.translate(0.5, 0.0, 0.0);
            CuboidMesh.planeGeometries.push(pxFace);

            const nxFace = new THREE.PlaneGeometry(1, 1);
            nxFace.rotateY(-Math.PI / 2);
            nxFace.translate(-0.5, 0.0, 0.0);
            CuboidMesh.planeGeometries.push(nxFace);

            const pyFace = new THREE.PlaneGeometry(1, 1);
            pyFace.rotateX(-Math.PI / 2);
            pyFace.translate(0.0, 0.5, 0.0);
            CuboidMesh.planeGeometries.push(pyFace);

            const nyFace = new THREE.PlaneGeometry(1, 1);
            nyFace.rotateX(Math.PI / 2);
            nyFace.translate(0.0, -0.5, 0.0);
            CuboidMesh.planeGeometries.push(nyFace);

            const pzFace = new THREE.PlaneGeometry(1, 1);
            pzFace.translate(0.0, 0.0, 0.5);
            CuboidMesh.planeGeometries.push(pzFace);

            const nzFace = new THREE.PlaneGeometry(1, 1);
            nzFace.rotateY(Math.PI);
            nzFace.translate(0.0, 0.0, -0.5);
            CuboidMesh.planeGeometries.push(nzFace);
        }
    }

    getMaterial(index: number): THREE.Material {
        return new THREE.MeshStandardMaterial();
    }

    constructGeometry(faces: FaceMap): CompositeGeometry | null {
        const geometries: THREE.PlaneGeometry[] = [];
        const materials: THREE.Material[] = [];

        const addFace = (visible: boolean, geomIndex: number, matIndex: number) => {
            if (visible && this.opacity !== 0) {
                geometries.push(CuboidMesh.planeGeometries[geomIndex].clone());
                console.log(this.getMaterial(matIndex));
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
}

export class CuboidMeshOneColor extends CuboidMesh {
    color: THREE.Color;
    isWireFrame: boolean;
    material: THREE.MeshStandardMaterial;

    constructor(
        width: number, 
        height: number, 
        depth: number, 
        opacity: number = 1.0,
        color: THREE.Color, 
        isWireFrame: boolean,
    ) {
        super(width, height, depth, opacity);
        this.color = color;
        this.isWireFrame = isWireFrame;

        this.material = new THREE.MeshStandardMaterial({color: color, transparent: true, opacity: this.opacity});
    }

    getMaterial(index: number): THREE.Material {
        return this.material;
    }
}

export class CuboidMeshOneTexture extends CuboidMesh {
    texturePath: string;
    material: THREE.MeshStandardMaterial;

    constructor(
        width: number, 
        height: number, 
        depth: number,
        opacity: number,
        texturePath: string,
    ) {
        super(width, height, depth, opacity);
        this.texturePath = texturePath;

        let mat = CuboidMesh.materialCache.get(texturePath);

        if (!mat) {
            const texture = CuboidMesh.textureLoader.load(import.meta.env.BASE_URL + texturePath, (tex) => {tex.needsUpdate = true});
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.generateMipmaps = false;

            mat = new THREE.MeshStandardMaterial({map: texture, transparent: true, opacity: this.opacity});
            CuboidMesh.materialCache.set(texturePath, mat);
        }

        this.material = mat;
    }

    getMaterial(index: number): THREE.Material {
        return this.material;
    }
}

export class CuboidMeshMultiTexture extends CuboidMesh {
    topTexturePath: string
    bottomTexturePath: string;
    sideTexturePath: string;
    materials: THREE.MeshStandardMaterial[];

    constructor(
        width: number, 
        height: number, 
        depth: number,
        opacity: number,
        topTexturePath: string,
        bottomTexturePath: string,
        sideTexturePath: string
    ) {
        super(width, height, depth, opacity);
        this.topTexturePath = topTexturePath;
        this.bottomTexturePath = bottomTexturePath;
        this.sideTexturePath = sideTexturePath;
        this.materials = [];
        
        for (let i = 0; i < 6; ++i) {
            let path: string

            if (i == 2) {
                path = topTexturePath;
            } else if (i == 3) {
                path = bottomTexturePath;
            } else {
                path = sideTexturePath;
            }

            let mat = CuboidMesh.materialCache.get(path);

            if (!mat) {
                const texture = CuboidMesh.textureLoader.load(import.meta.env.BASE_URL + path);
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;

                mat = new THREE.MeshStandardMaterial({map: texture, transparent: true, opacity: this.opacity});
                
                CuboidMesh.materialCache.set(path, mat);
            }

            this.materials.push(mat);
        }
    }

    getMaterial(index: number): THREE.Material {
        return this.materials[index];
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

//         const loader: THREE.TextureLoader = new THREE.TextureLoader();
//         this.materials = [new THREE.MeshStandardMaterial({transparent: true, opacity: this.opacity})];
//         this.materials[0].map = loader.load(import.meta.env.BASE_URL + colorPath);
//         this.materials[0].normalMap = loader.load(import.meta.env.BASE_URL + normalMapPath);
//         this.materials[0].metalnessMap = loader.load(import.meta.env.BASE_URL + metalnessMapPath);
//     }

//     Mesh(): THREE.Mesh | null {
//         if (this.boxGeometries.length === 0) return null;
//         let newMesh: THREE.Mesh = new THREE.Mesh(this.geometry, this.materials[0]);
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
//     materials: THREE.MeshStandardMaterial[];

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

//         const loader = new THREE.TextureLoader();

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

//     Mesh(): THREE.Mesh | null {
//         if (this.boxGeometries.length === 0) return null;
//         let newMesh: THREE.Mesh = new THREE.Mesh(this.geometry, this.materials);
//         newMesh.castShadow = true;
//         newMesh.receiveShadow = true;
//         return newMesh;
//     }
// }