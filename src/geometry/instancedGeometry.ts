import {BufferGeometry, InstancedMesh, Material, Matrix4} from "three";
import {CompositeGeometry} from "./compositeGeometry";

export class InstancedGeometry {
    geometryType: InstancedGeometryType;
    instances: Matrix4[] = [];

    constructor(geometryType: InstancedGeometryType | number) {
        if (geometryType instanceof InstancedGeometryType) this.geometryType = geometryType;
        else this.geometryType = CompositeGeometry.instancedGeometryTypes[geometryType];
    }

    addInstances(transforms: Matrix4 | Matrix4[]): void {
        if (transforms instanceof Array) for (let i = 0; i < transforms.length; i++) this.instances.push(transforms[i]);
        else this.instances.push(transforms);
    }

    addInstancedGeometry(instancedGeometry: InstancedGeometry): void {
        if (this.geometryType.index !== instancedGeometry.geometryType.index) return;

        this.addInstances(instancedGeometry.instances);
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
    readonly index: number;
    readonly geometry: BufferGeometry;
    readonly material: Material;

    constructor(index: number, geometry: BufferGeometry, material: Material) {
        this.index = index;
        this.geometry = geometry;
        this.material = material;
    }
}