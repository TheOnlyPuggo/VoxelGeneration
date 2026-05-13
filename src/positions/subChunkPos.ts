import {Vec3Int} from "./vec3Int";
import {chunkSize} from "../worldgen/chunk";
import {ChunkPos} from "./chunkPos";

export class SubChunkPos extends Vec3Int {
    public constructor(x: number = 0, y: number = 0, z: number = 0) {
        super(x, y, z);
    }

    public static fromBlockPos<THIS extends ChunkPos>(blockPos: ChunkPos): THIS {
        return new this(mod(blockPos.x, chunkSize), mod(blockPos.y, chunkSize), mod(blockPos.z, chunkSize)) as THIS;
    }
}

function mod(quotient: number, divisor: number): number {
    return ((quotient % divisor) + divisor) % divisor;
}