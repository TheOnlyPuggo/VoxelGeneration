import {PosInt} from "./posInt";

export class ChunkPos extends PosInt {
    constructor(x: number, y: number, z: number) {
        super(x, y, z);
    }
}