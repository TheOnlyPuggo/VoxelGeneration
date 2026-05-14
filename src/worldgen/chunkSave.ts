import {Block} from "./block";
import {SubChunkPos} from "../positions/subChunkPos";

export class ChunkSave {
    private readonly blocks: Map<string, Block>;

    private diffCount: number;

    public constructor() {
        this.blocks = new Map<string, Block>();

        this.diffCount = 0;
    }

    public setBlockAt(subChunkPos: SubChunkPos, blockType: Block | undefined): void {
        let key = subChunkPos.getKey();
        if (!blockType && this.blocks.get(key)) {
            this.diffCount--;
            this.blocks.delete(key);
        }
        if (blockType) {
            if (!this.blocks.get(key)) this.diffCount++;
            this.blocks.set(key, blockType);
        }
    }

    public hasDiffs(): boolean {
        return this.diffCount > 0;
    }

    public getDiffCount(): number {
        return this.diffCount;
    }

    public getDiff(subChunkPos: SubChunkPos): Block | undefined {
        return this.blocks.get(subChunkPos.getKey());
    }
}