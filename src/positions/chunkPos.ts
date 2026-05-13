import {Vec3Int} from "./vec3Int";

export class ChunkPos extends Vec3Int {
    public constructor(x: number = 0, y: number = 0, z: number = 0) {
        super(x, y, z);
    }
}