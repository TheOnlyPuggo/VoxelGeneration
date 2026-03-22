import * as THREE from 'three';
import * as SimplexNoise from 'three/examples/jsm/Addons.js';
import * as Chunk from './chunk';

export const worldSize = new THREE.Vector3(5, 8, 5);
export const heightGen = {
    base: 64,
    amplitude: 6,
    size: 32,
    mediumFactor: 0.5,
    fineFactor: 0.25
}
export const dirtGen = {
    base: 3,
    amplitude: 2,
    size: 20
}
export const caveGen = {
    max: -0.7,
    size: 20
}
export const coalGen = {
    max: -0.8,
    maxHeight: 80,
    size: 16
}
export const ironGen = {
    max: -0.9,
    maxHeight: 40,
    size: 16
}
export const cucumberGen = {
    max: -0.95,
    maxHeight: 20,
    size: 16
}

export class World {
    heightNoiseCoarse: SimplexNoise.SimplexNoise;
    heightNoiseMedium: SimplexNoise.SimplexNoise;
    heightNoiseFine: SimplexNoise.SimplexNoise;
    dirtNoise: SimplexNoise.SimplexNoise;
    caveNoise: SimplexNoise.SimplexNoise;
    coalNoise: SimplexNoise.SimplexNoise;
    ironNoise: SimplexNoise.SimplexNoise;
    cucumberNoise: SimplexNoise.SimplexNoise;
    chunks: Array<Array<Array<Chunk.Chunk>>>;

    constructor() {
        this.heightNoiseCoarse = new SimplexNoise.SimplexNoise();
        this.heightNoiseMedium = new SimplexNoise.SimplexNoise();
        this.heightNoiseFine = new SimplexNoise.SimplexNoise();
        this.dirtNoise = new SimplexNoise.SimplexNoise();
        this.caveNoise = new SimplexNoise.SimplexNoise();
        this.coalNoise = new SimplexNoise.SimplexNoise();
        this.ironNoise = new SimplexNoise.SimplexNoise();
        this.cucumberNoise = new SimplexNoise.SimplexNoise();

        this.chunks = [];
        for (let x = 0; x < worldSize.x; x++) {
            this.chunks.push([]);
            for (let y = 0; y < worldSize.y; y++) {
                this.chunks[x].push([]);
                for (let z = 0; z < worldSize.z; z++) {
                    this.chunks[x][y].push(new Chunk.Chunk(this, new THREE.Vector3(x, y, z)));
                }
            }
        }
    }

    getMeshes() {
        var meshes = [];
        var matrix = new THREE.Matrix4();
        for (let x = 0; x < this.chunks.length; x++) {
            for (let y = 0; y < this.chunks[0].length; y++) {
                for (let z = 0; z < this.chunks[0][0].length; z++) {
                    var mesh = this.chunks[x][y][z].getMesh();
                    if (mesh == null) continue;
                    matrix.makeTranslation(x * Chunk.chunkSize, y * Chunk.chunkSize, z * Chunk.chunkSize);
                    mesh.applyMatrix4(matrix);
                    meshes.push(mesh);
                }
            }
        }
        return meshes;
    }

    getChunkPos(worldPos: THREE.Vector3) {
        return worldPos.clone().divideScalar(Chunk.chunkSize).floor();
    }

    getInternalPos(worldPos: THREE.Vector3) {
        return worldPos.clone().sub(this.getChunkPos(worldPos).multiplyScalar(Chunk.chunkSize));
    }

    getOpacityAt(worldPos: THREE.Vector3) {
        var chunkPos = this.getChunkPos(worldPos);
        if (chunkPos.x < 0 || chunkPos.x >= this.chunks.length ||
            chunkPos.y < 0 || chunkPos.y >= this.chunks[0].length ||
            chunkPos.z < 0 || chunkPos.z >= this.chunks[0][0].length) return 0;
        return this.chunks[chunkPos.x][chunkPos.y][chunkPos.z].getOpacityAt(this.getInternalPos(worldPos));
    }

    getHeightAt(x: number, z: number) {
        return Math.round(heightGen.amplitude *
            this.heightNoiseCoarse.noise(x / heightGen.size, z / heightGen.size) +
            heightGen.amplitude * heightGen.mediumFactor *
            this.heightNoiseMedium.noise(x / (heightGen.size * heightGen.mediumFactor), z / (heightGen.size * heightGen.mediumFactor)) +
            heightGen.amplitude * heightGen.fineFactor *
            this.heightNoiseFine.noise(x / (heightGen.size * heightGen.fineFactor), z / (heightGen.size * heightGen.fineFactor)) + heightGen.base);
    }

    getDirtThicknessAt(x: number, z: number) {
        return Math.round(dirtGen.amplitude * this.dirtNoise.noise(x / dirtGen.size, z / dirtGen.size) + dirtGen.base);
    }

    getCaveAt(worldPos: THREE.Vector3) {
        return this.dirtNoise.noise3d(worldPos.x / caveGen.size, worldPos.y / caveGen.size, worldPos.z / caveGen.size) < caveGen.max;
    }

    getCoalAt(worldPos: THREE.Vector3) {
        return this.coalNoise.noise3d(worldPos.x / coalGen.size, worldPos.y / coalGen.size, worldPos.z / coalGen.size) < coalGen.max && worldPos.y < coalGen.maxHeight;
    }

    getIronAt(worldPos: THREE.Vector3) {
        return this.ironNoise.noise3d(worldPos.x / ironGen.size, worldPos.y / ironGen.size, worldPos.z / ironGen.size) < ironGen.max && worldPos.y < ironGen.maxHeight;
    }

    getCucumberAt(worldPos: THREE.Vector3) {
        return this.cucumberNoise.noise3d(worldPos.x / cucumberGen.size, worldPos.y / cucumberGen.size, worldPos.z / cucumberGen.size) < cucumberGen.max && worldPos.y < cucumberGen.maxHeight;
    }
}