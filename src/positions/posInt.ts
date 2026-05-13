import {Vector3} from "three";

export class PosInt {
    readonly x: number;
    readonly y: number;
    readonly z: number;

    protected constructor(x: number = 0, y: number = 0, z: number = 0) {
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.z = Math.floor(z);
    }

    static fromTHREEVector3(vector: Vector3): PosInt {
        return new PosInt(vector.x, vector.y, vector.z);
    }

    clone(): PosInt {
        return new PosInt(this.x, this.y, this.z);
    }

    compare(other: PosInt): boolean {
        return this.x === other.x && this.y === other.y && this.z === other.z;
    }

    createKey(): string {
        return `${this.x},${this.y},${this.z}`
    }

    static interpretKeyToPosInt(key: string): PosInt {
        let numArray = key.split(",").map(Number);

        return new PosInt(numArray[0], numArray[1], numArray[2]);
    }

    asTHREEVector3(): Vector3 {
        return new Vector3(Number(this.x), Number(this.y), Number(this.z));
    }

    add(other: PosInt | number): PosInt {
        if (other instanceof PosInt) return new PosInt(this.x + other.x, this.y + other.y, this.z + other.z);
        else return new PosInt(this.x + other, this.y + other, this.z + other);
    }

    subtract(other: PosInt | number): PosInt {
        if (other instanceof PosInt) return new PosInt(this.x - other.x, this.y - other.y, this.z - other.z);
        else return new PosInt(this.x - other, this.y - other, this.z - other);
    }

    multiply(other: PosInt | number): PosInt {
        if (other instanceof PosInt) return new PosInt(this.x * other.x, this.y * other.y, this.z * other.z);
        else return new PosInt(this.x * other, this.y * other, this.z * other);
    }

    divide(other: PosInt | number): PosInt {
        if (other instanceof PosInt) return new PosInt(this.x / other.x, this.y / other.y, this.z / other.z);
        else return new PosInt(this.x / other, this.y / other, this.z / other);
    }
}