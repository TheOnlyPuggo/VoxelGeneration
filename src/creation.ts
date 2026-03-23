import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/Addons.js';

export class CuboidMesh {
    static planeGeometries: THREE.PlaneGeometry[] = [];
    static materialCache = new Map<string, THREE.MeshStandardMaterial>;

    width: number;
    height: number;
    depth: number;
    opacity: number;
    faces: {
        px: number,
        nx: number,
        py: number,
        ny: number,
        pz: number,
        nz: number,
    };
    boxGeometries: THREE.PlaneGeometry[];
    materials: THREE.MeshStandardMaterial[];
    geometry: THREE.BufferGeometry;
    visibleFaces: number[];

    constructor(
        width: number, 
        height: number, 
        depth: number,
        opacity: number = 1.0,
        faces: {
            px: number,
            nx: number,
            py: number,
            ny: number,
            pz: number,
            nz: number,
        } = {
            px: 1.0,
            nx: 1.0,
            py: 1.0,
            ny: 1.0,
            pz: 1.0,
            nz: 1.0
        }
    ) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.opacity = opacity;
        this.faces = faces;
        this.visibleFaces = [];

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

        this.boxGeometries = [];

        if (faces.px === 0 && this.opacity !== 0) {
            this.boxGeometries.push(CuboidMesh.planeGeometries[0].clone());
            this.visibleFaces.push(0);
        }
        if (faces.nx === 0 && this.opacity !== 0) {
            this.boxGeometries.push(CuboidMesh.planeGeometries[1].clone());
            this.visibleFaces.push(1);
        }
        if (faces.py === 0 && this.opacity !== 0) {
            this.boxGeometries.push(CuboidMesh.planeGeometries[2].clone());
            this.visibleFaces.push(2);
        }
        if (faces.ny === 0 && this.opacity !== 0) {
            this.boxGeometries.push(CuboidMesh.planeGeometries[3].clone());
            this.visibleFaces.push(3);
        }
        if (faces.pz === 0 && this.opacity !== 0) {
            this.boxGeometries.push(CuboidMesh.planeGeometries[4].clone());
            this.visibleFaces.push(4);
        }
        if (faces.nz === 0 && this.opacity !== 0) {
            this.boxGeometries.push(CuboidMesh.planeGeometries[5].clone());
            this.visibleFaces.push(5);
        }

        if (this.boxGeometries.length !== 0) this.geometry = BufferGeometryUtils.mergeGeometries(this.boxGeometries, true);
        else this.geometry = new THREE.BufferGeometry();

        this.materials = [new THREE.MeshStandardMaterial()];
    }

    Mesh(): THREE.Mesh | null {
        if (this.boxGeometries.length === 0) return null;
        return new THREE.Mesh(this.geometry, this.materials);
    }
};


export class CuboidMeshOneColor extends CuboidMesh {
    color: THREE.Color;
    isWireFrame: boolean;

    constructor(
        width: number, 
        height: number, 
        depth: number, 
        opacity: number = 1.0,
        color: THREE.Color, 
        isWireFrame: boolean,
        faces: {
            px: number,
            nx: number,
            py: number,
            ny: number,
            pz: number,
            nz: number,
        } = {
            px: 0.0,
            nx: 0.0,
            py: 0.0,
            ny: 0.0,
            pz: 0.0,
            nz: 0.0
        },
    ) {
        super(width, height, depth, opacity, faces);
        this.color = color;
        this.isWireFrame = isWireFrame;

        this.materials = [new THREE.MeshStandardMaterial({color: color, transparent: true, opacity: this.opacity})];
    }

    Mesh(): THREE.Mesh | null {
        if (this.boxGeometries.length === 0) return null;
        return new THREE.Mesh(this.geometry, this.materials[0]);
    }
}

export class CuboidMeshOneTexture extends CuboidMesh {
    texturePath: string;

    constructor(
        width: number, 
        height: number, 
        depth: number,
        opacity: number,
        texturePath: string,
        faces: {
            px: number,
            nx: number,
            py: number,
            ny: number,
            pz: number,
            nz: number,
        } = {
            px: 0.0,
            nx: 0.0,
            py: 0.0,
            ny: 0.0,
            pz: 0.0,
            nz: 0.0
        },
    ) {
        super(width, height, depth, opacity, faces);
        this.texturePath = texturePath;

        const loader = new THREE.TextureLoader();
        let mat = CuboidMesh.materialCache.get(texturePath);

        if (!mat) {
            const texture = loader.load(import.meta.env.BASE_URL + texturePath);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;

            mat = new THREE.MeshStandardMaterial({map: texture, transparent: true, opacity: this.opacity});
            CuboidMesh.materialCache.set(texturePath, mat);
        }

        this.materials[0] = mat;
    }

    Mesh(): THREE.Mesh | null {
        if (this.boxGeometries.length === 0) return null;
        let newMesh: THREE.Mesh = new THREE.Mesh(this.geometry, this.materials[0]);
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;
        return newMesh;
    }
}

export class CuboidMeshMultiTexture extends CuboidMesh {
    topTexturePath: string
    bottomTexturePath: string;
    sideTexturePath: string;

