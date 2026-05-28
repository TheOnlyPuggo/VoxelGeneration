import {BufferGeometry, InstancedMesh, Material, Matrix4} from "three";

export class InstancedGeometry {
    geometryType: InstancedGeometryType;
    instances: Matrix4[] = [];

    constructor(geometryType: InstancedGeometryType) {
        this.geometryType = geometryType;
    }

    addInstance(transform: Matrix4): void {
        this.instances.push(transform);
    }

    createMesh(): InstancedMesh {
        const mesh = new InstancedMesh(this.geometryType.geometry, this.geometryType.material, this.instances.length);

        for (let i = 0; i < this.instances.length; i++) {
            mesh.setMatrixAt(i, this.instances[i]);
        }

        return mesh;
    }
}

export class InstancedGeometryType {
    readonly geometry: BufferGeometry;
    readonly material: Material;

    constructor(geometry: BufferGeometry, material: Material) {
        this.geometry = geometry;
        this.material = material;
    }
}