import {Mesh} from "three";
import * as Blocks from "./blocks";
import {Block} from "./block";
import {World} from "./world";
import {ChunkPos} from "../positions/chunkPos";
import {SubChunkPos} from "../positions/subChunkPos";
import {BlockPos} from "../positions/blockPos";
import {CompositeGeometry} from "../geometry/compositeGeometry";
import {FaceMap} from "../geometry/faceMap";

export const chunkSize = 16;

export class Chunk {
    readonly world: World;
    readonly chunkPos: ChunkPos;
    readonly blocks: Array<Array<Array<Block>>>;

    constructor(world: World, chunkPos: ChunkPos) {
        this.world = world;
        this.chunkPos = chunkPos;

        this.blocks = [];
        for (let x: number = 0; x < chunkSize; x++) {
            this.blocks.push([]);
            for (let y: number = 0; y < chunkSize; y++) {
                this.blocks[x].push([]);
                for (let z: number = 0; z < chunkSize; z++) {
                    let pos: BlockPos = BlockPos.fromChunkPos(chunkPos, new SubChunkPos(x, y, z));
                    let height: number = world.getHeightAt(pos.x, pos.z) - pos.y;
                    let dirtHeight: number = height - world.getDirtThicknessAt(pos.x, pos.z);

                    if (height < 0 || world.getCaveAt(pos)) this.blocks[x][y].push(Blocks.AIR);
                    else if (height === 0) this.blocks[x][y].push(Blocks.GRASS);
                    else if (dirtHeight <= 0) this.blocks[x][y].push(Blocks.DIRT);
                    else if (world.getCoalAt(pos)) this.blocks[x][y].push(Blocks.COAL);
                    else if (world.getIronAt(pos)) this.blocks[x][y].push(Blocks.IRON);
                    else if (world.getCucumberAt(pos)) this.blocks[x][y].push(Blocks.CUCUMBER);
                    else this.blocks[x][y].push(Blocks.STONE);
                }
            }
        }
    }

    getChunkMesh(): Mesh | null {
        const geometry = new CompositeGeometry([], []);
        const faces = new FaceMap();

        for (let x: number = 0; x < chunkSize; x++) {
            for (let y: number = 0; y < chunkSize; y++) {
                for (let z: number = 0; z < chunkSize; z++) {
                    faces.px = this.world.getTransparentAt(this.getWorldPos(new SubChunkPos(x + 1, y, z)));
                    faces.nx = this.world.getTransparentAt(this.getWorldPos(new SubChunkPos(x - 1, y, z)));
                    faces.py = this.world.getTransparentAt(this.getWorldPos(new SubChunkPos(x, y + 1, z)));
                    faces.ny = this.world.getTransparentAt(this.getWorldPos(new SubChunkPos(x, y - 1, z)));
                    faces.pz = this.world.getTransparentAt(this.getWorldPos(new SubChunkPos(x, y, z + 1)));
                    faces.nz = this.world.getTransparentAt(this.getWorldPos(new SubChunkPos(x, y, z - 1)));

                    let newGeometry = this.blocks[x][y][z].getGeometry(faces);
                    newGeometry?.translate(x, y, z);
                    geometry.addComposite(newGeometry);
                }
            }
        }
        if (geometry.isEmpty()) return null;

        let mesh = geometry.getCombinedMesh();
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    getWorldPos(subChunkPos: SubChunkPos): BlockPos {
        return BlockPos.fromChunkPos(this.chunkPos, subChunkPos);
    }
}