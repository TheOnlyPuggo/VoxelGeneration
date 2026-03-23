import * as THREE from "three";
import {BufferGeometryUtils} from "three/examples/jsm/Addons.js";
import {CuboidMesh, CuboidMeshMultiTexture, CuboidMeshOneColor, CuboidMeshOneTexture} from "../creation";

export class Block {
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
        let mesh: CuboidMesh;

        switch(this.name) {
            case "grass": {
                mesh = new CuboidMeshMultiTexture(1, 1, 1, 1.0, 
                    "grass_textures/grass_top.png",
                    "grass_textures/grass_bottom.png",
                    "grass_textures/grass_side.png",
                    faces,
                );
                break;
            }
            case "dirt": {
                mesh = new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/dirt.png", faces);
                break;
            }
            case "stone": {
                mesh = new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/stone.png", faces);
                break;
            }
            case "glass": {
                mesh = new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/glass.png", faces);
                break;
            }
            case "coal": {
                mesh = new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/coal.png", faces)
                break;
            }
            case "iron": {
                mesh = new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/iron.png", faces);
                break;
            }
            default: {
                mesh = new CuboidMeshOneColor(1, 1, 1, 1.0, this.color, false, faces);
                break;
            }
        }

        return mesh.Mesh();
    }
}