import {Vector3, Mesh, Camera, Scene, BoxGeometry, MeshBasicMaterial, Box3, Frustum, Matrix4, Raycaster} from "three";
import * as Blocks from "./blocks";
import {SimplexNoise} from "three/examples/jsm/Addons.js";
import {Chunk, chunkSize} from "./chunk";
import {BlockPos} from "../positions/blockPos";
import {ChunkPos} from "../positions/chunkPos";
import {SubChunkPos} from "../positions/subChunkPos";
import {Block} from "./block";

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

    readonly worldRadius = 2;

    //readonly chunks: Array<Array<Array<Chunk>>>;
    readonly chunksMap: Map<string, {chunk: Chunk, chunkMesh: Mesh}>;

    private cameraChunkPos: ChunkPos;
    private previousCameraChunkPos: ChunkPos;

    constructor() {
        this.heightNoiseCoarse = new SimplexNoise();
        this.heightNoiseMedium = new SimplexNoise();
        this.heightNoiseFine = new SimplexNoise();
        this.dirtNoise = new SimplexNoise();
        this.caveNoise = new SimplexNoise();
        this.coalNoise = new SimplexNoise();
        this.ironNoise = new SimplexNoise();
        this.cucumberNoise = new SimplexNoise();
        
        this.cameraChunkPos = new ChunkPos(0, 0, 0);
        this.previousCameraChunkPos = this.cameraChunkPos.clone();

        this.chunksMap = new Map<string, {chunk: Chunk, chunkMesh: Mesh}>();
    }

    Update(camera: Camera | null, scene: Scene, currentFrame: number) {
        if (!camera) return;

        this.cameraChunkPos = Chunk.getChunkPosfromCameraPos(camera);
        if (this.previousCameraChunkPos.compare(this.cameraChunkPos)) return;

        this.previousCameraChunkPos = this.cameraChunkPos.clone();

        const newChunks: Chunk[] = [];

        // Chunk Creation
        for (let x = this.cameraChunkPos.x - this.worldRadius; x <= this.cameraChunkPos.x + this.worldRadius; x++) {
            for (let y = this.cameraChunkPos.y - this.worldRadius; y <= this.cameraChunkPos.y + this.worldRadius; y++) {
                for (let z = this.cameraChunkPos.z - this.worldRadius; z <= this.cameraChunkPos.z + this.worldRadius; z++) {
                    const chunkPos = new ChunkPos(x, y, z);
                    if (!this.chunksMap.has(chunkPos.createKey())) {
                        const chunk = new Chunk(this, chunkPos);

                        this.chunksMap.set(chunkPos.createKey(), {
                            chunk,
                            chunkMesh: new Mesh()
                        });

                        newChunks.push(chunk);
                    }
                }
            }
        }

        // Chunk Mesh Creation
        for (const chunk of newChunks) {
            const mesh = chunk.getChunkMesh();
            if (!mesh) continue;

            mesh.position.set(
                chunk.chunkPos.x * chunkSize,
                chunk.chunkPos.y * chunkSize,
                chunk.chunkPos.z * chunkSize
            );

            scene.add(mesh);

            this.chunksMap.get(chunk.chunkPos.createKey())!.chunkMesh = mesh;
        }


        // Deletion of chunks outside radius
        this.chunksMap.forEach(({chunk, chunkMesh}, chunkPosKey) => {
            if (
                chunk.chunkPos.x < this.cameraChunkPos.x - this.worldRadius ||
                chunk.chunkPos.x > this.cameraChunkPos.x + this.worldRadius ||
                chunk.chunkPos.y < this.cameraChunkPos.y - this.worldRadius ||
                chunk.chunkPos.y > this.cameraChunkPos.y + this.worldRadius ||
                chunk.chunkPos.z < this.cameraChunkPos.z - this.worldRadius ||
                chunk.chunkPos.z > this.cameraChunkPos.z + this.worldRadius
            ) {
                chunkMesh.geometry.dispose();
                scene.remove(chunkMesh);
                this.chunksMap.delete(chunkPosKey);
                return;
            }
        });

        // Occlusion Culling
        // const frustum = new Frustum();
        // const matrix = new Matrix4();
        // const raycaster = new Raycaster();

        // if (camera.projectionMatrix != null) {
        //     matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        //     frustum.setFromProjectionMatrix(matrix);
        // }

        // let chunksPerFrame = 3;

        // const entries = Array.from(this.chunksMap.values());

        // const start = (currentFrame * chunksPerFrame) % entries.length;
        // const end = Math.min(start + chunksPerFrame, entries.length);

        // for (let i = start; i < end; i++) {
        //     const {chunk, chunkMesh} = entries[i];

        //     let isVisible = false;

        //     let box = new Box3().setFromObject(chunkMesh);
        //     if (!frustum.intersectsBox(box)) {
        //         chunkMesh.visible = false;
        //         continue;
        //     }

        //     let points = [];

        //     points.push(chunkMesh.position.clone().add(new Vector3(chunkSize / 2.0, 0.0, chunkSize / 2.0)));
        //     points.push(chunkMesh.position.clone().add(new Vector3(chunkSize / 2.0, chunkSize / 2.0, chunkSize / 2.0)));
        //     points.push(chunkMesh.position.clone().add(new Vector3(chunkSize / 2.0, chunkSize, chunkSize / 2.0)));
        //     points.push(chunkMesh.position.clone().add(new Vector3(chunkSize / 2.0, chunkSize * 2.0, chunkSize / 2.0)));

        //     let cameraPos = camera.position as Vector3;
        //     let occluderMeshes = entries.filter(entry => entry.chunkMesh !== chunkMesh).map(entry => entry.chunkMesh);

        //     for (let point of points) {
        //         let rayDir = new Vector3().subVectors(point, cameraPos).normalize();
        //         raycaster.set(cameraPos, rayDir);

        //         let intersects = raycaster.intersectObjects(occluderMeshes, false);
                
        //         if (intersects.length === 0) {
        //             // Nothing blocking
        //             isVisible = true;
        //             break;
        //         }

        //         let hit = intersects[0];
        //         let distanceToPoint = cameraPos.distanceTo(point);
        //         if (!hit || hit.distance > distanceToPoint) {
        //             isVisible = true;
        //             break;
        //         }
        //     }   
            
        //     chunkMesh.visible = isVisible;
        // }
    }

    getTransparentAt(x: number, y: number, z: number): boolean {
        const blockPos = new BlockPos(x, y, z);
        const chunkPos: ChunkPos = blockPos.getChunkPos();
        const subChunkPos: SubChunkPos = blockPos.getSubChunkPos();
        const chunkEntry = this.chunksMap.get(chunkPos.createKey());
        if (!chunkEntry) return this.getBlockToGenerateAt(blockPos).transparent;

        const block = chunkEntry.chunk.blocks[subChunkPos.x][subChunkPos.y][subChunkPos.z];
        if (!block) return true;
        return block.transparent;
    }

    private getHeightAt(x: number, z: number): number {
        return Math.round(heightGen.amplitude *
            this.heightNoiseCoarse.noise(x / heightGen.size, z / heightGen.size) +
            heightGen.amplitude * heightGen.mediumFactor *
            this.heightNoiseMedium.noise(x / (heightGen.size * heightGen.mediumFactor), z / (heightGen.size * heightGen.mediumFactor)) +
            heightGen.amplitude * heightGen.fineFactor *
            this.heightNoiseFine.noise(x / (heightGen.size * heightGen.fineFactor), z / (heightGen.size * heightGen.fineFactor)) + heightGen.base);
    }

    private getDirtThicknessAt(x: number, z: number): number {
        return Math.round(dirtGen.amplitude * this.dirtNoise.noise(x / dirtGen.size, z / dirtGen.size) + dirtGen.base);
    }

    private getCaveAt(blockPos: BlockPos): boolean {
        return this.caveNoise.noise3d(blockPos.x / caveGen.size, blockPos.y / caveGen.size, blockPos.z / caveGen.size) < caveGen.max;
    }

    private getCoalAt(blockPos: BlockPos): boolean {
        return this.coalNoise.noise3d(blockPos.x / coalGen.size, blockPos.y / coalGen.size, blockPos.z / coalGen.size) < coalGen.max && blockPos.y < coalGen.maxHeight;
    }

    private getIronAt(blockPos: BlockPos): boolean {
        return this.ironNoise.noise3d(blockPos.x / ironGen.size, blockPos.y / ironGen.size, blockPos.z / ironGen.size) < ironGen.max && blockPos.y < ironGen.maxHeight;
    }

    private getCucumberAt(blockPos: BlockPos): boolean {
        return this.cucumberNoise.noise3d(blockPos.x / cucumberGen.size, blockPos.y / cucumberGen.size, blockPos.z / cucumberGen.size) < cucumberGen.max && blockPos.y < cucumberGen.maxHeight;
    }
    
    getBlockToGenerateAt(blockPos: BlockPos): Block {
        let height: number = this.getHeightAt(blockPos.x, blockPos.z) - blockPos.y;
        let dirtHeight: number = height - this.getDirtThicknessAt(blockPos.x, blockPos.z);

        if (height < 0 || this.getCaveAt(blockPos)) return Blocks.AIR;
        else if (height === 0) return Blocks.GRASS;
        else if (dirtHeight <= 0) return Blocks.DIRT;
        else if (this.getCoalAt(blockPos)) return Blocks.COAL;
        else if (this.getIronAt(blockPos)) return Blocks.IRON;
        else if (this.getCucumberAt(blockPos)) return Blocks.CUCUMBER;
        else return Blocks.STONE;
    }
}