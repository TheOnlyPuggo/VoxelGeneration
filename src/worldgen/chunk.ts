import {Camera, Mesh, Vector2} from "three";
import {Block} from "./block";
import {World} from "./world";
import {ChunkPos} from "../positions/chunkPos";
import {SubChunkPos} from "../positions/subChunkPos";
import {BlockPos} from "../positions/blockPos";
import {CompositeGeometry} from "../geometry/compositeGeometry";
import {FaceMap} from "../geometry/faceMap";
import {AIR} from "./blocks";

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
                    let blockToPush = world.getBlockToGenerateAt(BlockPos.fromChunkPos(chunkPos, new SubChunkPos(x, y, z)));
                    if (blockToPush == AIR) blockToPush = world.getStructureBlockToGenerateAt(BlockPos.fromChunkPos(chunkPos, new SubChunkPos(x, y, z)));
                    this.blocks[x][y].push(blockToPush);
                }
            }
        }

        for (let x: number = 0; x < chunkSize; x++) {
            for (let z: number = 0; z < chunkSize; z++) {
                world.getModelAtPos(new Vector2(x, z));
            }
        }
    }

    getChunkMesh(): Mesh | null {
        const geometry = new CompositeGeometry([], []);
        const faces = new FaceMap();

        for (let x: number = 0; x < chunkSize; x++) {
            for (let y: number = 0; y < chunkSize; y++) {
                for (let z: number = 0; z < chunkSize; z++) {
                    const worldX = this.chunkPos.x * chunkSize + x;
                    const worldY = this.chunkPos.y * chunkSize + y;
                    const worldZ = this.chunkPos.z * chunkSize + z;

                    faces.px = this.world.getTransparentAt(worldX + 1, worldY, worldZ);
                    faces.nx = this.world.getTransparentAt(worldX - 1, worldY, worldZ);
                    faces.py = this.world.getTransparentAt(worldX, worldY + 1, worldZ);
                    faces.ny = this.world.getTransparentAt(worldX, worldY - 1, worldZ);
                    faces.pz = this.world.getTransparentAt(worldX, worldY, worldZ + 1);
                    faces.nz = this.world.getTransparentAt(worldX, worldY, worldZ - 1);

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

    static getChunkPosfromCameraPos(camera: Camera): ChunkPos {
        return new ChunkPos(
            Math.floor(camera.position.x / chunkSize), 
            Math.floor(camera.position.y / chunkSize),
            Math.floor(camera.position.z / chunkSize)
        );
    }
}