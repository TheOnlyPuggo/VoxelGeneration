import {Vec3Int} from "./vec3Int";
import {ChunkPos} from "./chunkPos";
import {SubChunkPos} from "./subChunkPos";
import {chunkSize} from "../worldgen/chunk";

export class BlockPos extends Vec3Int {
    public constructor(x: number = 0, y: number = 0, z: number = 0) {
        super(x, y, z);
    }

    public static fromChunkPos<THIS extends BlockPos>(chunkPos: ChunkPos, subChunkPos: SubChunkPos): THIS {
        return this.fromVec3(chunkPos.multiply(chunkSize).add(subChunkPos)) as THIS;
    }

    public getChunkPos(): ChunkPos {
        return ChunkPos.fromBlockPos(this);
    }

    public getSubChunkPos(): SubChunkPos {
        return SubChunkPos.fromBlockPos(this);
    }
}