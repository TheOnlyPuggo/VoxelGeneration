import * as THREE from "three";
import {BufferGeometryUtils} from "three/examples/jsm/Addons.js";
import * as Blocks from "./blocks";
import {Block} from "./block";
import {World} from "./world";
import {ChunkPos} from "../positions/chunkPos";
import {SubChunkPos} from "../positions/subChunkPos";
import {BlockPos} from "../positions/blockPos";
import {BufferGeometry, Material} from "three";

export const chunkSize = 16;

export class Chunk {
    world: World;
    chunkPos: ChunkPos;
    blocks: Array<Array<Array<Block>>>;

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

    getChunkMeshes(): THREE.Mesh[] {
        const meshes: THREE.Mesh[] = [];
        const faces = {
            px: 0,
            nx: 0,
            py: 0,
            ny: 0,
            pz: 0,
            nz: 0
        };

        for (let x: number = 0; x < chunkSize; x++) {
            for (let y: number = 0; y < chunkSize; y++) {
                for (let z: number = 0; z < chunkSize; z++) {
                    faces.px = this.getOpacityAtWorld(new SubChunkPos(x + 1, y, z));
                    faces.nx = this.getOpacityAtWorld(new SubChunkPos(x - 1, y, z));
                    faces.py = this.getOpacityAtWorld(new SubChunkPos(x, y + 1, z));
                    faces.ny = this.getOpacityAtWorld(new SubChunkPos(x, y - 1, z));
                    faces.pz = this.getOpacityAtWorld(new SubChunkPos(x, y, z + 1));
                    faces.nz = this.getOpacityAtWorld(new SubChunkPos(x, y, z - 1));

                    let mesh = this.blocks[x][y][z].getMesh(faces);
                    if (mesh === null) continue;
                    mesh.geometry.translate(x, y, z);
                
                    meshes.push(mesh);
                }
            }
        }
        return meshes;
    }

    getOpacityAtWorld(subChunkPos: SubChunkPos): number {
        return this.world.getOpacityAt(BlockPos.fromChunkPos(this.chunkPos, subChunkPos));
    }

    getOpacityAt(subChunkPos: SubChunkPos): number {
        return this.blocks[subChunkPos.x][subChunkPos.y][subChunkPos.z].opacity;
    }
}