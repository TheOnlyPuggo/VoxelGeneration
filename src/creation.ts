import * as THREE from 'three';

export class CuboidMesh {
    width: number;
    height: number;
    depth: number;
    geometry: THREE.BoxGeometry;

    constructor(
        width: number, 
        height: number, 
        depth: number
    ) {
        this.width = width;
        this.height = height;
        this.depth = depth;

        this.geometry = new THREE.BoxGeometry(width, height, depth);
    }

    Mesh(): THREE.Mesh {
        return new THREE.Mesh();
    }
};


export class CuboidMeshOneColor extends CuboidMesh {
    color: THREE.Color;
    isWireFrame: boolean;
    material: THREE.MeshBasicMaterial;

    constructor(
        width: number, 
        height: number, 
        depth: number, 
        color: THREE.Color, 
        isWireFrame: boolean
    ) {
        super(width, height, depth);
        this.color = color;
        this.isWireFrame = isWireFrame;

        this.geometry = new THREE.BoxGeometry(width, height, depth);
        this.material = new THREE.MeshBasicMaterial({color: color});
    }

    Mesh(): THREE.Mesh {
        return new THREE.Mesh(this.geometry, this.material);
    }
}
export class CuboidMeshOneTexture extends CuboidMesh {
    texturePath: string;
    material: THREE.MeshStandardMaterial;

    constructor(
        width: number, 
        height: number, 
        depth: number,
        texturePath: string
    ) {
        super(width, height, depth);
        this.texturePath = texturePath;
        this.geometry = new THREE.BoxGeometry(width, height, depth);

        const loader = new THREE.TextureLoader();
        this.material = new THREE.MeshStandardMaterial();
        this.material.map = loader.load(import.meta.env.BASE_URL + texturePath);
    }

    Mesh(): THREE.Mesh {
        let newMesh: THREE.Mesh = new THREE.Mesh(this.geometry, this.material);
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;
        return newMesh;
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
        topTexturePath: string,
        bottomTexturePath: string,
        sideTexturePath: string,
    ) {
        super(width, height, depth);
        this.topTexturePath = topTexturePath;
        this.bottomTexturePath = bottomTexturePath;
        this.sideTexturePath = sideTexturePath;
        this.materials = [];

        const loader = new THREE.TextureLoader();
        this.geometry = new THREE.BoxGeometry(width, height, depth);
        
        for (let i = 0; i < 6; ++i) {
            let path: string

            if (i == 2) {
                path = topTexturePath;
            } else if (i == 3) {
                path = bottomTexturePath;
            } else {
                path = sideTexturePath;
            }

            const texture = loader.load(import.meta.env.BASE_URL + path);
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;

            this.materials[i] = new THREE.MeshStandardMaterial({map: texture});
        }
    }

    Mesh(): THREE.Mesh {
        let newMesh: THREE.Mesh = new THREE.Mesh(this.geometry, this.materials);
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;
        return newMesh;
    }
}

export class CuboidMeshPBR extends CuboidMesh {
    colorPath: string;
    normalMapPath: string;
    metalnessMapPath: string;
    material: THREE.MeshStandardMaterial;

    constructor(
        width: number, 
        height: number, 
        depth: number, 
        colorPath: string, 
        normalMapPath: string, 
        metalnessMapPath: string
    ) {
        super(width, height, depth);
        this.colorPath = colorPath;
        this.normalMapPath = normalMapPath;
        this.metalnessMapPath = metalnessMapPath;

        const loader: THREE.TextureLoader = new THREE.TextureLoader();
        this.geometry = new THREE.BoxGeometry(width, height, depth);
        this.material = new THREE.MeshStandardMaterial();
        this.material.map = loader.load(import.meta.env.BASE_URL + colorPath);
        this.material.normalMap = loader.load(import.meta.env.BASE_URL + normalMapPath);
        this.material.metalnessMap = loader.load(import.meta.env.BASE_URL + metalnessMapPath);
    }

    Mesh(): THREE.Mesh {
        let newMesh: THREE.Mesh = new THREE.Mesh(this.geometry, this.material);
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
        }
    ) {
        super(width, height, depth);
        this.topTexturePaths = topTexturePaths;
        this.bottomTexturePaths = bottomTexturePaths;
        this.sideTexturePaths = sideTexturePaths;
        this.materials = [];

        const loader = new THREE.TextureLoader();
        this.geometry = new THREE.BoxGeometry(width, height, depth);

        for (let i = 0; i < 6; ++i) {
            let colorPath: string;
            let normalMapPath: string;
            let metalnessMapPath: string;

            if (i == 2) {
                colorPath = topTexturePaths.colorPath;
                normalMapPath = topTexturePaths.normalMapPath;
                metalnessMapPath = topTexturePaths.metalnessMapPath;
            } else if (i == 3) {
                colorPath = bottomTexturePaths.colorPath;
                normalMapPath = bottomTexturePaths.normalMapPath;
                metalnessMapPath = bottomTexturePaths.metalnessMapPath;
            } else {
                colorPath = sideTexturePaths.colorPath;
                normalMapPath = sideTexturePaths.normalMapPath;
                metalnessMapPath = sideTexturePaths.metalnessMapPath;
            }

            this.materials[i].map = loader.load(import.meta.env.BASE_URL + colorPath);
            this.materials[i].normalMap = loader.load(import.meta.env.BASE_URL + normalMapPath);
            this.materials[i].metalnessMap = loader.load(import.meta.env.BASE_URL + metalnessMapPath);
        }
    }

    Mesh(): THREE.Mesh {
        let newMesh: THREE.Mesh = new THREE.Mesh(this.geometry, this.materials);
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;
        return newMesh;
    }
}