    constructor(
        width: number, 
        height: number, 
        depth: number,
        opacity: number,
        topTexturePath: string,
        bottomTexturePath: string,
        sideTexturePath: string,
        faces: {
            px: number,
            nx: number,
            py: number,
            ny: number,
            pz: number,
            nz: number,
        } = {
            px: 0.0,
            nx: 0.0,
            py: 0.0,
            ny: 0.0,
            pz: 0.0,
            nz: 0.0
        }
    ) {
        super(width, height, depth, opacity, faces);
        this.topTexturePath = topTexturePath;
        this.bottomTexturePath = bottomTexturePath;
        this.sideTexturePath = sideTexturePath;
        this.materials = [];

        const loader = new THREE.TextureLoader();
        
        for (const faceIndex of this.visibleFaces) {
            let path: string

            if (faceIndex == 2) {
                path = topTexturePath;
            } else if (faceIndex == 3) {
                path = bottomTexturePath;
            } else {
                path = sideTexturePath;
            }

            let mat = CuboidMesh.materialCache.get(path);

            if (!mat) {
                const texture = loader.load(import.meta.env.BASE_URL + path);
                texture.magFilter = THREE.NearestFilter;
                texture.minFilter = THREE.NearestFilter;

                mat = new THREE.MeshStandardMaterial({map: texture, transparent: true, opacity: this.opacity});
                
                CuboidMesh.materialCache.set(path, mat);
            }

            this.materials[faceIndex] = mat;
        }
    }

    Mesh(): THREE.Mesh | null {
        if (this.boxGeometries.length === 0) return null;
        let newMesh: THREE.Mesh = new THREE.Mesh(this.geometry, this.materials);
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;
        return newMesh;
    }
}

// The pbr classes are untested so might not work, dm me if they dont so i can fix or fix it urself if u figure it out.
export class CuboidMeshPBR extends CuboidMesh {
    colorPath: string;
    normalMapPath: string;
    metalnessMapPath: string;

    constructor(
        width: number, 
        height: number, 
        depth: number,
        opacity: number,
        colorPath: string, 
        normalMapPath: string, 
        metalnessMapPath: string,
        faces: {
            px: number,
            nx: number,
            py: number,
            ny: number,
            pz: number,
            nz: number,
        } = {
            px: 1.0,
            nx: 1.0,
            py: 1.0,
            ny: 1.0,
            pz: 1.0,
            nz: 1.0
        }
    ) {
        super(width, height, depth, opacity, faces);
        this.colorPath = colorPath;
        this.normalMapPath = normalMapPath;
        this.metalnessMapPath = metalnessMapPath;

        const loader: THREE.TextureLoader = new THREE.TextureLoader();
        this.materials = [new THREE.MeshStandardMaterial({transparent: true, opacity: this.opacity})];
        this.materials[0].map = loader.load(import.meta.env.BASE_URL + colorPath);
        this.materials[0].normalMap = loader.load(import.meta.env.BASE_URL + normalMapPath);
        this.materials[0].metalnessMap = loader.load(import.meta.env.BASE_URL + metalnessMapPath);
    }

    Mesh(): THREE.Mesh | null {
        if (this.boxGeometries.length === 0) return null;
        let newMesh: THREE.Mesh = new THREE.Mesh(this.geometry, this.materials[0]);
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;
        return newMesh;
    }
}

export class CuboidMeshMultiTexturePBR extends CuboidMesh {
    topTexturePaths: {
        colorPath: string,
        normalMapPath: string,
        metalnessMapPath: string,
    };
    bottomTexturePaths: {
        colorPath: string,
        normalMapPath: string,
        metalnessMapPath: string,
    };
    sideTexturePaths: {
        colorPath: string,
        normalMapPath: string,
        metalnessMapPath: string,
    };
    materials: THREE.MeshStandardMaterial[];

    constructor(
        width: number, 
        height: number, 
        depth: number,
        opacity: number,
        topTexturePaths: {
            colorPath: string,
            normalMapPath: string,
            metalnessMapPath: string,
        },
        bottomTexturePaths: {
            colorPath: string,
            normalMapPath: string,
            metalnessMapPath: string,
        },
        sideTexturePaths: {
            colorPath: string,
            normalMapPath: string,
            metalnessMapPath: string,
        },
        faces: {
            px: number,
            nx: number,
            py: number,
            ny: number,
            pz: number,
            nz: number,
        } = {
            px: 1.0,
            nx: 1.0,
            py: 1.0,
            ny: 1.0,
            pz: 1.0,
            nz: 1.0
        }
    ) {
        super(width, height, depth, opacity, faces);
        this.topTexturePaths = topTexturePaths;
        this.bottomTexturePaths = bottomTexturePaths;
        this.sideTexturePaths = sideTexturePaths;
        this.materials = [];

        const loader = new THREE.TextureLoader();

        for (const faceIndex of this.visibleFaces) {
            let colorPath: string;
            let normalMapPath: string;
            let metalnessMapPath: string;

            if (faceIndex == 2) {
                colorPath = topTexturePaths.colorPath;
                normalMapPath = topTexturePaths.normalMapPath;
                metalnessMapPath = topTexturePaths.metalnessMapPath;
            } else if (faceIndex == 3) {
                colorPath = bottomTexturePaths.colorPath;
                normalMapPath = bottomTexturePaths.normalMapPath;
                metalnessMapPath = bottomTexturePaths.metalnessMapPath;
            } else {
                colorPath = sideTexturePaths.colorPath;
                normalMapPath = sideTexturePaths.normalMapPath;
                metalnessMapPath = sideTexturePaths.metalnessMapPath;
            }

            this.materials[faceIndex].map = loader.load(import.meta.env.BASE_URL + colorPath);
            this.materials[faceIndex].normalMap = loader.load(import.meta.env.BASE_URL + normalMapPath);
            this.materials[faceIndex].metalnessMap = loader.load(import.meta.env.BASE_URL + metalnessMapPath);
        }
    }

    Mesh(): THREE.Mesh | null {
        if (this.boxGeometries.length === 0) return null;
        let newMesh: THREE.Mesh = new THREE.Mesh(this.geometry, this.materials);
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;
        return newMesh;
    }
}