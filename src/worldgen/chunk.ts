import {Camera, Mesh} from "three";
import {Block} from "./block";
import {World} from "./world";
import {ChunkPos} from "../positions/chunkPos";
import {SubChunkPos} from "../positions/subChunkPos";
import {BlockPos} from "../positions/blockPos";
import {CompositeGeometry} from "../geometry/compositeGeometry";
import {FaceMap} from "../geometry/faceMap";
import {AIR} from "./blocks";
import {ChunkSave} from "./chunkSave";

export const chunkSize = 16;

export class Chunk {
    readonly world: World;
    readonly chunkPos: ChunkPos;
    readonly blocks: Array<Array<Array<Block>>>;
    readonly save: ChunkSave;

    constructor(world: World, chunkPos: ChunkPos, save: ChunkSave | undefined) {
        this.world = world;
        this.chunkPos = chunkPos;
        this.save = save ?? new ChunkSave();

        this.blocks = [];
        let diffCount: number = this.save.getDiffCount();
        for (let x: number = 0; x < chunkSize; x++) {
            this.blocks.push([]);
            for (let y: number = 0; y < chunkSize; y++) {
                this.blocks[x].push([]);
                for (let z: number = 0; z < chunkSize; z++) {
                    let subChunkPos = new SubChunkPos(x, y, z);
                    let diff: Block | undefined;
                    if (diffCount > 0 && (diff = this.save.getDiff(subChunkPos))) {
                        this.blocks[x][y].push(diff);
                    } else this.blocks[x][y].push(world.getBlockToGenerateAt(this.getBlockPos(subChunkPos)));
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

    public setBlockAt(subChunkPos: SubChunkPos, blockType: Block, isSameAsGeneration: boolean): void {
        this.blocks[subChunkPos.x][subChunkPos.y][subChunkPos.z] = blockType;
        if (isSameAsGeneration) this.save.setBlockAt(subChunkPos, undefined);
        else this.save.setBlockAt(subChunkPos, blockType);
    }

    public getBlockPos(subChunkPos: SubChunkPos): BlockPos {
        return BlockPos.fromChunkPos(this.chunkPos, subChunkPos);
    }

    public getSave(): ChunkSave | null {
        if (this.save.hasDiffs()) return this.save;
        else return null;
    }

    static getChunkPosfromCameraPos(camera: Camera): ChunkPos {
        return new ChunkPos(
            Math.floor(camera.position.x / chunkSize), 
            Math.floor(camera.position.y / chunkSize),
            Math.floor(camera.position.z / chunkSize)
        );
    }
}