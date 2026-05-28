import {BufferGeometry, InstancedMesh, Material, Matrix4, Mesh, Sphere, Vector3} from "three";
import {CompositeGeometry} from "./compositeGeometry";
import {Vec3} from "../positions/vec3";

export class InstancedGeometry {
    geometryType: InstancedGeometryType;
    instances: Matrix4[] = [];

    public constructor(geometryType: InstancedGeometryType | number) {
        if (geometryType instanceof InstancedGeometryType) this.geometryType = geometryType;
        else this.geometryType = CompositeGeometry.instancedGeometryTypes[geometryType];
    }

    public addInstances(transforms: Matrix4 | Matrix4[]): void {
        if (transforms instanceof Array) for (const transform of transforms) this.instances.push(transform);
        else this.instances.push(transforms);
    }

    public addInstancedGeometry(instancedGeometry: InstancedGeometry): void {
        if (this.geometryType.index !== instancedGeometry.geometryType.index) return;

        this.addInstances(instancedGeometry.instances);
    }

    public createMesh(): Mesh {
        const mesh = new InstancedMesh(this.geometryType.geometry.clone(), this.geometryType.material, this.instances.length);

        for (let i = 0; i < this.instances.length; i++) {
            mesh.setMatrixAt(i, this.instances[i]);
            //mesh.setMatrixAt(i, new Matrix4().makeTranslation(0, i, 0));
        }

        mesh.frustumCulled = false;
        mesh.geometry.boundingSphere = new Sphere(
            new Vector3(0, 0, 0),
            1000000
        );
        mesh.computeBoundingBox();
        mesh.computeBoundingSphere();

        return mesh;
    }

    public translate(pos: Vec3): void {
        const translation: Matrix4 = new Matrix4().makeTranslation(pos.x, pos.y, pos.z);
        for (const instance of this.instances) instance.premultiply(translation);
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