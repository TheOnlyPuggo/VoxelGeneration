import {PosInt} from "./posInt";
import {chunkSize} from "../worldgen/chunk";
import {ChunkPos} from "./chunkPos";
import {SubChunkPos} from "./subChunkPos";

export class BlockPos extends PosInt {
    constructor(x: number = 0, y: number = 0, z: number = 0) {
        super(x, y, z);
    }

    getChunkPos(): ChunkPos {
        return new ChunkPos(this.x / chunkSize, this.y / chunkSize, this.z / chunkSize);
    }

    getSubChunkPos(): SubChunkPos {
        return new ChunkPos(mod(this.x, chunkSize), mod(this.y, chunkSize), mod(this.z, chunkSize));
    }


    static fromChunkPos(chunkPos: ChunkPos, subChunkPos: SubChunkPos): BlockPos {
        return BlockPos.fromPosInt(chunkPos.multiply(chunkSize).add(subChunkPos));
    }

    static fromPosInt(posInt: PosInt): BlockPos {
        return new BlockPos(posInt.x, posInt.y, posInt.z);
    }
}

function mod(quotient: number, divisor: number): number {
    return ((quotient % divisor) + divisor) % divisor;
}