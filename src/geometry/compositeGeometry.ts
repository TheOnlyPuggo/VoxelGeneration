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
            if (geometriesWithMaterial) for (const geometry of value) geometriesWithMaterial.push(geometry);
            else this.geometries.set(key, value);
        }
    }

    addGeometries(geometry: BufferGeometry | BufferGeometry[], material: Material | Material[]): void {
        if (geometry instanceof Array) {
            if (material instanceof Array) {
                for (let i = 0; i < Math.min(geometry.length, material.length); i++) {
                    const geometriesWithMaterial: BufferGeometry[] | undefined = this.geometries.get(material[i]);
                    if (geometriesWithMaterial) geometriesWithMaterial.push(geometry[i]);
                    else this.geometries.set(material[i], [geometry[i]]);
                }
            } else {
                let geometriesWithMaterial: BufferGeometry[] | undefined = this.geometries.get(material);
                if (!geometriesWithMaterial) {
                    geometriesWithMaterial = [];
                    this.geometries.set(material, geometriesWithMaterial);
                }
                for (let i = 0; i < geometry.length; i++) geometriesWithMaterial.push(geometry[i]);
            }
        } else {
            if (material instanceof Array) {
                material = material[0];
            }
            const geometriesWithMaterial: BufferGeometry[] | undefined = this.geometries.get(material);
            if (geometriesWithMaterial) geometriesWithMaterial.push(geometry);
            else this.geometries.set(material, [geometry]);
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