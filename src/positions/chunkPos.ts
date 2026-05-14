import {Vec3Int} from "./vec3Int";
import {SubChunkPos} from "./subChunkPos";
import {chunkSize} from "../worldgen/chunk";

export class ChunkPos extends Vec3Int {
    public constructor(x: number = 0, y: number = 0, z: number = 0) {
        super(x, y, z);
    }

    public static fromBlockPos<THIS extends ChunkPos>(blockPos: ChunkPos): THIS {
        return new this(blockPos.x / chunkSize, blockPos.y / chunkSize, blockPos.z / chunkSize) as THIS;
    }
}