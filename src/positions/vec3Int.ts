import {Vector3} from "three";
import {Vec3} from "./vec3";

export class Vec3Int extends Vec3 {
    public constructor(x: number = 0, y: number = 0, z: number = 0) {
        super(Math.floor(x), Math.floor(y), Math.floor(z));
    }

    public static floorFromVector3<THIS extends typeof Vec3Int>(vector: Vector3): InstanceType<THIS> {
        return new (this.constructor as any)(vector.x, vector.y, vector.z);
    }

    public static roundFromVector3<THIS extends typeof Vec3Int>(vector: Vector3): InstanceType<THIS> {
        return new (this.constructor as any)(Math.round(vector.x), Math.round(vector.y), Math.round(vector.z));
    }

    public static ceilFromVector3<THIS extends typeof Vec3Int>(vector: Vector3): InstanceType<THIS> {
        return new (this.constructor as any)(Math.ceil(vector.x), Math.ceil(vector.y), Math.ceil(vector.z));
    }

    public static truncFromVector3<THIS extends typeof Vec3Int>(vector: Vector3): InstanceType<THIS> {
        return new (this.constructor as any)(Math.trunc(vector.x), Math.trunc(vector.y), Math.trunc(vector.z));
    }

    public static floorFromVec3<THIS extends typeof Vec3Int>(vector: Vec3): InstanceType<THIS> {
        return new (this.constructor as any)(vector.x, vector.y, vector.z);
    }

    public static roundFromVec3<THIS extends typeof Vec3Int>(vector: Vec3): InstanceType<THIS> {
        return new (this.constructor as any)(Math.round(vector.x), Math.round(vector.y), Math.round(vector.z));
    }

    public static ceilFromVec3<THIS extends typeof Vec3Int>(vector: Vec3): InstanceType<THIS> {
        return new (this.constructor as any)(Math.ceil(vector.x), Math.ceil(vector.y), Math.ceil(vector.z));
    }

    public static truncFromVec3<THIS extends typeof Vec3Int>(vector: Vec3): InstanceType<THIS> {
        return new (this.constructor as any)(Math.trunc(vector.x), Math.trunc(vector.y), Math.trunc(vector.z));
    }
}