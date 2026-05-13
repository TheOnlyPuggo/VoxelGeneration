import {Vector2, Vector3} from "three";
import {Vec3} from "./vec3";

export class Vec2 {
    public readonly x: number;
    public readonly y: number;

    public constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    public static fromVector2<THIS extends typeof Vec2>(vector: Vector2): InstanceType<THIS> {
        return new (this.constructor as any)(vector.x, vector.y);
    }

    public static fromVector3<THIS extends typeof Vec2>(vector: Vector3): InstanceType<THIS> {
        return new (this.constructor as any)(vector.x, vector.y);
    }

    public static fromVec2<THIS extends typeof Vec2>(vector: Vec2): InstanceType<THIS> {
        return new (this.constructor as any)(vector.x, vector.y);
    }

    public static fromVec3<THIS extends typeof Vec2>(vector: Vec3): InstanceType<THIS> {
        return new (this.constructor as any)(vector.x, vector.y);
    }

    public static fromKey<THIS extends typeof Vec2>(key: string): InstanceType<THIS> {
        let keyArray = key.split(",");
        let numArray = keyArray.map(Number);

        if (numArray.length >= 2) return new (this.constructor as any)(numArray[0], numArray[1]);
        if (numArray.length == 1) return new (this.constructor as any)(numArray[0], 0);
        return new (this.constructor as any)(0, 0);
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
}