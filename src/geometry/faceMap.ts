import {BlockPos} from "../positions/blockPos";
import {World} from "../worldgen/world";
import {AIR} from "../worldgen/blocks";

export class FaceMap {
    public readonly px: boolean;
    public readonly nx: boolean;
    public readonly py: boolean;
    public readonly ny: boolean;
    public readonly pz: boolean;
    public readonly nz: boolean;

    public constructor(world: World, blockPos: BlockPos) {
        const block = world.getBlockAtFromChunk(blockPos) ?? AIR;
        if (block.getTransparent()) {
            this.px = !(world.getBlockAtFromChunk(blockPos.addX(1)) ?? AIR).equals(block);
            this.nx = !(world.getBlockAtFromChunk(blockPos.subtractX(1)) ?? AIR).equals(block);
            this.py = !(world.getBlockAtFromChunk(blockPos.addY(1)) ?? AIR).equals(block);
            this.ny = !(world.getBlockAtFromChunk(blockPos.subtractY(1)) ?? AIR).equals(block);
            this.pz = !(world.getBlockAtFromChunk(blockPos.addZ(1)) ?? AIR).equals(block);
            this.nz = !(world.getBlockAtFromChunk(blockPos.subtractZ(1)) ?? AIR).equals(block);
        } else {
            this.px = (world.getBlockAtFromChunk(blockPos.addX(1)) ?? AIR).getTransparent();
            this.nx = (world.getBlockAtFromChunk(blockPos.subtractX(1)) ?? AIR).getTransparent();
            this.py = (world.getBlockAtFromChunk(blockPos.addY(1)) ?? AIR).getTransparent();
            this.ny = (world.getBlockAtFromChunk(blockPos.subtractY(1)) ?? AIR).getTransparent();
            this.pz = (world.getBlockAtFromChunk(blockPos.addZ(1)) ?? AIR).getTransparent();
            this.nz = (world.getBlockAtFromChunk(blockPos.subtractZ(1)) ?? AIR).getTransparent();
        }
    }
}