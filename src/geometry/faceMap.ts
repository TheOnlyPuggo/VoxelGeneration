import {BlockPos} from "../positions/blockPos";
import {World} from "../worldgen/world";

export class FaceMap {
    public readonly px: boolean;
    public readonly nx: boolean;
    public readonly py: boolean;
    public readonly ny: boolean;
    public readonly pz: boolean;
    public readonly nz: boolean;

    public constructor(world: World, blockPos: BlockPos) {
        const block = world.getBlockAt(blockPos);
        if (block.getTransparent()) {
            this.px = !world.getBlockAt(blockPos.addX(1)).equals(block);
            this.nx = !world.getBlockAt(blockPos.subtractX(1)).equals(block);
            this.py = !world.getBlockAt(blockPos.addY(1)).equals(block);
            this.ny = !world.getBlockAt(blockPos.subtractY(1)).equals(block);
            this.pz = !world.getBlockAt(blockPos.addZ(1)).equals(block);
            this.nz = !world.getBlockAt(blockPos.subtractZ(1)).equals(block);
        } else {
            this.px = world.getBlockAt(blockPos.addX(1)).getTransparent();
            this.nx = world.getBlockAt(blockPos.subtractX(1)).getTransparent();
            this.py = world.getBlockAt(blockPos.addY(1)).getTransparent();
            this.ny = world.getBlockAt(blockPos.subtractY(1)).getTransparent();
            this.pz = world.getBlockAt(blockPos.addZ(1)).getTransparent();
            this.nz = world.getBlockAt(blockPos.subtractZ(1)).getTransparent();
        }
    }
}