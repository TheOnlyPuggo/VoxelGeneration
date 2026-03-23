import {CuboidMesh} from "../geometry/creation";
import {FaceMap} from "../geometry/faceMap";
import {CompositeGeometry} from "../geometry/compositeGeometry";

export class Block {
    name: string;
    visible: boolean;
    transparent: boolean;
    meshConstructor: CuboidMesh | null;

    constructor(name: string, visible: boolean, transparent: boolean, meshConstructor: CuboidMesh | null) {
        this.name = name;
        this.visible = visible;
        this.transparent = transparent;
        this.meshConstructor = meshConstructor;
    }

    getGeometry(faces: FaceMap): CompositeGeometry | null {
        if (!this.visible) return null;
        return this.meshConstructor?.constructGeometry(faces) ?? null;
    }
}