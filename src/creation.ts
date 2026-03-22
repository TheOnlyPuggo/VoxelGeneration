import * as THREE from 'three';

export class CuboidMesh {
    width: number;
    height: number;
    depth: number;
    faces: {
        px: number,
        nx: number,
        py: number,
        ny: number,
        pz: number,
        nz: number,
    };
    materials: THREE.MeshStandardMaterial[];
    geometry: THREE.BoxGeometry;

    constructor(
        width: number, 
        height: number, 
        depth: number,
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
        this.faces = faces;

        this.materials = [new THREE.MeshStandardMaterial()];
        this.geometry = new THREE.BoxGeometry(width, height, depth);
    }

    HandleTransparency() {
        this.materials.forEach(material => {
            material.transparent = true;
        });

        if (this.materials.length >= 1) this.materials[0].opacity = this.faces.px === 0 ? 0.0 : 1.0;
        if (this.materials.length >= 2) this.materials[1].opacity = this.faces.nx === 0 ? 0.0 : 1.0;
        if (this.materials.length >= 3) this.materials[2].opacity = this.faces.py === 0 ? 0.0 : 1.0;
        if (this.materials.length >= 4) this.materials[3].opacity = this.faces.ny === 0 ? 0.0 : 1.0;
        if (this.materials.length >= 5) this.materials[4].opacity = this.faces.pz === 0 ? 0.0 : 1.0;
        if (this.materials.length >= 6) this.materials[5].opacity = this.faces.nz === 0 ? 0.0 : 1.0;
    }

    Mesh(): THREE.Mesh {
        return new THREE.Mesh();
    }
};


export class CuboidMeshOneColor extends CuboidMesh {
    color: THREE.Color;
    isWireFrame: boolean;

    constructor(
        width: number, 
        height: number, 
        depth: number, 
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
            px: 1.0,
            nx: 1.0,
            py: 1.0,
            ny: 1.0,
            pz: 1.0,
            nz: 1.0
        },
    ) {
        super(width, height, depth, faces);
        this.color = color;
        this.isWireFrame = isWireFrame;

        this.materials = [new THREE.MeshStandardMaterial({color: color})]
        this.geometry = new THREE.BoxGeometry(width, height, depth);

        this.HandleTransparency();
    }

    Mesh(): THREE.Mesh {
        return new THREE.Mesh(this.geometry, this.materials[0]);
    }
}
export class CuboidMeshOneTexture extends CuboidMesh {
    texturePath: string;

    constructor(
        width: number, 
        height: number, 
        depth: number,
        texturePath: string,
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
        },
    ) {
        super(width, height, depth, faces);
        this.texturePath = texturePath;
        this.geometry = new THREE.BoxGeometry(width, height, depth);

        const loader = new THREE.TextureLoader();
        this.materials = [new THREE.MeshStandardMaterial()];
        this.materials[0].map = loader.load(import.meta.env.BASE_URL + texturePath);

        this.HandleTransparency();
    }

    Mesh(): THREE.Mesh {
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
            px: 1.0,
            nx: 1.0,
            py: 1.0,
            ny: 1.0,
            pz: 1.0,
            nz: 1.0
        }
    ) {
        super(width, height, depth, faces);
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

        this.HandleTransparency();
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

    constructor(
        width: number, 
        height: number, 
        depth: number,
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
        super(width, height, depth, faces);
        this.colorPath = colorPath;
        this.normalMapPath = normalMapPath;
        this.metalnessMapPath = metalnessMapPath;

        const loader: THREE.TextureLoader = new THREE.TextureLoader();
        this.geometry = new THREE.BoxGeometry(width, height, depth);
        this.materials = [new THREE.MeshStandardMaterial()];
        this.materials[0].map = loader.load(import.meta.env.BASE_URL + colorPath);
        this.materials[0].normalMap = loader.load(import.meta.env.BASE_URL + normalMapPath);
        this.materials[0].metalnessMap = loader.load(import.meta.env.BASE_URL + metalnessMapPath);

        this.HandleTransparency();
    }

    Mesh(): THREE.Mesh {
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
        super(width, height, depth, faces);
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

        this.HandleTransparency();
    }

    Mesh(): THREE.Mesh {
        let newMesh: THREE.Mesh = new THREE.Mesh(this.geometry, this.materials);
        newMesh.castShadow = true;
        newMesh.receiveShadow = true;
        return newMesh;
    }
}