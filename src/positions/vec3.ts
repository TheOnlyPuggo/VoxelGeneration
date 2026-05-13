import {Vector2, Vector3} from "three";
import {Vec2} from "./vec2";

export class Vec3 {
    public readonly x: number;
    public readonly y: number;
    public readonly z: number;

    public constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public static fromVector3<THIS extends typeof Vec3>(vector: Vector3): InstanceType<THIS> {
        return new (this.constructor as any)(vector.x, vector.y, vector.z);
    }

    public static fromVector2<THIS extends typeof Vec3>(vector: Vector2): InstanceType<THIS> {
        return new (this.constructor as any)(vector.x, vector.y, 0);
    }

    public static fromVec3<THIS extends typeof Vec3>(vector: Vec3): InstanceType<THIS> {
        return new (this.constructor as any)(vector.x, vector.y, vector.z);
    }

    public static fromVec2<THIS extends typeof Vec3>(vector: Vec2): InstanceType<THIS> {
        return new (this.constructor as any)(vector.x, vector.y, 0);
    }

    public static fromKey<THIS extends typeof Vec3>(key: string): InstanceType<THIS> {
        let keyArray = key.split(",");
        let numArray = keyArray.map(Number);

        if (numArray.length >= 3) return new (this.constructor as any)(numArray[0], numArray[1], numArray[2]);
        if (numArray.length == 2) return new (this.constructor as any)(numArray[0], numArray[1], 0);
        if (numArray.length == 1) return new (this.constructor as any)(numArray[0], 0, 0);
        return new (this.constructor as any)(0, 0, 0);
    }

    public getVector3(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }

    public getKey(): string {
        return `${this.x},${this.y},${this.z}`
    }

    public equals(other: Vec3): boolean {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }

    public add(other: Vec3 | number): this {
        if (other instanceof Vec3) return new (this.constructor as any)(this.x + other.x, this.y + other.y, this.z + other.z);
        else return new (this.constructor as any)(this.x + other, this.y + other, this.z + other);
    }

    public addX(other: number): this {
        return new (this.constructor as any)(this.x + other, this.y, this.z);
    }

    public addY(other: number): this {
        return new (this.constructor as any)(this.x, this.y + other, this.z);
    }

    public addZ(other: number): this {
        return new (this.constructor as any)(this.x, this.y, this.z + other);
    }

    public subtract(other: Vec3 | number): this {
        if (other instanceof Vec3) return new (this.constructor as any)(this.x - other.x, this.y - other.y, this.z - other.z);
        else return new (this.constructor as any)(this.x - other, this.y - other, this.z - other);
    }

    public subtractX(other: number): this {
        return new (this.constructor as any)(this.x - other, this.y, this.z);
    }

    public subtractY(other: number): this {
        return new (this.constructor as any)(this.x, this.y - other, this.z);
    }

    public subtractZ(other: number): this {
        return new (this.constructor as any)(this.x, this.y, this.z - other);
    }

    public multiply(other: Vec3 | number): this {
        if (other instanceof Vec3) return new (this.constructor as any)(this.x * other.x, this.y * other.y, this.z * other.z);
        else return new (this.constructor as any)(this.x * other, this.y * other, this.z * other);
    }

    public multiplyX(other: number): this {
        return new (this.constructor as any)(this.x * other, this.y, this.z);
    }

    public multiplyY(other: number): this {
        return new (this.constructor as any)(this.x, this.y * other, this.z);
    }

    public multiplyZ(other: number): this {
        return new (this.constructor as any)(this.x, this.y, this.z * other);
    }

    public divide(other: Vec3 | number): this {
        if (other instanceof Vec3) return new (this.constructor as any)(this.x / other.x, this.y / other.y, this.z / other.z);
        else return new (this.constructor as any)(this.x / other, this.y / other, this.z / other);
    }

    public divideX(other: number): this {
        return new (this.constructor as any)(this.x / other, this.y, this.z);
    }

    public divideY(other: number): this {
        return new (this.constructor as any)(this.x, this.y / other, this.z);
    }

    public divideZ(other: number): this {
        return new (this.constructor as any)(this.x, this.y, this.z / other);
    }
}