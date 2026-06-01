import {World, WorldParameters} from "./world";
import {Scene} from "three";
import {Model} from "../geometry/modelCreation";
import {CameraControls} from "../camera";

export class WorldWrapper {
    public seed: number = Math.round(Math.random() * 1000000000);
    public chunkSize: number = 16;
    public chunkRenderDistance: number = 4;
    public biomeSize: number = 128;
    public heightAmplitude: number = 3
    public mountainHeight: number = 128;
    public structureGeneration: boolean = true;

    private world: World;

    private static firstLoad = true;

    constructor() {
        this.world = new World(this.getNewWorldParams());
    }

    public getWorld(): World {
        return this.world;
    }

    public regenerate(scene: Scene, cameraControls: CameraControls): void {
        this.world.destroy(scene);
        this.world = new World(this.getNewWorldParams());
        this.resetCamera(cameraControls);
        Model.generatedStructureBlocksToLoad = new Map();
    }

    public resetCamera(cameraControls: CameraControls): void {
        //cameraControls.playerPos.x = 7.0;
        //cameraControls.playerPos.z = 7.0;
        let heightAndBiome = this.world.getHeightAndBiomeFromXZ(cameraControls.playerPos.x, cameraControls.playerPos.z);
        while (!heightAndBiome || !heightAndBiome[1]) {
            cameraControls.playerPos.x += 7.0;
            cameraControls.playerPos.z += 7.0;
            heightAndBiome = this.world.getHeightAndBiomeFromXZ(cameraControls.playerPos.x, cameraControls.playerPos.z);
        }
        cameraControls.playerPos.y = heightAndBiome[1] + 10;
        if (WorldWrapper.firstLoad) {
            WorldWrapper.firstLoad = false;
            cameraControls.playerPos.y += 150;
        }
    }

    private getNewWorldParams(): WorldParameters {
        return {
            seed: this.seed,
            chunkSize: this.chunkSize,
            chunkRenderDistance: this.chunkRenderDistance,
            worleyGridSize: this.biomeSize,
            heightAmplitude: this.heightAmplitude,
            mountainHeight: this.mountainHeight,
            enableStructures: this.structureGeneration
        };
    }
}