import * as THREE from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";
import * as Blocks from "./blocks";
import { Block } from "./block";
import { World } from "./world";

export const chunkSize = 16;

export class Chunk {
    world: World;
    pos: THREE.Vector3;
    blocks: Array<Array<Array<Block>>>;

    constructor(world: World, chunkPos: THREE.Vector3) {
        this.world = world;
        this.pos = chunkPos;
        this.blocks = [];
        for (let x = 0; x < chunkSize; x++) {
            this.blocks.push([]);
            for (let y = 0; y < chunkSize; y++) {
                this.blocks[x].push([]);
                for (let z = 0; z < chunkSize; z++) {
                    var pos = this.getWorldPos(new THREE.Vector3(x, y, z));
                    var height = world.getHeightAt(pos.x, pos.z) - pos.y;
                    var dirtHeight = height - world.getDirtThicknessAt(pos.x, pos.z);
                    if (height < 0 || world.getCaveAt(pos)) this.blocks[x][y].push(Blocks.AIR);
                    else if (height == 0) this.blocks[x][y].push(Blocks.GRASS);
                    else if (dirtHeight <= 0) this.blocks[x][y].push(Blocks.DIRT);
                    else if (world.getCoalAt(pos)) this.blocks[x][y].push(Blocks.COAL);
                    else if (world.getIronAt(pos)) this.blocks[x][y].push(Blocks.IRON);
                    else if (world.getCucumberAt(pos)) this.blocks[x][y].push(Blocks.CUCUMBER);
                    else this.blocks[x][y].push(Blocks.STONE);
                }
            }
        }
    }

    getMesh() {
        var geometries = [];
        var materials = [];
        var matrix = new THREE.Matrix4();
        var faces = {
            px: 0,
            nx: 0,
            py: 0,
            ny: 0,
            pz: 0,
            nz: 0
        };
        for (let x = 0; x < chunkSize; x++) {
            for (let y = 0; y < chunkSize; y++) {
                for (let z = 0; z < chunkSize; z++) {
                    var material = this.blocks[x][y][z].getMaterial();
                    if (material == null) continue;

                    matrix.makeTranslation(x, y, z);
                    faces.px = this.getOpacityAtWorld(new THREE.Vector3(x + 1, y, z));
                    faces.nx = this.getOpacityAtWorld(new THREE.Vector3(x - 1, y, z));
                    faces.py = this.getOpacityAtWorld(new THREE.Vector3(x, y + 1, z));
                    faces.ny = this.getOpacityAtWorld(new THREE.Vector3(x, y - 1, z));
                    faces.pz = this.getOpacityAtWorld(new THREE.Vector3(x, y, z + 1));
                    faces.nz = this.getOpacityAtWorld(new THREE.Vector3(x, y, z - 1));
                    var geometry = this.blocks[x][y][z].getGeometry(faces);

                    if (geometry == null) continue;
                    geometry = geometry.applyMatrix4(matrix);

                    geometries.push(geometry);
                    materials.push(material);
                }
            }
        }
        if (geometries.length == 0) return null;
        var mesh = new THREE.Mesh(BufferGeometryUtils.mergeGeometries(geometries, true), materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    getOpacityAtWorld(internalPos: THREE.Vector3) {
        return this.world.getOpacityAt(this.getWorldPos(internalPos));
    }

    getOpacityAt(internalPos: THREE.Vector3) {
        return this.blocks[internalPos.x][internalPos.y][internalPos.z].getOpacity();
    }

    getWorldPos(internalPos: THREE.Vector3) {
        return this.pos.clone().multiplyScalar(chunkSize).add(internalPos);
    }

    static getChunkSize() {
        return chunkSize;
    }
}