import {BlockPos} from "../positions/blockPos";
import {World} from "../worldgen/world";
import {Block} from "../worldgen/block";
import {BufferGeometry, Material} from "three";
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

        const geometries: BufferGeometry[] = [];
        const materials: Material[] = [];

        if (!this.block.getTransparent()) {
            this.geometry = undefined;
        } else {
            for (let i = 0; i < 6; i++) {
                const newGeometry = this.getFaceGeometry(i);
                const newMaterial = this.getFaceMaterial(i);
                if (newGeometry && newMaterial) {
                    geometries.push(newGeometry);
                    materials.push(newMaterial);
                }
            }
            this.geometry = new CompositeGeometry(geometries, materials);
        }
    }

    public getGeometry(): CompositeGeometry | undefined {
        return this.geometry;
    }

    private getFaceGeometry(index: number): BufferGeometry | undefined {
        const blockPos = this.getPos(index);
        if (!blockPos) return undefined;
        if (!this.showBlock(blockPos)) return undefined;
        return this.world.getBlockAt(blockPos).meshConstructor?.getFaceGeometry(index);
    }

    private getFaceMaterial(index: number): Material | undefined {
        const blockPos = this.getPos(index);
        if (!blockPos) return undefined;
        if (!this.showBlock(blockPos)) return undefined;
        return this.world.getBlockAt(blockPos).meshConstructor?.getMaterial(index);
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