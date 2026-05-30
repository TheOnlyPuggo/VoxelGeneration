import {BufferGeometry, Material, Matrix4, Mesh} from "three";
import {BufferGeometryUtils} from "three/examples/jsm/Addons.js";
import {Vec3} from "../positions/vec3";
import {InstancedGeometry, InstancedGeometryType} from "./instancedGeometry";

export class CompositeGeometry {
    static readonly instancedGeometryTypes: InstancedGeometryType[] = [];
    readonly geometries: Map<Material, BufferGeometry[]> = new Map();
    readonly instancedGeometries: Map<number, InstancedGeometry> = new Map();

    public static addInstancedGeometryType(geometry: BufferGeometry, material: Material): number {
        this.instancedGeometryTypes.push(new InstancedGeometryType(this.instancedGeometryTypes.length, geometry, material));

        return this.instancedGeometryTypes.length - 1;
    }

    public addInstancedGeometry(instancedGeometry: InstancedGeometry | undefined): void {
        if (instancedGeometry === undefined) return;
        let existingGeometry: InstancedGeometry | undefined = this.instancedGeometries.get(instancedGeometry.geometryType.index);
        if (existingGeometry) existingGeometry.addInstancedGeometry(instancedGeometry);
        else this.instancedGeometries.set(instancedGeometry.geometryType.index, instancedGeometry);
    }

    public addGeometryInstance(geometryTypeIndex: number, transform: Matrix4): void {
        let instancedGeometry: InstancedGeometry | undefined = this.instancedGeometries.get(geometryTypeIndex);
        if (!instancedGeometry) {
            instancedGeometry = new InstancedGeometry(geometryTypeIndex);
            this.instancedGeometries.set(geometryTypeIndex, instancedGeometry);
        }
        instancedGeometry.addInstances(transform);
    }

    /*addGeometryInstances(geometryTypeIndexes: number | number[], transforms: Matrix4 | Matrix4[]): void {
        if (transforms instanceof Array) {
            if (geometryTypeIndexes instanceof Array) {
                for (let i = 0; i < Math.min(geometryTypeIndexes.length, transforms.length); i++) {
                    this.addGeometryInstance(geometryTypeIndexes[i], transforms[i]);
                }
            } else {
                let instancedGeometry: InstancedGeometry | undefined = this.instancedGeometries.get(geometryTypeIndexes);
                if (!instancedGeometry) {
                    instancedGeometry = new InstancedGeometry(geometryTypeIndexes);
                    this.instancedGeometries.set(geometryTypeIndexes, instancedGeometry);
                }
                instancedGeometry.addInstances(transforms);
            }
        } else {
            if (geometryTypeIndexes instanceof Array) {
                geometryTypeIndexes = geometryTypeIndexes[0];
            }
            this.addGeometryInstance(geometryTypeIndexes, transforms);
        }
    }*/

    public addComposite(composite: CompositeGeometry | undefined): void {
        if (composite === undefined) return;
        for (const [material, geometries] of composite.geometries) {
            this.addGeometries(geometries, material);
        }
        for (const [index, instancedGeometry] of composite.instancedGeometries) {
            this.addInstancedGeometry(instancedGeometry);
        }
    }

    public addGeometry(geometry: BufferGeometry, material: Material): void {
        const geometriesWithMaterial: BufferGeometry[] | undefined = this.geometries.get(material);
        if (geometriesWithMaterial) geometriesWithMaterial.push(geometry);
        else this.geometries.set(material, [geometry]);
    }

    public addGeometries(geometries: BufferGeometry | BufferGeometry[], materials: Material | Material[]): void {
        if (geometries instanceof Array) {
            if (materials instanceof Array) {
                for (let i = 0; i < Math.min(geometries.length, materials.length); i++) {
                    this.addGeometry(geometries[i], materials[i]);
                }
            } else {
                let geometriesWithMaterial: BufferGeometry[] | undefined = this.geometries.get(materials);
                if (geometriesWithMaterial)
                    for (let i = 0; i < geometries.length; i++) geometriesWithMaterial.push(geometries[i]);
                else this.geometries.set(materials, geometries);
            }
        } else {
            if (materials instanceof Array) {
                materials = materials[0];
            }
            this.addGeometry(geometries, materials);
        }
    }

    public getCombinedMeshes(): Mesh[] {
        const meshes: Mesh[] = [];
        for (const [material, geometries] of this.geometries) {
            const mesh = new Mesh(BufferGeometryUtils.mergeGeometries(geometries, false), material);
            mesh.castShadow    = material.userData.castShadow    ?? material.visible;
            mesh.receiveShadow = material.userData.receiveShadow ?? material.visible;
            material.visible = true;
            meshes.push(mesh);
        }
        for (const [index, instancedGeometry] of this.instancedGeometries) {
            const mesh = instancedGeometry.createMesh();
            const mat = instancedGeometry.geometryType.material;
            mesh.castShadow    = mat.userData.castShadow    ?? mat.visible;
            mesh.receiveShadow = mat.userData.receiveShadow ?? mat.visible;
            instancedGeometry.geometryType.material.visible = true;
            meshes.push(mesh);
        }
        return meshes;
    }

    public translate(pos: Vec3): void {
        for (const [material, geometries] of this.geometries) {
            for (const geometry of geometries) {
                geometry.translate(pos.x, pos.y, pos.z);
            }
        }
        for (const [index, instancedGeometry] of this.instancedGeometries) {
            instancedGeometry.translate(pos);
        }
    }

    public isEmpty(): boolean {
        return this.geometries.size === 0 && this.instancedGeometries.size === 0;
    }
}