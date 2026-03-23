import {BufferGeometry, Material, Mesh} from "three";
import {BufferGeometryUtils} from "three/examples/jsm/Addons";

export class CompositeGeometry {
    readonly geometries: BufferGeometry[];
    readonly materials: Material[];
    castShadow: boolean;
    receiveShadow: boolean;

    constructor(geometries: BufferGeometry[], materials: Material[]) {
        if (geometries.length > materials.length) this.geometries = geometries.slice(0, materials.length);
        else this.geometries = geometries;
        if (materials.length > geometries.length) this.materials = materials.slice(0, materials.length);
        else this.materials = materials;

        this.castShadow = false;
        this.receiveShadow = false;
    }

    addComposite(composite: CompositeGeometry | null): void {
        if (composite === null) return;
        for (const geometry of composite.geometries) this.geometries.push(geometry);
        for (const material of composite.materials) this.materials.push(material);
    }

    addGeometries(geometries: BufferGeometry[], materials: Material[]): void {
        for (const geometry of geometries) this.geometries.push(geometry);
        for (const material of materials) this.materials.push(material);
    }

    getCombinedMesh() {
        return new Mesh(BufferGeometryUtils.mergeGeometries(this.geometries, true), this.materials);
    }

    translate(x: number, y: number, z: number): void {
        for (const geometry of this.geometries) {
            geometry.translate(x, y, z);
        }
    }

    isEmpty(): boolean {
        return this.geometries.length === 0;
    }
}