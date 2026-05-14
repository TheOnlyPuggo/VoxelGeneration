import {BufferGeometry, Material, Mesh} from "three";
import {BufferGeometryUtils} from "three/examples/jsm/Addons.js";
import {Vec3} from "../positions/vec3";

export class CompositeGeometry {
    readonly geometries: Map<Material, BufferGeometry[]> = new Map();
    castShadow: boolean;
    receiveShadow: boolean;

    constructor(geometries: BufferGeometry[], materials: Material[]) {
        this.addGeometries(geometries, materials);

        this.castShadow = true;
        this.receiveShadow = true;
    }

    addComposite(composite: CompositeGeometry | undefined): void {
        if (composite === undefined) return;
        for (const [key, value] of composite.geometries) {
            const geometriesWithMaterial: BufferGeometry[] | undefined = this.geometries.get(key);
            if (geometriesWithMaterial) geometriesWithMaterial.concat(value);
            else this.geometries.set(key, value);
        }
    }

    addGeometries(geometries: BufferGeometry[], materials: Material[]): void {
        for (let i = 0; i < Math.min(geometries.length, materials.length); i++) {
            const geometriesWithMaterial: BufferGeometry[] | undefined = this.geometries.get(materials[i]);
            if (geometriesWithMaterial) geometriesWithMaterial.push(geometries[i]);
            else this.geometries.set(materials[i], [geometries[i]]);
        }
    }

    getCombinedMeshes(): Mesh[] {
        const meshes: Mesh[] = [];
        for (const [key, value] of this.geometries) {
            const mesh = new Mesh(BufferGeometryUtils.mergeGeometries(value, false), key);
            mesh.castShadow = this.castShadow;
            mesh.receiveShadow = this.receiveShadow;
            meshes.push(mesh);
        }
        return meshes;
    }

    translate(pos: Vec3): void {
        for (const [key, value] of this.geometries) {
            for (const geometry of value) {
                geometry.translate(pos.x, pos.y, pos.z);
            }
        }
    }

    isEmpty(): boolean {
        return this.geometries.size === 0;
    }
}