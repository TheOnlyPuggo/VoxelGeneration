import {CubeMesh} from "../geometry/creation";
import {FaceMap} from "../geometry/faceMap";
import {CompositeGeometry} from "../geometry/compositeGeometry";

export class Block {
    public readonly name: string;
    public readonly meshConstructor: CubeMesh | null;

    public constructor(name: string, meshConstructor: CubeMesh | null) {
        this.name = name;
        this.meshConstructor = meshConstructor;
    }

    public getGeometry(faces: FaceMap): CompositeGeometry | null {
        if (!this.getVisible()) return null;
        return this.meshConstructor?.constructGeometry(faces) ?? null;
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