import {CubeMesh} from "../geometry/creation";

export class Block {
    public readonly name: string;
    public readonly meshConstructor: CubeMesh | null;

    public constructor(name: string, meshConstructor: CubeMesh | null) {
        this.name = name;
        this.meshConstructor = meshConstructor;
    }

    public equals(other: Block): boolean {
        return this.name === other.name;
    }

    public getVisible(): boolean {
        return this.meshConstructor != null;
    }

    public getTransparent(): boolean {
        return !this.meshConstructor || this.meshConstructor.transparent;
    }
}