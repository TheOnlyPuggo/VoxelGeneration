import * as THREE from "three";
import { BufferGeometryUtils } from "three/examples/jsm/Addons.js";

const pxFace = new THREE.PlaneGeometry(1, 1);
pxFace.rotateY(Math.PI / 2);
pxFace.translate(0.5, 0, 0);
const nxFace = new THREE.PlaneGeometry(1, 1);
nxFace.rotateY(-Math.PI / 2);
nxFace.translate(-0.5, 0, 0);
const pyFace = new THREE.PlaneGeometry(1, 1);
pyFace.rotateX(-Math.PI / 2);
pyFace.translate(0, 0.5, 0);
const nyFace = new THREE.PlaneGeometry(1, 1);
nyFace.rotateX(Math.PI / 2);
nyFace.translate(0, -0.5, 0);
const pzFace = new THREE.PlaneGeometry(1, 1);
pzFace.translate(0, 0, 0.5);
const nzFace = new THREE.PlaneGeometry(1, 1);
nzFace.rotateY(Math.PI);
nzFace.translate(0, 0, -0.5);

export class Block {
    name: string;
    material: THREE.MeshStandardMaterial | null;

    constructor(name: string, opacity: number, color: THREE.Color) {
        this.name = name;

        if (opacity == 0) {
            this.material = null;
            return;
        }
        this.material = new THREE.MeshStandardMaterial();
        this.material.color = color;
        if (opacity < 1) {
            this.material.transparent = true;
            this.material.opacity = opacity;
        }
    }

    getGeometry(faces: {px: number; nx: number; ny: number; pz: number; nz: number; py: number}) {
        if (this.material == null) return null;

        var geometries = [];
        if (faces.px == 0 || this.getOpacity() == 1 && faces.px < 1) geometries.push(pxFace.clone());
        if (faces.nx == 0 || this.getOpacity() == 1 && faces.nx < 1) geometries.push(nxFace.clone());
        if (faces.py == 0 || this.getOpacity() == 1 && faces.py < 1) geometries.push(pyFace.clone());
        if (faces.ny == 0 || this.getOpacity() == 1 && faces.ny < 1) geometries.push(nyFace.clone());
        if (faces.pz == 0 || this.getOpacity() == 1 && faces.pz < 1) geometries.push(pzFace.clone());
        if (faces.nz == 0 || this.getOpacity() == 1 && faces.nz < 1) geometries.push(nzFace.clone());

        if (geometries.length == 0) return null;

        return BufferGeometryUtils.mergeGeometries(geometries);
    }

    getMaterial() {
        return this.material;
    }

    getOpacity() {
        return this.material == null ? 0 : this.material.opacity;
    }
}