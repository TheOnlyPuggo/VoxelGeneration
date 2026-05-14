import {Vec3Int} from "./vec3Int";
import {ChunkPos} from "./chunkPos";
import {Chunk} from "../worldgen/chunk";

export class SubChunkPos extends Vec3Int {
    public constructor(x: number = 0, y: number = 0, z: number = 0) {
        super(x, y, z);
    }

    public static fromBlockPos<THIS extends ChunkPos>(blockPos: ChunkPos): THIS {
        return new this(mod(blockPos.x, Chunk.chunkSize), mod(blockPos.y, Chunk.chunkSize), mod(blockPos.z, Chunk.chunkSize)) as THIS;
    }
}

function mod(quotient: number, divisor: number): number {
    return ((quotient % divisor) + divisor) % divisor;
}