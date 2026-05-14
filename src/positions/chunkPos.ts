import {Vec3Int} from "./vec3Int";
import {Chunk} from "../worldgen/chunk";

export class ChunkPos extends Vec3Int {
    public constructor(x: number = 0, y: number = 0, z: number = 0) {
        super(x, y, z);
    }

    public static fromBlockPos<THIS extends ChunkPos>(blockPos: ChunkPos): THIS {
        return new this(blockPos.x / Chunk.chunkSize, blockPos.y / Chunk.chunkSize, blockPos.z / Chunk.chunkSize) as THIS;
    }
}