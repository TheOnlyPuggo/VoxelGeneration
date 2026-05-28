import {BufferGeometry, InstancedMesh, Material, Matrix4, Mesh} from "three";
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

    addGeometries(geometries: BufferGeometry | BufferGeometry[], materials: Material | Material[]): void {
        if (geometries instanceof Array) {
            if (materials instanceof Array) {
                for (let i = 0; i < Math.min(geometries.length, materials.length); i++) {
                    this.addGeometry(geometries[i], materials[i]);
                }
            } else {
                let geometriesWithMaterial: BufferGeometry[] | undefined = this.geometries.get(materials);
                if (!geometriesWithMaterial) {
                    geometriesWithMaterial = [];
                    this.geometries.set(materials, geometriesWithMaterial);
                }
                for (let i = 0; i < geometries.length; i++) geometriesWithMaterial.push(geometries[i]);
            }
        } else {
            if (materials instanceof Array) {
                materials = materials[0];
            }
            this.addGeometry(geometries, materials);
        }
    }

    addGeometry(geometry: BufferGeometry, material: Material): void {
        const geometriesWithMaterial: BufferGeometry[] | undefined = this.geometries.get(material);
        if (geometriesWithMaterial) geometriesWithMaterial.push(geometry);
        else this.geometries.set(material, [geometry]);
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

export class InstancedGeometry {
    geometry: BufferGeometry;
    material: Material;
    instances: Matrix4[] = [];

    constructor(geometry: BufferGeometry, material: Material) {
        this.geometry = geometry;
        this.material = material;
    }

    addInstance(transform: Matrix4): void {
        this.instances.push(transform);
    }

    createMesh(): InstancedMesh {
        const mesh = new InstancedMesh(this.geometry, this.material, this.instances.length);

        for (let i = 0; i < this.instances.length; i++) {
            mesh.setMatrixAt(i, this.instances[i]);
        }

        return mesh;
    }
}