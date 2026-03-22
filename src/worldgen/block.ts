import * as THREE from "three";
import {BufferGeometryUtils} from "three/examples/jsm/Addons.js";

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
        if (this.opacity === 0) return null;
        return new THREE.Mesh();
    }
}