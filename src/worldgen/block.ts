import {CubeMesh} from "../geometry/creation";

export class Block {
    public readonly name: string;
    public readonly meshConstructor: CubeMesh | null;
    public readonly solid: boolean;

    public constructor(name: string, meshConstructor: CubeMesh | null, solid: boolean) {
        this.name = name;
        this.meshConstructor = meshConstructor;
        this.solid = solid;
    }

    public equals(other: Block): boolean {
        return this.name === other.name;
    }

    public getVisible(): boolean {
        return this.meshConstructor != null;
    }

    public getSolid(): boolean {
        return this.solid;
    }

    public getTransparent(): boolean {
        return !this.meshConstructor || this.meshConstructor.transparent;
    }
}