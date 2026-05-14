import {Vector2} from "three";
import {Vec2} from "./vec2";
import {Vec3} from "./vec3";

export class Vec2Int extends Vec2 {
    public constructor(x: number = 0, y: number = 0) {
        super(Math.floor(x), Math.floor(y));
    }

    public static floorFromVector2<THIS extends Vec2Int>(vector: Vector2): THIS {
        return new this(vector.x, vector.y) as THIS;
    }

    public static roundFromVector2<THIS extends Vec2Int>(vector: Vector2): THIS {
        return new this(Math.round(vector.x), Math.round(vector.y)) as THIS;
    }

    public static ceilFromVector2<THIS extends Vec2Int>(vector: Vector2): THIS {
        return new this(Math.ceil(vector.x), Math.ceil(vector.y)) as THIS;
    }

    public static truncFromVector2<THIS extends Vec2Int>(vector: Vector2): THIS {
        return new this(Math.trunc(vector.x), Math.trunc(vector.y)) as THIS;
    }

    public static floorFromVec2<THIS extends Vec2Int>(vector: Vec2): THIS {
        return new this(vector.x, vector.y) as THIS;
    }

    public static roundFromVec2<THIS extends Vec2Int>(vector: Vec2): THIS {
        return new this(Math.round(vector.x), Math.round(vector.y)) as THIS;
    }

    public static ceilFromVec2<THIS extends Vec2Int>(vector: Vec2): THIS {
        return new this(Math.ceil(vector.x), Math.ceil(vector.y)) as THIS;
    }

    public static truncFromVec2<THIS extends Vec2Int>(vector: Vec2): THIS {
        return new this(Math.trunc(vector.x), Math.trunc(vector.y)) as THIS;
    }
}