import * as THREE from "three";
import {BufferGeometryUtils} from "three/examples/jsm/Addons.js";
import {CuboidMesh, CuboidMeshOneColor} from "../creation";

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
        let mesh: CuboidMesh = new CuboidMeshOneColor(1, 1, 1, this.color, false, faces);
        return mesh.Mesh();
    }
}