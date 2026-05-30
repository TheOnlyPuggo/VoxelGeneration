import {Vector2, Vector3} from "three";
import {Vec3} from "./vec3";

export class Vec2 {
    public readonly x: number;
    public readonly y: number;

    public constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public static fromVector2<THIS extends Vec2>(vector: Vector2): THIS {
        return new this(vector.x, vector.y) as THIS;
    }

    public static fromVector3<THIS extends Vec2>(vector: Vector3): THIS {
        return new this(vector.x, vector.y) as THIS;
    }

    public static fromVec2<THIS extends Vec2>(vector: Vec2): THIS {
        return new this(vector.x, vector.y) as THIS;
    }

    public static fromVec3<THIS extends Vec2>(vector: Vec3): THIS {
        return new this(vector.x, vector.y) as THIS;
    }

    public static fromKey<THIS extends Vec2>(key: string): THIS {
        let keyArray = key.split(",");
        let numArray = keyArray.map(Number);

        if (numArray.length >= 2) return new this(numArray[0], numArray[1]) as THIS;
        if (numArray.length == 1) return new this(numArray[0]) as THIS;
        return new this() as THIS;
    }

    public getVector2(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    public getKey(): string {
        return `${this.x},${this.y}`
    }

    public equals(other: Vec2): boolean {
        return this.x === other.x && this.y === other.y;
    }

    public add(other: Vec2 | number): this {
        if (other instanceof Vec2) return new (this.constructor as any)(this.x + other.x, this.y + other.y);
        else return new (this.constructor as any)(this.x + other, this.y + other);
    }

    public addX(other: number): this {
        return new (this.constructor as any)(this.x + other, this.y);
    }

    public addY(other: number): this {
        return new (this.constructor as any)(this.x, this.y + other);
    }

    public subtract(other: Vec2 | number): this {
        if (other instanceof Vec2) return new (this.constructor as any)(this.x - other.x, this.y - other.y);
        else return new (this.constructor as any)(this.x - other, this.y - other);
    }

    public subtractX(other: number): this {
        return new (this.constructor as any)(this.x - other, this.y);
    }

    public subtractY(other: number): this {
        return new (this.constructor as any)(this.x, this.y - other);
    }

    public multiply(other: Vec2 | number): this {
        if (other instanceof Vec2) return new (this.constructor as any)(this.x * other.x, this.y * other.y);
        else return new (this.constructor as any)(this.x * other, this.y * other);
    }

    public multiplyX(other: number): this {
        return new (this.constructor as any)(this.x * other, this.y);
    }

    public multiplyY(other: number): this {
        return new (this.constructor as any)(this.x, this.y * other);
    }

    public divide(other: Vec2 | number): this {
        if (other instanceof Vec2) return new (this.constructor as any)(this.x / other.x, this.y / other.y);
        else return new (this.constructor as any)(this.x / other, this.y / other);
    }

    public divideX(other: number): this {
        return new (this.constructor as any)(this.x / other, this.y);
    }

    public divideY(other: number): this {
        return new (this.constructor as any)(this.x, this.y / other);
    }

    public magnitude(): number {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    }

    public normalize(): this {
        return (this.divide as any)(this.magnitude());
    }

    public distanceTo(other: Vec2): number {
        return this.subtract(other).magnitude();
    }
}