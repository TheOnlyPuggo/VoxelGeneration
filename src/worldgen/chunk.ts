import {Camera, Mesh} from "three";
import {Block} from "./block";
import {BiomeDistance, BiomeTypes, World} from "./world";
import {ChunkPos} from "../positions/chunkPos";
import {SubChunkPos} from "../positions/subChunkPos";
import {BlockPos} from "../positions/blockPos";
import {CompositeGeometry} from "../geometry/compositeGeometry";
import {ChunkSave} from "./chunkSave";
import {BlockMap} from "../geometry/blockMap";
import {Vec3} from "../positions/vec3";

export class Chunk {
    readonly world: World;
    readonly chunkPos: ChunkPos;
    readonly blocks: Array<Array<Array<Block>>>;
    readonly save: ChunkSave;

    public static chunkSize: number = 16;

    constructor(world: World, chunkPos: ChunkPos, save: ChunkSave | undefined) {
        this.world = world;
        this.chunkPos = chunkPos;
        this.save = save ?? new ChunkSave();

        this.blocks = [];
        let bData: Array<Array<BiomeDistance[]>> = [];
        for (let x: number = 0; x < Chunk.chunkSize; x++){
            bData.push([]);
            for (let z: number = 0; z < Chunk.chunkSize; z++){
                bData[x].push(world.getBiomeData(this.getBlockPos(new SubChunkPos(x, 0, z))));
            }
        }

        let diffCount: number = this.save.getDiffCount();
        for (let x: number = 0; x < Chunk.chunkSize; x++) {
            this.blocks.push([]);

            for (let y: number = 0; y < Chunk.chunkSize; y++) {
                this.blocks[x].push([]);
                for (let z: number = 0; z < Chunk.chunkSize; z++) {
                    let subChunkPos = new SubChunkPos(x, y, z);
                    let diff: Block | undefined;
                    if (diffCount > 0 && (diff = this.save.getDiff(subChunkPos))) {
                        this.blocks[x][y].push(diff);
                    } else this.blocks[x][y].push(world.getBlockToGenerateAtFromChunk(this.getBlockPos(subChunkPos), bData[x][z]));
                }
            }
        }
    }

    public getChunkMeshes(): Mesh[] | undefined {
        const geometry = new CompositeGeometry();
        for (let x: number = 0; x < Chunk.chunkSize; x++) {
            for (let y: number = 0; y < Chunk.chunkSize; y++) {
                for (let z: number = 0; z < Chunk.chunkSize; z++) {
                    geometry.addComposite(this.getGeometry(new SubChunkPos(x, y, z)));
                }
            }
        }
        if (geometry.isEmpty()) return undefined;
        geometry.translate(new Vec3(
            this.chunkPos.x * Chunk.chunkSize,
            this.chunkPos.y * Chunk.chunkSize,
            this.chunkPos.z * Chunk.chunkSize
        ));
        return geometry.getCombinedMeshes();
    }

    private getGeometry(subChunkPos: SubChunkPos): CompositeGeometry | undefined {
        const blockMap = new BlockMap(this.world, this.getBlockPos(subChunkPos));

        const newGeometry = blockMap.getGeometry();
        newGeometry?.translate(subChunkPos);
        return newGeometry;
    }

    public getBlockAt(subChunkPos: SubChunkPos): Block {
        return this.blocks[subChunkPos.x][subChunkPos.y][subChunkPos.z];
    }

    public setBlockAt(subChunkPos: SubChunkPos, blockType: Block, isSameAsGeneration: boolean): void {
        this.blocks[subChunkPos.x][subChunkPos.y][subChunkPos.z] = blockType;
        if (isSameAsGeneration) this.save.setBlockAt(subChunkPos, undefined);
        else this.save.setBlockAt(subChunkPos, blockType);
    }

    public getBlockPos(subChunkPos: SubChunkPos): BlockPos {
        return BlockPos.fromChunkPos(this.chunkPos, subChunkPos);
    }

    public getSave(): ChunkSave | null {
        if (this.save.hasDiffs()) return this.save;
        else return null;
    }

    static getChunkPosfromCameraPos(camera: Camera): ChunkPos {
        return new ChunkPos(
            Math.floor(camera.position.x / Chunk.chunkSize),
            Math.floor(camera.position.y / Chunk.chunkSize),
            Math.floor(camera.position.z / Chunk.chunkSize)
        );
    }
}