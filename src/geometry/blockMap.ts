import {BlockPos} from "../positions/blockPos";
import {World} from "../worldgen/world";
import {Block} from "../worldgen/block";
import {CompositeGeometry} from "./compositeGeometry";

export class BlockMap {
    public readonly world: World;
    public readonly blockPos: BlockPos;
    public readonly block: Block;
    public readonly geometry: CompositeGeometry | undefined;

    public constructor(world: World, blockPos: BlockPos) {
        this.world = world;
        this.blockPos = blockPos;
        this.block = world.getBlockAt(blockPos);

        if (!this.block.getTransparent()) {
            this.geometry = undefined;
        } else {
            this.geometry = new CompositeGeometry();
            for (let i = 0; i < 6; i++) {
                this.addFaceToCompositeGeometry(i, this.geometry);
            }
        }
    }

    public getGeometry(): CompositeGeometry | undefined {
        return this.geometry;
    }

    private addFaceToCompositeGeometry(index: number, compositeGeometry: CompositeGeometry): void {
        const blockPos = this.getPos(index);
        if (!blockPos || !this.showBlock(blockPos)) return;
        this.world.getBlockAt(blockPos).meshConstructor?.addFaceToCompositeGeometry(index, compositeGeometry);
    }

    private showBlock(blockPos: BlockPos): boolean {
        const block = this.world.getBlockAt(blockPos);
        return !block.equals(this.block) && block.getVisible();
    }

    private getPos(index: number): BlockPos | undefined {
        if (index == 0) return this.blockPos.subtractX(1);
        if (index == 1) return this.blockPos.addX(1);
        if (index == 2) return this.blockPos.subtractY(1);
        if (index == 3) return this.blockPos.addY(1);
        if (index == 4) return this.blockPos.subtractZ(1);
        if (index == 5) return this.blockPos.addZ(1);
    }
}