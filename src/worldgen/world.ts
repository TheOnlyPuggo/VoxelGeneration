import {
    Vector3,
    Mesh,
    Camera,
    Scene,
    Box3,
    Frustum,
    Matrix4,
    Raycaster,
} from "three";
import * as Blocks from "./blocks";
import {SimplexNoise} from "three/examples/jsm/Addons.js";
import {Chunk, chunkSize} from "./chunk";
import {BlockPos} from "../positions/blockPos";
import {ChunkPos} from "../positions/chunkPos";
import {SubChunkPos} from "../positions/subChunkPos";
import {Block} from "./block";
import {Model} from "../geometry/modelCreation";
import {Vec3} from "../positions/vec3";
import {ChunkSave} from "./chunkSave";

const hypo = (x: number, y: number, z: number): number => Math.sqrt(x * x + y * y + z * z);

const nextFrame = () =>
    new Promise<void>(resolve =>
        requestAnimationFrame(() => resolve())
    );
export const worldSize = new Vector3(5, 8, 5);
export const heightGen = {
    base: 64,
    amplitude: 3,
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
    readonly chunksMap: Map<string, {chunk: Chunk, chunkMeshes: Mesh[]}>;
    readonly chunkSaveMap: Map<string, ChunkSave>;

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
        this.previousCameraChunkPos = this.cameraChunkPos;
        this.isGenerating = false;

        this.chunksMap = new Map<string, {chunk: Chunk, chunkMeshes: Mesh[]}>();
        this.chunkSaveMap = new Map<string, ChunkSave>();
    }

    Update(camera: Camera | null, scene: Scene) {
        if (!camera) return;

        this.cameraChunkPos = Chunk.getChunkPosfromCameraPos(camera);
        if (!this.previousCameraChunkPos.equals(this.cameraChunkPos) && !this.isGenerating)  {
            this.isGenerating = true;
            this.previousCameraChunkPos = this.cameraChunkPos;

            this.CreateChunks()
                .then((newChunks) => this.CreateChunkMeshes(scene, newChunks))
                .then(() => this.DeleteOutOfRenderChunks(scene))
                .finally(() => this.isGenerating = false);
        }

        this.FrustumCulling(camera);
    }

    private addChunkMeshes(scene: Scene, chunkPosKey: string, meshes: Mesh[] | undefined): void {
        const chunkEntry = this.chunksMap.get(chunkPosKey);
        if (!chunkEntry || !meshes) return;
        for (const mesh of meshes) scene.add(mesh);
        chunkEntry.chunkMeshes = meshes;
    }

    private removeChunkMeshes(scene: Scene, chunkPosKey: string): void {
        const chunkEntry = this.chunksMap.get(chunkPosKey);
        if (!chunkEntry) return;
        for (const mesh of chunkEntry.chunkMeshes) {
            mesh.geometry.dispose();
            scene.remove(mesh);
        }
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
                    let chunkPosKey = chunkPos.getKey();
                    if (!this.chunksMap.has(chunkPosKey)) {
                        const chunk = new Chunk(this, chunkPos, this.chunkSaveMap.get(chunkPosKey));

                        this.chunksMap.set(chunkPos.getKey(), {
                            chunk,
                            chunkMeshes: []
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
            this.addChunkMeshes(scene, chunk.chunkPos.getKey(), chunk.getChunkMeshes());

            if (++createCount % 2 === 0) {
                await nextFrame();
            }
        }
    }

    private async DeleteOutOfRenderChunks(scene: Scene) {
        let deleteCount = 0;

        const chunkMapEntries = Array.from(this.chunksMap);
        for (const [chunkPosKey, {chunk, chunkMeshes}] of chunkMapEntries) {
            if (hypo(
                chunk.chunkPos.x - this.cameraChunkPos.x,
                chunk.chunkPos.y - this.cameraChunkPos.y,
                chunk.chunkPos.z - this.cameraChunkPos.z
            ) > this.worldRadius) {
                this.removeChunkMeshes(scene, chunkPosKey);
                this.chunksMap.delete(chunkPosKey);
            }

            ++deleteCount;
            if (deleteCount % 8 === 0) {
                await nextFrame();
            }
        }
    }

    private updateChunkMesh(scene: Scene, chunkPos: ChunkPos): void {
        let chunkPosKey: string = chunkPos.getKey();
        let chunkEntry = this.chunksMap.get(chunkPosKey);
        if (!chunkEntry) return;
        this.removeChunkMeshes(scene, chunkPosKey);

        this.addChunkMeshes(scene, chunkPosKey, chunkEntry.chunk.getChunkMeshes());
    }

    private async FrustumCulling(camera: Camera) {
        const frustum = new Frustum();
        const matrix = new Matrix4();

        matrix.multiplyMatrices(
            camera.projectionMatrix,
            camera.matrixWorldInverse
        );

        frustum.setFromProjectionMatrix(matrix);

        for (const { chunkMeshes } of this.chunksMap.values()) {
            for (const chunkMesh of chunkMeshes) {
                if (!chunkMesh.geometry.boundingBox) chunkMesh.geometry.computeBoundingBox();

                const box = chunkMesh.geometry.boundingBox!.clone().applyMatrix4(chunkMesh.matrixWorld);
                chunkMesh.visible = frustum.intersectsBox(box);
            }
        }
    }

    // private async OcclussionCulling(camera: Camera, currentFrame: number) {
    //     const frustum = new Frustum();
    //     const matrix = new Matrix4();
    //     const raycaster = new Raycaster();
    //
    //     if (camera.projectionMatrix != null) {
    //         matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    //         frustum.setFromProjectionMatrix(matrix);
    //     }
    //
    //     let chunksPerFrame = 3;
    //
    //     const entries = Array.from(this.chunksMap.values());
    //
    //     const start = (currentFrame * chunksPerFrame) % entries.length;
    //     const end = Math.min(start + chunksPerFrame, entries.length);
    //
    //     for (let i = start; i < end; i++) {
    //         const {chunk, chunkMesh} = entries[i];
    //
    //         let isVisible = false;
    //
    //         let box = new Box3().setFromObject(chunkMesh);
    //         if (!frustum.intersectsBox(box)) {
    //             chunkMesh.visible = false;
    //             continue;
    //         }
    //
    //         let points = [];
    //
    //         points.push(chunkMesh.position.clone().add(new Vector3(chunkSize / 2.0, 0.0, chunkSize / 2.0)));
    //         points.push(chunkMesh.position.clone().add(new Vector3(chunkSize / 2.0, chunkSize / 2.0, chunkSize / 2.0)));
    //         points.push(chunkMesh.position.clone().add(new Vector3(chunkSize / 2.0, chunkSize, chunkSize / 2.0)));
    //         points.push(chunkMesh.position.clone().add(new Vector3(chunkSize / 2.0, chunkSize * 2.0, chunkSize / 2.0)));
    //
    //         let cameraPos = camera.position as Vector3;
    //         let occluderMeshes = entries.filter(entry => entry.chunkMesh !== chunkMesh).map(entry => entry.chunkMesh);
    //
    //         for (let point of points) {
    //             let rayDir = new Vector3().subVectors(point, cameraPos).normalize();
    //             raycaster.set(cameraPos, rayDir);
    //
    //             let intersects = raycaster.intersectObjects(occluderMeshes, false);
    //
    //             if (intersects.length === 0) {
    //                 // Nothing blocking
    //                 isVisible = true;
    //                 break;
    //             }
    //
    //             let hit = intersects[0];
    //             let distanceToPoint = cameraPos.distanceTo(point);
    //             if (!hit || hit.distance > distanceToPoint) {
    //                 isVisible = true;
    //                 break;
    //             }
    //         }
    //
    //         chunkMesh.visible = isVisible;
    //     }
    // }

    public getHeightAt(x: number, z: number): number {
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
        let blockToPush = this.getTerrainBlockToGenerateAt(blockPos);
        if (blockToPush == Blocks.AIR) blockToPush = this.getStructureBlockToGenerateAt(blockPos);
        return blockToPush;
    }
    
    getTerrainBlockToGenerateAt(blockPos: BlockPos): Block {
        let height: number = this.getHeightAt(blockPos.x, blockPos.z) - blockPos.y;
        let dirtHeight: number = height - this.getDirtThicknessAt(blockPos.x, blockPos.z);

        if (height < 0 || this.getCaveAt(blockPos)) return Blocks.AIR;
        else if (height === 0) return Blocks.GRASS;
        else if (dirtHeight <= 0) return Blocks.DIRT;
        else if (this.getCoalAt(blockPos)) return Blocks.COAL;
        else if (this.getIronAt(blockPos)) return Blocks.IRON;
        else if (this.getCucumberAt(blockPos)) return Blocks.CUCUMBER;
        return Blocks.STONE;
    }

    getStructureBlockToGenerateAt(blockPos: BlockPos): Block {
        let structureBlock: Block | null = null;

        Model.manualModelsToLoad.forEach((modelData) => {
            let distanceCalcPos1: Vector3 = new Vector3(blockPos.x, blockPos.y, blockPos.z);
            let distanceCalcPos2: Vector3 = new Vector3(modelData[0].x, modelData[0].y, modelData[0].z);

            if (distanceCalcPos1.distanceTo(distanceCalcPos2) > 256.0) return;

            let foundStructureBlock = modelData[1][blockPos.getKey()];
            if (foundStructureBlock == null) return;

            structureBlock = foundStructureBlock;
        });

        if (structureBlock != null) return structureBlock;
        return Blocks.AIR;
    }

    public getBlockAt(blockPos: BlockPos): Block {
        const chunkSave = this.chunkSaveMap.get(blockPos.getChunkPos().getKey());
        let diff: Block | undefined;
        if (chunkSave && (diff = chunkSave.getDiff(blockPos.getSubChunkPos()))) {
            return diff;
        }
        return this.getBlockToGenerateAt(blockPos);
    }

    public setBlockAt(blockPos: BlockPos, blockType: Block, scene: Scene | null): void {
        const chunkPos = blockPos.getChunkPos();
        const chunkPosKey = chunkPos.getKey();
        const subChunkPos = blockPos.getSubChunkPos();
        const chunkEntry = this.chunksMap.get(chunkPosKey);
        if (!chunkEntry) {
            let chunkSave = this.chunkSaveMap.get(chunkPosKey);
            if (!chunkSave) {
                if (this.getBlockToGenerateAt(blockPos) === blockType) return;
                chunkSave = new ChunkSave();
                chunkSave.setBlockAt(subChunkPos, blockType);
                this.chunkSaveMap.set(chunkPosKey, chunkSave);
                return;
            }
            if (this.getBlockToGenerateAt(blockPos) === blockType) chunkSave.setBlockAt(subChunkPos, undefined);
            else chunkSave.setBlockAt(subChunkPos, blockType);
            return;
        }
        chunkEntry.chunk.setBlockAt(subChunkPos, blockType, blockType == this.getBlockToGenerateAt(blockPos));
        if (scene) this.updateChunkMesh(scene, chunkPos);
        const save = chunkEntry.chunk.getSave();
        if (save) this.chunkSaveMap.set(chunkPosKey, save);
        else this.chunkSaveMap.delete(chunkPosKey);
    }

    // Technically not a raycast but like it does the same thing but better, so I'm calling it one
    public raycastForVisibleBlock(startPos: Vec3, direction: Vec3, range: number): BlockPos[] | undefined {
        let checkedBlocks: BlockPos[] = [];
        let currentPos: BlockPos = BlockPos.roundFromVec3(startPos);
        checkedBlocks.push(currentPos);
        if (this.getBlockAt(currentPos).getVisible()) return checkedBlocks;

        const endPos: Vec3 = startPos.add(direction.normalize().multiply(range));
        const xOverlaps: number[] = World.getRaycastOverlaps(startPos.x, endPos.x, direction.x);
        const yOverlaps: number[] = World.getRaycastOverlaps(startPos.y, endPos.y, direction.y);
        const zOverlaps: number[] = World.getRaycastOverlaps(startPos.z, endPos.z, direction.z);

        for (let i = 0; xOverlaps.length + yOverlaps.length + zOverlaps.length > 0; i++) {
            if (xOverlaps.length > 0 &&
                (yOverlaps.length == 0 || xOverlaps[0] < yOverlaps[0]) &&
                (zOverlaps.length == 0 || xOverlaps[0] < zOverlaps[0])) {
                if (direction.x < 0) currentPos = currentPos.subtractX(1);
                else currentPos = currentPos.addX(1);
                xOverlaps.shift();
            } else if (yOverlaps.length > 0 && (zOverlaps.length == 0 || yOverlaps[0] < zOverlaps[0])) {
                if (direction.y < 0) currentPos = currentPos.subtractY(1);
                else currentPos = currentPos.addY(1);
                yOverlaps.shift();
            } else {
                if (direction.z < 0) currentPos = currentPos.subtractZ(1);
                else currentPos = currentPos.addZ(1);
                zOverlaps.shift();
            }

            checkedBlocks.push(currentPos);
            if (this.getBlockAt(currentPos).getVisible()) return checkedBlocks;
        }

        return undefined;
    }

    private static getRaycastOverlaps(startPos: number, endPos: number, direction: number): number[] {
        if (direction === 0) return [];

        let overlaps: number[] = [];
        if (direction > 0) {
            for (let pos = Math.ceil(startPos + 0.5) - 0.5; pos <= endPos; pos++) {
                overlaps.push((pos - startPos) / direction);
            }
        } else if (direction < 0) {
            for (let pos = Math.floor(startPos - 0.5) + 0.5; pos >= endPos; pos--) {
                overlaps.push((pos - startPos) / direction);
            }
        }
        return overlaps;
    }
}