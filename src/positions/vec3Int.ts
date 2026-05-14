import {Vector3} from "three";
import {Vec3} from "./vec3";

export class Vec3Int extends Vec3 {
    public constructor(x: number = 0, y: number = 0, z: number = 0) {
        super(Math.floor(x), Math.floor(y), Math.floor(z));
    }

    public static floorFromVector3<THIS extends Vec3Int>(vector: Vector3): THIS {
        return new this(vector.x, vector.y, vector.z) as THIS;
    }

    public static roundFromVector3<THIS extends Vec3Int>(vector: Vector3): THIS {
        return new this(Math.round(vector.x), Math.round(vector.y), Math.round(vector.z)) as THIS;
    }

    public static ceilFromVector3<THIS extends Vec3Int>(vector: Vector3): THIS {
        return new this(Math.ceil(vector.x), Math.ceil(vector.y), Math.ceil(vector.z)) as THIS;
    }

    public static truncFromVector3<THIS extends Vec3Int>(vector: Vector3): THIS {
        return new this(Math.trunc(vector.x), Math.trunc(vector.y), Math.trunc(vector.z)) as THIS;
    }

    public static floorFromVec3<THIS extends Vec3Int>(vector: Vec3): THIS {
        return new this(vector.x, vector.y, vector.z) as THIS;
    }

    public static roundFromVec3<THIS extends Vec3Int>(vector: Vec3): THIS {
        return new this(Math.round(vector.x), Math.round(vector.y), Math.round(vector.z)) as THIS;
    }

    public static ceilFromVec3<THIS extends Vec3Int>(vector: Vec3): THIS {
        return new this(Math.ceil(vector.x), Math.ceil(vector.y), Math.ceil(vector.z)) as THIS;
    }

    public static truncFromVec3<THIS extends Vec3Int>(vector: Vec3): THIS {
        return new this(Math.trunc(vector.x), Math.trunc(vector.y), Math.trunc(vector.z)) as THIS;
    }
}