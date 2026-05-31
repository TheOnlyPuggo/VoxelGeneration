import {Mesh, Camera, Scene, Frustum, Matrix4} from "three";
import * as Blocks from "./blocks";
import {SimplexNoise} from "three/examples/jsm/Addons.js";
import {Chunk} from "./chunk";
import {BlockPos} from "../positions/blockPos";
import {ChunkPos} from "../positions/chunkPos";
import {Block} from "./block";
import { seededRandom } from "three/src/math/MathUtils.js";
import {Model} from "../geometry/modelCreation";
import {Vec3} from "../positions/vec3";
import {ChunkSave} from "./chunkSave";
import { Vec2 } from "../positions/vec2";

const hypo = (x: number, y: number, z: number): number => Math.sqrt(x * x + y * y + z * z);

const nextFrame = () =>
    new Promise<void>(resolve =>
        requestAnimationFrame(() => resolve())
    );
export const heightGen = {
    base: 64,
    amplitude: 2,
    size: 128,
    mediumFactor: 0.5,
    fineFactor: 0.25,
    mountainHeight: 64,
    snowHeight: 80
}
export const biomeGen = {
    shorelineFactor: 0.8,
    oceanDepth: 3
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
export const worleyGridOffsets = [
    new Vec2(-1, 1),
    new Vec2(-1, 0),
    new Vec2(-1, -1),
    new Vec2(0, 1),
    new Vec2(0, -1),
    new Vec2(1, 1),
    new Vec2(1, 0),
    new Vec2(1, -1),
]
export enum BiomeTypes {
    Desert,
    Plains,
    Mountain,
    Ocean,
    Underground
}
export class BiomeDistance {
    public distance: number;
    public biome: BiomeTypes;
    constructor(d: number, b: BiomeTypes){
        this.distance = d;
        this.biome = b;
    }
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
    private readonly worleyXNoise: SimplexNoise;
    private readonly worleyZNoise: SimplexNoise;
    private readonly worleyBiome: SimplexNoise;
    private readonly mountainHeightNoise: SimplexNoise;
    private readonly snowHeightNoise: SimplexNoise;

    private readonly structureNoise: SimplexNoise;

    readonly worldRadius = 4;
    private worleyGridSize: number = 64;

    //readonly chunks: Array<Array<Array<Chunk>>>;
    readonly chunksMap: Map<string, {chunk: Chunk, chunkMeshes: Mesh[]}>;
    readonly chunkSaveMap: Map<string, ChunkSave>;

    private cameraChunkPos: ChunkPos;
    private previousCameraChunkPos: ChunkPos;
    private previousStructureCameraChunkPos: ChunkPos;
    private isGenerating: boolean;

    private firstStructureGeneration: boolean;
    private readonly maxAmountOfStoredStructureBlocks: number = 1000;

    constructor() {
        this.heightNoiseCoarse = new SimplexNoise();
        this.heightNoiseMedium = new SimplexNoise();
        this.heightNoiseFine = new SimplexNoise();
        this.dirtNoise = new SimplexNoise();
        this.caveNoise = new SimplexNoise();
        this.coalNoise = new SimplexNoise();
        this.ironNoise = new SimplexNoise();
        this.cucumberNoise = new SimplexNoise();

        this.worleyXNoise = new SimplexNoise();
        this.worleyZNoise = new SimplexNoise();
        this.worleyBiome = new SimplexNoise();
        this.mountainHeightNoise = new SimplexNoise();
        this.snowHeightNoise = new SimplexNoise();

        this.structureNoise = new SimplexNoise();

        this.cameraChunkPos = new ChunkPos(0, 0, 0);
        this.previousCameraChunkPos = this.cameraChunkPos;
        this.previousStructureCameraChunkPos = this.cameraChunkPos;
        this.isGenerating = false;

        this.chunksMap = new Map<string, {chunk: Chunk, chunkMeshes: Mesh[]}>();
        this.chunkSaveMap = new Map<string, ChunkSave>();


        this.firstStructureGeneration = true;
    }

    async Update(camera: Camera | null, scene: Scene) {
        if (!camera) return;

        this.cameraChunkPos = Chunk.getChunkPosfromCameraPos(camera);
        if (!this.previousCameraChunkPos.equals(this.cameraChunkPos) && !this.isGenerating)  {
            this.isGenerating = true;

            await this.generateStructureData();
            const newChunks = await this.CreateChunks();
            await this.CreateChunkMeshes(scene, newChunks);
            await this.DeleteOutOfRenderChunks(scene);
            await this.deleteOutOfRangeStructureData();

            this.isGenerating = false;
            this.previousCameraChunkPos = this.cameraChunkPos;
        }

        //this.FrustumCulling(camera);
    }

    private addChunkMeshes(scene: Scene, chunkEntry: { chunk: Chunk, chunkMeshes: Mesh[] } | undefined): void {
        if (!chunkEntry) return;
        const meshes: Mesh[] | undefined = chunkEntry?.chunk.getChunkMeshes();
        if (!meshes) return;
        for (const mesh of meshes) scene.add(mesh);
        chunkEntry.chunkMeshes = meshes;
    }

    private removeChunkMeshes(scene: Scene, chunkEntry: { chunk: Chunk, chunkMeshes: Mesh[] } | undefined): void {
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

                        await nextFrame();
                    }
                }
            }
        }

        return newChunks;
    }

    private async CreateChunkMeshes(scene: Scene, newChunks: Chunk[]) {
        let createCount = 0;

        for (const chunk of newChunks) {
            this.addChunkMeshes(scene, this.chunksMap.get(chunk.chunkPos.getKey()));

            if (++createCount % 2 === 0) {
                await nextFrame();
            }
        }
    }

    private async DeleteOutOfRenderChunks(scene: Scene) {
        let deleteCount = 0;

        const chunkMapEntries = Array.from(this.chunksMap);
        for (const [chunkPosKey, chunkEntry] of chunkMapEntries) {
            if (hypo(
                chunkEntry.chunk.chunkPos.x - this.cameraChunkPos.x,
                chunkEntry.chunk.chunkPos.y - this.cameraChunkPos.y,
                chunkEntry.chunk.chunkPos.z - this.cameraChunkPos.z
            ) > this.worldRadius) {
                this.removeChunkMeshes(scene, chunkEntry);
                this.chunksMap.delete(chunkPosKey);
            }

            ++deleteCount;
            if (deleteCount % 8 === 0) {
                await nextFrame();
            }
        }
    }

    public async updateChunkMesh(scene: Scene, chunkPos: ChunkPos) {
        let minimumX = chunkPos.x * Chunk.chunkSize - Chunk.chunkSize;
        let maximumX = chunkPos.x * Chunk.chunkSize + (Chunk.chunkSize * 2) - 1;
        let minimumZ = chunkPos.z * Chunk.chunkSize - Chunk.chunkSize;
        let maximumZ = chunkPos.z * Chunk.chunkSize + (Chunk.chunkSize * 2) - 1;

        for (let x = minimumX; x <= maximumX; x++) {
            for (let z = minimumZ; z <= maximumZ; z++) {
                let modelAndHeight = this.getModelAtPos(x, z);
                if (modelAndHeight != undefined) await modelAndHeight[0].loadModelInformation(new BlockPos(x, modelAndHeight[1] + 1, z));
            }
        }

        let chunkPosKey: string = chunkPos.getKey();
        let chunkEntry = this.chunksMap.get(chunkPosKey);

        this.removeChunkMeshes(scene, chunkEntry);

        this.addChunkMeshes(scene, chunkEntry);
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
    //         points.push(chunkMesh.position.clone().add(new Vector3(Chunk.chunkSize / 2.0, 0.0, Chunk.chunkSize / 2.0)));
    //         points.push(chunkMesh.position.clone().add(new Vector3(Chunk.chunkSize / 2.0, Chunk.chunkSize / 2.0, Chunk.chunkSize / 2.0)));
    //         points.push(chunkMesh.position.clone().add(new Vector3(Chunk.chunkSize / 2.0, Chunk.chunkSize, Chunk.chunkSize / 2.0)));
    //         points.push(chunkMesh.position.clone().add(new Vector3(Chunk.chunkSize / 2.0, Chunk.chunkSize * 2.0, Chunk.chunkSize / 2.0)));
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
            (this.heightNoiseCoarse.noise(x / heightGen.size, z / heightGen.size) + 1) +
            heightGen.amplitude * heightGen.mediumFactor *
            (this.heightNoiseMedium.noise(x / (heightGen.size * heightGen.mediumFactor), z / (heightGen.size * heightGen.mediumFactor)) + 1) +
            heightGen.amplitude * heightGen.fineFactor *
            (this.heightNoiseFine.noise(x / (heightGen.size * heightGen.fineFactor), z / (heightGen.size * heightGen.fineFactor)) + 1) + heightGen.base);
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
    //USED BY CHUNK GENERATION
    getBlockToGenerateAtFromChunk(blockPos: BlockPos, biomeData: BiomeDistance[]): Block {
        let blockToPush = this.getTerrainBlockToGenerateAtFromChunk(blockPos, biomeData);
        if (blockToPush == Blocks.AIR) blockToPush = this.getStructureBlockToGenerateAt(blockPos);
        return blockToPush;
    }

    //USED BY EVERYTHING ELSE
    getBlockToGenerateAt(blockPos: BlockPos): Block {
        let blockToPush = this.getTerrainBlockToGenerateAt(blockPos);
        if (blockToPush == Blocks.AIR) blockToPush = this.getStructureBlockToGenerateAt(blockPos);
        return blockToPush;
    }

    // BIOMES

    public getHeightAndBiomeFromXZ(x: number, z: number){
        let blockPos: BlockPos = new BlockPos(x, 0, z);
        let bD: BiomeDistance[] = this.getBiomeData(blockPos);
        let dFract = bD[0].distance / ((bD[0].distance + bD[1].distance) / 2);
        let biome: BiomeTypes = bD[0].biome;
        switch(biome){
            case BiomeTypes.Mountain:
                return [biome, this.getMountainHeight(blockPos, dFract)];
            case BiomeTypes.Desert:
                return [biome, this.getDesertHeight(blockPos, dFract)];
            case BiomeTypes.Ocean:
                if (dFract > biomeGen.shorelineFactor){
                    return [biome, this.getOceanHeight(blockPos, dFract)];
                } else {
                    return [biome, null];
                }
            case BiomeTypes.Plains:
                return [biome, this.getPlainsHeight(blockPos)];
        }

    }

    public getBiomeData(blockPos: BlockPos){
        let worleyWorldPos = new Vec2(blockPos.x / this.worleyGridSize, blockPos.z / this.worleyGridSize);
        let worleyGridPos: Vec2 = new Vec2(Math.floor(worleyWorldPos.x), Math.floor(worleyWorldPos.y));
        let posWithinGrid: Vec2 = worleyWorldPos.subtract(worleyGridPos);

        let closestBiome: BiomeDistance = new BiomeDistance(this.getFPDistFromOffset(posWithinGrid, worleyGridPos, new Vec2(0, 0)), this.getBiomeAtGrid(worleyGridPos));
        let secondClosestBiome: BiomeDistance = new BiomeDistance(1000, BiomeTypes.Desert);
        for ( var i = 0; i < worleyGridOffsets.length; i++){
            let s: number = this.getFPDistFromOffset(posWithinGrid, worleyGridPos, worleyGridOffsets[i]);
            if (s < closestBiome.distance){
                secondClosestBiome.distance = closestBiome.distance;
                secondClosestBiome.biome = closestBiome.biome;

                closestBiome.distance = s;
                closestBiome.biome = this.getBiomeAtGrid(worleyGridPos.add(worleyGridOffsets[i]));
            }
            else if (s < secondClosestBiome.distance){
                secondClosestBiome.distance = s;
                secondClosestBiome.biome = this.getBiomeAtGrid(worleyGridPos.add(worleyGridOffsets[i]));
            }
        }

        return [closestBiome, secondClosestBiome];
    }

    //CALLED BY CHUNK GENERATION, AND GIVEN BIOME DATA FROM CHUNK MEMOISATION
    getTerrainBlockToGenerateAtFromChunk(blockPos: BlockPos, biomeData: BiomeDistance[]): Block {

        if (biomeData[0].biome == BiomeTypes.Mountain){
            return this.mountainGetBlockAt(blockPos, biomeData[0].distance / ((biomeData[0].distance + biomeData[1].distance) / 2));
            //return Blocks.RED;
        }
        if (biomeData[0].biome == BiomeTypes.Desert){
            return this.desertGetBlockAt(blockPos, 0);
            //return Blocks.BLUE;
        }

        if (biomeData[0].biome == BiomeTypes.Ocean){
            return this.oceanGetBlockAt(blockPos, biomeData[0].distance / ((biomeData[0].distance + biomeData[1].distance) / 2));
            //return Blocks.GREY;
        }

        if (biomeData[0].biome == BiomeTypes.Plains){
            return this.plainsGetBlockAt(blockPos, 0);
            //return Blocks.GREEN;
        }
        if (biomeData[0].biome == BiomeTypes.Underground){
            return this.undergroundGetBlockAt(blockPos);
        }
        else {
            return Blocks.AIR;
        }
    }
    //CALLED BY LITERALLY EVERYTHING ELSE T-T
    getTerrainBlockToGenerateAt(blockPos: BlockPos): Block {
        let biomeData: BiomeDistance[] = this.getBiomeData(blockPos);
        if (biomeData[0].biome == BiomeTypes.Mountain){
            return this.mountainGetBlockAt(blockPos, biomeData[0].distance / ((biomeData[0].distance + biomeData[1].distance) / 2));
            //return Blocks.RED;
        }
        if (biomeData[0].biome == BiomeTypes.Desert && blockPos.y < 70){
            return this.desertGetBlockAt(blockPos, 0);
            //return Blocks.BLUE;
        }

        if (biomeData[0].biome == BiomeTypes.Ocean){
            return this.oceanGetBlockAt(blockPos, biomeData[0].distance / ((biomeData[0].distance + biomeData[1].distance) / 2));
            //return Blocks.GREY;
        }

        if (biomeData[0].biome == BiomeTypes.Plains && blockPos.y < 70){
            return this.plainsGetBlockAt(blockPos, 0);
            //return Blocks.GREEN;
        }
        else {
            return Blocks.AIR;
        }
    }
    undergroundGetBlockAt(blockPos: BlockPos){
        if (this.getCaveAt(blockPos)) return Blocks.AIR;
        else if (this.getCoalAt(blockPos)) return Blocks.COAL;
        else if (this.getIronAt(blockPos)) return Blocks.IRON;
        else if (this.getCucumberAt(blockPos)) return Blocks.CUCUMBER;
        else return Blocks.STONE;
    }
    mountainGetBlockAt(blockPos: BlockPos, dFract: number){
        let height: number = this.getMountainHeight(blockPos, dFract) - blockPos.y;
        let snowSpawnHeight: number = heightGen.snowHeight + this.snowHeightNoise.noise(blockPos.x / 5, blockPos.z / 5) * 2;

        if (height < 0 || (this.getCaveAt(blockPos) && blockPos.y < heightGen.base)) return Blocks.AIR;
        else if (height === 0 && blockPos.y >= snowSpawnHeight) return Blocks.SNOW;
        else if (this.getCoalAt(blockPos)) return Blocks.COAL;
        else if (this.getIronAt(blockPos)) return Blocks.IRON;
        else if (this.getCucumberAt(blockPos)) return Blocks.CUCUMBER;
        else return Blocks.STONE;
    }
    getMountainHeight(blockPos: BlockPos, dFract: number){
        return this.getHeightAt(blockPos.x, blockPos.z) +
            //mountain height calc
            Math.round((1 - dFract) * heightGen.mountainHeight *
            //noise variance
            (this.mountainHeightNoise.noise(blockPos.x / 35, blockPos.z / 35) / 4 + 0.75));
    }
    desertGetBlockAt(blockPos: BlockPos, dFract: number){
        let height: number = this.getDesertHeight(blockPos, dFract) - blockPos.y;
        let dirtHeight: number = height - this.getDirtThicknessAt(blockPos.x, blockPos.z);

        if (height < 0 || this.getCaveAt(blockPos)) return Blocks.AIR;
        //iron for debug
        else if (height === 0) return Blocks.IRON;
        else if (dirtHeight <= 0) return Blocks.DIRT;
        else if (this.getCoalAt(blockPos)) return Blocks.COAL;
        else if (this.getIronAt(blockPos)) return Blocks.IRON;
        else if (this.getCucumberAt(blockPos)) return Blocks.CUCUMBER;
        else return Blocks.STONE;
    }
    getDesertHeight(blockPos: BlockPos, dFract: number){
        return this.getHeightAt(blockPos.x, blockPos.z);
    }
    oceanGetBlockAt(blockPos: BlockPos, dFract: number){
        let oHeight = this.getOceanHeight(blockPos, dFract) - blockPos.y;
        let sandDepth: number = this.getDirtThicknessAt(blockPos.x, blockPos.z);


        //need to level out height noise around edges
        //then terrain dips below that, anything above that but also below heightGen.base spawns water

        //oHeight is how many blocks below the surface BlockPos is

        //REPLACE BLUE WITH WATER
        if (oHeight < 0 && blockPos.y < heightGen.base) return Blocks.WATER;
        if (oHeight < 0 || (this.getCaveAt(blockPos) && oHeight > sandDepth)) return Blocks.AIR;
        else if (oHeight <= sandDepth) return Blocks.SAND;
        else if (this.getCoalAt(blockPos)) return Blocks.COAL;
        else if (this.getIronAt(blockPos)) return Blocks.IRON;
        else if (this.getCucumberAt(blockPos)) return Blocks.CUCUMBER;
        else return Blocks.STONE;
    }
    getOceanHeight(blockPos: BlockPos, dFract: number){
        let terrainHeight: number = this.getHeightAt(blockPos.x, blockPos.z);
        if (dFract > biomeGen.shorelineFactor){
            return Math.round((terrainHeight - heightGen.base) * ((dFract - biomeGen.shorelineFactor) * 5) + heightGen.base);
        } else {
            //seabed height is world base heigh - (extra noise * (1 - normalised distance from biome center) * multiplier)
            return Math.round(heightGen.base - (terrainHeight - heightGen.base) * ((biomeGen.shorelineFactor - dFract) * (1 / biomeGen.shorelineFactor)) * biomeGen.oceanDepth);
        }
    }
    plainsGetBlockAt(blockPos: BlockPos, dist: number){
        let height: number = this.getPlainsHeight(blockPos) - blockPos.y;
        let dirtHeight: number = height - this.getDirtThicknessAt(blockPos.x, blockPos.z);

        if (height < 0 || this.getCaveAt(blockPos)) return Blocks.AIR;
        else if (height === 0) return Blocks.GRASS;
        else if (dirtHeight <= 0) return Blocks.DIRT;
        else if (this.getCoalAt(blockPos)) return Blocks.COAL;
        else if (this.getIronAt(blockPos)) return Blocks.IRON;
        else if (this.getCucumberAt(blockPos)) return Blocks.CUCUMBER;
        return Blocks.STONE;
    }
    getPlainsHeight(blockPos: BlockPos){
        return this.getHeightAt(blockPos.x, blockPos.z);
    }

    getStructureBlockToGenerateAt(blockPos: BlockPos): Block {
        let structureBlock: Block | null = Model.generatedStructureBlocksToLoad.get(blockPos.getKey())?.block ?? null;

        if (structureBlock != null) return structureBlock;
        return Blocks.AIR;
    }

    public getBlockAt(blockPos: BlockPos): Block {
        const chunkEntry = this.chunksMap.get(blockPos.getChunkPos().getKey());
        if (chunkEntry) {
            return chunkEntry.chunk.getBlockAt(blockPos.getSubChunkPos());
        }

        const chunkSave = this.chunkSaveMap.get(blockPos.getChunkPos().getKey());
        let diff: Block | undefined;
        if (chunkSave && (diff = chunkSave.getDiff(blockPos.getSubChunkPos()))) {
            return diff;
        }

        return this.getBlockToGenerateAt(blockPos);
    }

    public async setBlockAt(blockPos: BlockPos, blockType: Block, scene: Scene | null) {
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
        const save = chunkEntry.chunk.getSave();
        if (save) this.chunkSaveMap.set(chunkPosKey, save);
        else this.chunkSaveMap.delete(chunkPosKey);
        if (scene) {
            if (subChunkPos.x == 0) await this.updateChunkMesh(scene, chunkPos.subtractX(1));
            if (subChunkPos.x == Chunk.chunkSize - 1) await this.updateChunkMesh(scene, chunkPos.addX(1));
            if (subChunkPos.y == 0) await this.updateChunkMesh(scene, chunkPos.subtractY(1));
            if (subChunkPos.y == Chunk.chunkSize - 1) await this.updateChunkMesh(scene, chunkPos.addY(1));
            if (subChunkPos.z == 0) await this.updateChunkMesh(scene, chunkPos.subtractZ(1));
            if (subChunkPos.z == Chunk.chunkSize - 1) await this.updateChunkMesh(scene, chunkPos.addZ(1));
            await this.updateChunkMesh(scene, chunkPos);
        }
    }

    // Technically not a raycast but like it does the same thing but better, so I'm calling it one
    public raycastForBlock(startPos: Vec3, direction: Vec3, range: number, condition: (block: Block) => boolean): BlockPos[] | undefined {
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

    getBiomeAtGrid(gridPos: Vec2){
        let b: number = ((this.worleyBiome.noise(gridPos.x, gridPos.y) + 1) * 1000) % 1;
        if (b < 0.25){
            return BiomeTypes.Desert;
        } else if (b < 0.5){
            return BiomeTypes.Mountain;
        } else if (b < 0.75){
            return BiomeTypes.Ocean;
        } else {
            return BiomeTypes.Plains;
        }
    }

    getWorleyFP(gridPos: Vec2){
        let target: Vec2 = new Vec2(this.worleyXNoise.noise(gridPos.x, gridPos.y) / 2 + 1,
            this.worleyZNoise.noise(gridPos.x, gridPos.y) / 2 + 1);
        return target;
    }

    getFPDistFromOffset(worldPos: Vec2, gridPos: Vec2, offset: Vec2){
        let targetGridPos: Vec2 = gridPos.add(offset);
        let targetFP = targetGridPos.add(this.getWorleyFP(targetGridPos));
        return gridPos.add(worldPos).distanceTo(targetFP);

    }

    // STRUCTURES

    private async generateStructureData() {
        if (this.firstStructureGeneration) await Model.LoadModelData();

        let minimumX = (this.cameraChunkPos.x * Chunk.chunkSize) - ((this.worldRadius + 1) * Chunk.chunkSize);
        let maximumX = (this.cameraChunkPos.x * Chunk.chunkSize) + ((this.worldRadius + 1) * Chunk.chunkSize) + Chunk.chunkSize - 1;
        let minimumZ = (this.cameraChunkPos.z * Chunk.chunkSize) - ((this.worldRadius + 1) * Chunk.chunkSize);
        let maximumZ = (this.cameraChunkPos.z * Chunk.chunkSize) + ((this.worldRadius + 1) * Chunk.chunkSize) + Chunk.chunkSize - 1;

        let chunkPosShift: ChunkPos = this.cameraChunkPos.subtract(this.previousStructureCameraChunkPos);
        this.previousStructureCameraChunkPos = this.cameraChunkPos;

        if (Math.abs(chunkPosShift.y) == 1 && chunkPosShift.x == 0 && chunkPosShift.z == 0) return;

        // if (
        //     !this.firstStructureGeneration &&
        //     ((Math.abs(chunkPosShift.x) == 1 || Math.abs(chunkPosShift.z) == 1)) &&
        //     Math.abs(chunkPosShift.x) != Math.abs(chunkPosShift.z)
        // ) {
        //     if (chunkPosShift.x == -1) maximumX = minimumX + Chunk.chunkSize;
        //     else if (chunkPosShift.x == 1) minimumX = maximumX - Chunk.chunkSize;
        //     else if (chunkPosShift.z == -1) maximumZ = minimumZ + Chunk.chunkSize;
        //     else if (chunkPosShift.z == 1) minimumZ = maximumZ - Chunk.chunkSize;
        // }

        for (let x = minimumX; x <= maximumX; x++) {
            for (let z = minimumZ; z <= maximumZ; z++) {
                let modelAndHeight = this.getModelAtPos(x, z);
                if (modelAndHeight != undefined) await modelAndHeight[0].loadModelInformation(new BlockPos(x, modelAndHeight[1] + 1, z));
            }
        }

        if (this.firstStructureGeneration) this.firstStructureGeneration = false;
    }

    private async deleteOutOfRangeStructureData() {
        const keysToDelete: string[] = [];

        for (const [key, data] of Model.generatedStructureBlocksToLoad) {
            const dx = data.pos.x - (this.cameraChunkPos.x * Chunk.chunkSize + Math.floor(Chunk.chunkSize / 2));
            //const dy = data.pos.y - (this.cameraChunkPos.y * Chunk.chunkSize + Math.floor(Chunk.chunkSize / 2));
            const dz = data.pos.z - (this.cameraChunkPos.z * Chunk.chunkSize + Math.floor(Chunk.chunkSize / 2));

            let maxDistance = ((this.worldRadius + 1) * Chunk.chunkSize) + Chunk.chunkSize - 1;

            if (Math.abs(dx) > maxDistance || Math.abs(dz) > maxDistance) {
                keysToDelete.push(key);
            }
        }

        for (const key of keysToDelete) {
            Model.generatedStructureBlocksToLoad.delete(key);
        }
    }

    public getModelAtPos(x: number, z: number): [Model, number] | undefined {
        let structureNoiseVal = this.structureNoise.noise(x, z);

        if (structureNoiseVal >= 0.93) {
            if (this.hasLocalMaximaNoise(structureNoiseVal, x, z, 2)) return undefined;

            let heightAndBiome = this.getHeightAndBiomeFromXZ(x, z);
            if (!heightAndBiome || !heightAndBiome[1]) return undefined;

            if (heightAndBiome[0] == BiomeTypes.Plains) return [Model.LoadedModels["Tree"], heightAndBiome[1]];
            else if (heightAndBiome[0] == BiomeTypes.Ocean) return [Model.LoadedModels["PalmTree"], heightAndBiome[1]];
        }
        else return undefined;
        // CURSED else return Model.LoadedModels["DirtHut"];
    }

    private hasLocalMaximaNoise(noiseValue: number, x: number, z: number, range: number) : boolean {
        for (let dx = -range; dx <= range; dx++) {
            for (let dz = -range; dz <= range; dz++) {
                if (dx == 0 && dz == 0) continue;

                if (this.structureNoise.noise(x + dx, z + dz) > noiseValue) return true;
            }
        }

        return false;
    }

    public SetStructureGenFirstTime(state: boolean) {
        this.firstStructureGeneration = state;
    }
}