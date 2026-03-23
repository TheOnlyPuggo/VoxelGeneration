import * as THREE from "three";
import {BufferGeometryUtils} from "three/examples/jsm/Addons.js";
import {CuboidMesh, CuboidMeshMultiTexture, CuboidMeshOneColor, CuboidMeshOneTexture} from "../creation";

export class Block {
    static BlockMeshes = new Map<string, CuboidMesh>([
        ["grass", new CuboidMeshMultiTexture(1, 1, 1, 1.0, 
            "grass_textures/grass_top.png",
            "grass_textures/grass_bottom.png",
            "grass_textures/grass_side.png",
        )],
        ["dirt", new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/dirt.png")],
        ["stone", new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/stone.png")],
        ["glass", new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/glass.png")],
        ["coal", new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/coal.png")],
        ["iron", new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/iron.png")]
    ]);

    name: string;
    opacity: number;
    color: THREE.Color | null;

    constructor(name: string, opacity: number, color: THREE.Color | null) {
        this.name = name;
        this.opacity = opacity;
        this.color = color;
    }

    getMesh(faces: {px: number; nx: number; py: number; ny: number; pz: number; nz: number}): THREE.Mesh | null {
        if (this.opacity === 0 || this.color == null) return null;
        return Block.BlockMeshes.get(this.name)?.Mesh(faces) ?? null;
    }
}