import {Vec3Int} from "./vec3Int";
import {chunkSize} from "../worldgen/chunk";
import {ChunkPos} from "./chunkPos";
import {SubChunkPos} from "./subChunkPos";

export class BlockPos extends Vec3Int {
    public constructor(x: number = 0, y: number = 0, z: number = 0) {
        super(x, y, z);
    }

    public static fromChunkPos<THIS extends typeof BlockPos>(chunkPos: ChunkPos, subChunkPos: SubChunkPos): InstanceType<THIS> {
        return (this.fromVec3Int as any)(chunkPos.multiply(chunkSize).add(subChunkPos));
    }

    public static fromVec3Int<THIS extends typeof BlockPos>(vector: Vec3Int): InstanceType<THIS> {
        return new (this.constructor as any)(vector.x, vector.y, vector.z);
    }

    public getChunkPos(): ChunkPos {
        return new ChunkPos(this.x / chunkSize, this.y / chunkSize, this.z / chunkSize);
    }

    public getSubChunkPos(): SubChunkPos {
        return new ChunkPos(mod(this.x, chunkSize), mod(this.y, chunkSize), mod(this.z, chunkSize));
    }
}

function mod(quotient: number, divisor: number): number {
    return ((quotient % divisor) + divisor) % divisor;
}