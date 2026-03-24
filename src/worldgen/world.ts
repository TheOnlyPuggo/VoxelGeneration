import {Vector3, Mesh, Camera, Scene, BoxGeometry, MeshBasicMaterial, Box3, Frustum, Matrix4, Raycaster} from "three";
import * as Blocks from "./blocks";
import {SimplexNoise} from "three/examples/jsm/Addons.js";
import {Chunk, chunkSize} from "./chunk";
import {BlockPos} from "../positions/blockPos";
import {ChunkPos} from "../positions/chunkPos";
import {SubChunkPos} from "../positions/subChunkPos";
import {Block} from "./block";

const hypo = (x: number, y: number, z: number): number => Math.sqrt(x * x + y * y + z * z);

const nextFrame = () =>
    new Promise<void>(resolve =>
        requestAnimationFrame(() => resolve())
    );
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

    readonly worldRadius = 4;

    //readonly chunks: Array<Array<Array<Chunk>>>;
    readonly chunksMap: Map<string, {chunk: Chunk, chunkMesh: Mesh}>;

    private cameraChunkPos: ChunkPos;
    private previousCameraChunkPos: ChunkPos;
    private isGenerating: boolean;

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
        this.isGenerating = false;

        this.chunksMap = new Map<string, {chunk: Chunk, chunkMesh: Mesh}>();
    }

    Update(camera: Camera | null, scene: Scene, currentFrame: number) {
        if (!camera) return;

        this.cameraChunkPos = Chunk.getChunkPosfromCameraPos(camera);
        if (!this.previousCameraChunkPos.compare(this.cameraChunkPos) && !this.isGenerating)  {
            this.isGenerating = true;
            this.previousCameraChunkPos = this.cameraChunkPos.clone();

            this.CreateChunks()
                .then((newChunks) => this.CreateChunkMeshes(scene, newChunks))
                .then(() => this.DeleteOutOfRenderChunks(scene))
                .finally(() => this.isGenerating = false);
        }

        this.FrustumCulling(camera);
        //this.OcclussionCulling(camera, currentFrame);
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

    private async CreateChunks(): Promise<Chunk[]> {
        let newChunks: Chunk[] = [];
        let createCount = 0;

        for (let x = this.cameraChunkPos.x - this.worldRadius; x <= this.cameraChunkPos.x + this.worldRadius; x++) {
            for (let y = this.cameraChunkPos.y - this.worldRadius; y <= this.cameraChunkPos.y + this.worldRadius; y++) {
                for (let z = this.cameraChunkPos.z - this.worldRadius; z <= this.cameraChunkPos.z + this.worldRadius; z++) {
                    if (hypo(
                        x - this.cameraChunkPos.x,
                        y - this.cameraChunkPos.y,
                        z - this.cameraChunkPos.z
                    ) > this.worldRadius) continue;

                    const chunkPos = new ChunkPos(x, y, z);
                    if (!this.chunksMap.has(chunkPos.createKey())) {
                        const chunk = new Chunk(this, chunkPos);

                        this.chunksMap.set(chunkPos.createKey(), {
                            chunk,
                            chunkMesh: new Mesh()
                        });

                        newChunks.push(chunk);

                        ++createCount;

                        if (createCount % 2 === 0) {
                            await nextFrame();
                        }
                    }
                }
            }
        }

        return newChunks;
    }

    private async CreateChunkMeshes(scene: Scene, newChunks: Chunk[]) {
        let createCount = 0;

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

            if (++createCount % 2 === 0) {
                await nextFrame();
            }
        }
    }

    private async DeleteOutOfRenderChunks(scene: Scene) {
        let deleteCount = 0;

        const chunkMapEntries = Array.from(this.chunksMap);
        for (const [chunkPosKey, {chunk, chunkMesh}] of chunkMapEntries) {
            if (hypo(
                chunk.chunkPos.x - this.cameraChunkPos.x,
                chunk.chunkPos.y - this.cameraChunkPos.y,
                chunk.chunkPos.z - this.cameraChunkPos.z
            ) > this.worldRadius) {
                chunkMesh.geometry.dispose();
                scene.remove(chunkMesh);
                this.chunksMap.delete(chunkPosKey);
            }

            ++deleteCount;
            if (deleteCount % 8 === 0) {
                await nextFrame();
            }
        }
    }

    private async FrustumCulling(camera: Camera) {
        const frustum = new Frustum();
        const matrix = new Matrix4();

        matrix.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );

        frustum.setFromProjectionMatrix(matrix);

        for (const { chunkMesh } of this.chunksMap.values()) {
            if (!chunkMesh.geometry.boundingBox) chunkMesh.geometry.computeBoundingBox();

            const box = chunkMesh.geometry.boundingBox!.clone().applyMatrix4(chunkMesh.matrixWorld);
            chunkMesh.visible = frustum.intersectsBox(box);
        }
    }

    private async OcclussionCulling(camera: Camera, currentFrame: number) {
        const frustum = new Frustum();
        const matrix = new Matrix4();
        const raycaster = new Raycaster();

        if (camera.projectionMatrix != null) {
            matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
            frustum.setFromProjectionMatrix(matrix);
        }

        let chunksPerFrame = 3;

        const entries = Array.from(this.chunksMap.values());

        const start = (currentFrame * chunksPerFrame) % entries.length;
        const end = Math.min(start + chunksPerFrame, entries.length);

        for (let i = start; i < end; i++) {
            const {chunk, chunkMesh} = entries[i];

            let isVisible = false;

            let box = new Box3().setFromObject(chunkMesh);
            if (!frustum.intersectsBox(box)) {
                chunkMesh.visible = false;
                continue;
            }

            let points = [];

            points.push(chunkMesh.position.clone().add(new Vector3(chunkSize / 2.0, 0.0, chunkSize / 2.0)));
            points.push(chunkMesh.position.clone().add(new Vector3(chunkSize / 2.0, chunkSize / 2.0, chunkSize / 2.0)));
            points.push(chunkMesh.position.clone().add(new Vector3(chunkSize / 2.0, chunkSize, chunkSize / 2.0)));
            points.push(chunkMesh.position.clone().add(new Vector3(chunkSize / 2.0, chunkSize * 2.0, chunkSize / 2.0)));

            let cameraPos = camera.position as Vector3;
            let occluderMeshes = entries.filter(entry => entry.chunkMesh !== chunkMesh).map(entry => entry.chunkMesh);

            for (let point of points) {
                let rayDir = new Vector3().subVectors(point, cameraPos).normalize();
                raycaster.set(cameraPos, rayDir);

                let intersects = raycaster.intersectObjects(occluderMeshes, false);
                
                if (intersects.length === 0) {
                    // Nothing blocking
                    isVisible = true;
                    break;
                }

                let hit = intersects[0];
                let distanceToPoint = cameraPos.distanceTo(point);
                if (!hit || hit.distance > distanceToPoint) {
                    isVisible = true;
                    break;
                }
            }   
            
            chunkMesh.visible = isVisible;
        }
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