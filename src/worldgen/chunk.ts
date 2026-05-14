import {BufferGeometry, Camera, Material, Mesh} from "three";
import {Block} from "./block";
import {World} from "./world";
import {ChunkPos} from "../positions/chunkPos";
import {SubChunkPos} from "../positions/subChunkPos";
import {BlockPos} from "../positions/blockPos";
import {CompositeGeometry} from "../geometry/compositeGeometry";
import {ChunkSave} from "./chunkSave";
import {BlockMap} from "../geometry/blockMap";
import {Vec3} from "../positions/vec3";

export const chunkSize = 16;

export class Chunk {
    readonly world: World;
    readonly chunkPos: ChunkPos;
    readonly blocks: Array<Array<Array<Block>>>;
    readonly save: ChunkSave;

    constructor(world: World, chunkPos: ChunkPos, save: ChunkSave | undefined) {
        this.world = world;
        this.chunkPos = chunkPos;
        this.save = save ?? new ChunkSave();

        this.blocks = [];
        let diffCount: number = this.save.getDiffCount();
        for (let x: number = 0; x < chunkSize; x++) {
            this.blocks.push([]);
            for (let y: number = 0; y < chunkSize; y++) {
                this.blocks[x].push([]);
                for (let z: number = 0; z < chunkSize; z++) {
                    let subChunkPos = new SubChunkPos(x, y, z);
                    let diff: Block | undefined;
                    if (diffCount > 0 && (diff = this.save.getDiff(subChunkPos))) {
                        this.blocks[x][y].push(diff);
                    } else this.blocks[x][y].push(world.getBlockToGenerateAt(this.getBlockPos(subChunkPos)));
                }
            }
        }
    }

    public getChunkMeshes(): Mesh[] | undefined {
        const geometry = new CompositeGeometry([], []);
        for (let x: number = 0; x < chunkSize; x++) {
            for (let y: number = 0; y < chunkSize; y++) {
                for (let z: number = 0; z < chunkSize; z++) {
                    geometry.addComposite(this.getGeometry(new SubChunkPos(x, y, z)));
                }
            }
        }
        if (geometry.isEmpty()) return undefined;
        geometry.translate(new Vec3(
            this.chunkPos.x * chunkSize,
            this.chunkPos.y * chunkSize,
            this.chunkPos.z * chunkSize
        ));
        return geometry.getCombinedMeshes();
    }

    private getGeometry(subChunkPos: SubChunkPos): CompositeGeometry | undefined {
        const blockMap = new BlockMap(this.world, this.getBlockPos(subChunkPos));

        const newGeometry = blockMap.getGeometry();
        newGeometry?.translate(subChunkPos);
        return newGeometry;
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
            Math.floor(camera.position.x / chunkSize), 
            Math.floor(camera.position.y / chunkSize),
            Math.floor(camera.position.z / chunkSize)
        );
    }
}