import {Vector2} from "three";
import {Vec2} from "./vec2";
import {Vec3} from "./vec3";

export class Vec2Int extends Vec2 {
    public constructor(x: number = 0, y: number = 0) {
        super(Math.floor(x), Math.floor(y));
    }

    public static floorFromVector2<THIS extends typeof Vec2Int>(vector: Vector2): InstanceType<THIS> {
        return new (this.constructor as any)(vector.x, vector.y);
    }

    public static roundFromVector2<THIS extends typeof Vec2Int>(vector: Vector2): InstanceType<THIS> {
        return new (this.constructor as any)(Math.round(vector.x), Math.round(vector.y));
    }

    public static ceilFromVector2<THIS extends typeof Vec2Int>(vector: Vector2): InstanceType<THIS> {
        return new (this.constructor as any)(Math.ceil(vector.x), Math.ceil(vector.y));
    }

    public static truncFromVector2<THIS extends typeof Vec2Int>(vector: Vector2): InstanceType<THIS> {
        return new (this.constructor as any)(Math.trunc(vector.x), Math.trunc(vector.y));
    }

    public static floorFromVec2<THIS extends typeof Vec2Int>(vector: Vec2): InstanceType<THIS> {
        return new (this.constructor as any)(vector.x, vector.y);
    }

    public static roundFromVec2<THIS extends typeof Vec2Int>(vector: Vec2): InstanceType<THIS> {
        return new (this.constructor as any)(Math.round(vector.x), Math.round(vector.y));
    }

    public static ceilFromVec2<THIS extends typeof Vec2Int>(vector: Vec2): InstanceType<THIS> {
        return new (this.constructor as any)(Math.ceil(vector.x), Math.ceil(vector.y));
    }

    public static truncFromVec2<THIS extends typeof Vec2Int>(vector: Vec2): InstanceType<THIS> {
        return new (this.constructor as any)(Math.trunc(vector.x), Math.trunc(vector.y));
    }
}