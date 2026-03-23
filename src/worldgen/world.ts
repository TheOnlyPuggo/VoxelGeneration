import {Vector3, Mesh} from "three";
import {SimplexNoise} from "three/examples/jsm/Addons.js";
import {Chunk, chunkSize} from "./chunk";
import {BlockPos} from "../positions/blockPos";
import {ChunkPos} from "../positions/chunkPos";
import {SubChunkPos} from "../positions/subChunkPos";

export const worldSize = new Vector3(5, 8, 5);
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
    private readonly heightNoiseCoarse: SimplexNoise;
    private readonly heightNoiseMedium: SimplexNoise;
    private readonly heightNoiseFine: SimplexNoise;
    private readonly dirtNoise: SimplexNoise;
    private readonly caveNoise: SimplexNoise;
    private readonly coalNoise: SimplexNoise;
    private readonly ironNoise: SimplexNoise;
    private readonly cucumberNoise: SimplexNoise;

    readonly chunks: Array<Array<Array<Chunk>>>;

    constructor() {
        this.heightNoiseCoarse = new SimplexNoise();
        this.heightNoiseMedium = new SimplexNoise();
        this.heightNoiseFine = new SimplexNoise();
        this.dirtNoise = new SimplexNoise();
        this.caveNoise = new SimplexNoise();
        this.coalNoise = new SimplexNoise();
        this.ironNoise = new SimplexNoise();
        this.cucumberNoise = new SimplexNoise();

        this.chunks = [];
        for (let x: number = 0; x < worldSize.x; x++) {
            this.chunks.push([]);
            for (let y: number = 0; y < worldSize.y; y++) {
                this.chunks[x].push([]);
                for (let z: number = 0; z < worldSize.z; z++) {
                    this.chunks[x][y].push(new Chunk(this, new ChunkPos(x, y, z)));
                }
            }
        }
    }

    getMeshes(): Mesh[] {
        let meshes: Mesh[] = [];
        for (let x: number = 0; x < this.chunks.length; x++) {
            for (let y: number = 0; y < this.chunks[0].length; y++) {
                for (let z: number = 0; z < this.chunks[0][0].length; z++) {
                    let mesh = this.chunks[x][y][z].getChunkMesh();
                    if (mesh == null) continue;

                    mesh.translateX(x * chunkSize);
                    mesh.translateY(y * chunkSize);
                    mesh.translateZ(z * chunkSize);
                    meshes.push(mesh);
                }
            }
        }
        return meshes;
    }

    getTransparentAt(blockPos: BlockPos): boolean {
        let chunkPos: ChunkPos = blockPos.getChunkPos();
        let subChunkPos: SubChunkPos = blockPos.getSubChunkPos();
        if (chunkPos.x < 0 || chunkPos.x >= this.chunks.length ||
            chunkPos.y < 0 || chunkPos.y >= this.chunks[0].length ||
            chunkPos.z < 0 || chunkPos.z >= this.chunks[0][0].length) return true;
        return this.chunks[chunkPos.x][chunkPos.y][chunkPos.z].blocks[subChunkPos.x][subChunkPos.y][subChunkPos.z].transparent;
    }

    getHeightAt(x: number, z: number): number {
        return Math.round(heightGen.amplitude *
            this.heightNoiseCoarse.noise(x / heightGen.size, z / heightGen.size) +
            heightGen.amplitude * heightGen.mediumFactor *
            this.heightNoiseMedium.noise(x / (heightGen.size * heightGen.mediumFactor), z / (heightGen.size * heightGen.mediumFactor)) +
            heightGen.amplitude * heightGen.fineFactor *
            this.heightNoiseFine.noise(x / (heightGen.size * heightGen.fineFactor), z / (heightGen.size * heightGen.fineFactor)) + heightGen.base);
    }

    getDirtThicknessAt(x: number, z: number): number {
        return Math.round(dirtGen.amplitude * this.dirtNoise.noise(x / dirtGen.size, z / dirtGen.size) + dirtGen.base);
    }

    getCaveAt(blockPos: BlockPos): boolean {
        return this.dirtNoise.noise3d(blockPos.x / caveGen.size, blockPos.y / caveGen.size, blockPos.z / caveGen.size) < caveGen.max;
    }

    getCoalAt(blockPos: BlockPos): boolean {
        return this.coalNoise.noise3d(blockPos.x / coalGen.size, blockPos.y / coalGen.size, blockPos.z / coalGen.size) < coalGen.max && blockPos.y < coalGen.maxHeight;
    }

    getIronAt(blockPos: BlockPos): boolean {
        return this.ironNoise.noise3d(blockPos.x / ironGen.size, blockPos.y / ironGen.size, blockPos.z / ironGen.size) < ironGen.max && blockPos.y < ironGen.maxHeight;
    }

    getCucumberAt(blockPos: BlockPos): boolean {
        return this.cucumberNoise.noise3d(blockPos.x / cucumberGen.size, blockPos.y / cucumberGen.size, blockPos.z / cucumberGen.size) < cucumberGen.max && blockPos.y < cucumberGen.maxHeight;
    }
}