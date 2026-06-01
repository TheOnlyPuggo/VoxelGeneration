import {
    Camera,
    DirectionalLight,
    MathUtils,
    Scene,
    Vector3
} from "three";
import {World, BiomeDistance, BiomeTypes} from "./world";
import { BlockPos } from "../positions/blockPos";
import { CameraControls } from "../camera";
import { WorldWrapper } from "./worldWrapper";
import { GroundedSkybox } from "three/examples/jsm/objects/GroundedSkybox.js";

type GameLike = {
    scene: Scene | null,
    directionalLight: DirectionalLight | null,
    worldWrapper: WorldWrapper | null,
    cameraControls: CameraControls | null,
    environment: {
        skybox: GroundedSkybox | null,
    },
}

export class WorldVisuals {
    private plainsLightStrength: number = 2;
    private desertLightStrength: number = 3;
    private tundraLightStrength: number = 0.8;
    private mountainLightStrength: number = 1.8;

    private plainsEnviroIntensity: number = 0.2;
    private desertEnviroIntensity: number = 0.3;
    private tundraEnviroIntensity: number = 0.3;
    private mountainEnviroIntensity: number = 0.2;

    private skyboxBackgroundStrengthMult: number = 0.5;
    private directionalLightLerpSpeed: number = 1;
    private game: GameLike;

    constructor(game: GameLike) {
        this.game = game;
    }


    Animate(delta: number) {
        let world = this.game.worldWrapper?.getWorld();
        let camControls = this.game.cameraControls;
        let playerFeetPos = camControls?.getPlayerFeetPos();

        if (world) {
            let biomeData = world?.getBiomeData(new BlockPos(playerFeetPos?.x, playerFeetPos?.y, playerFeetPos?.z));
            let currentBiome = biomeData[0].biome;

            switch(currentBiome) {
                case BiomeTypes.Desert:
                case BiomeTypes.Ocean:
                    if (this.game.directionalLight && this.game.scene) {
                        this.game.directionalLight.intensity = MathUtils.lerp(this.game.directionalLight.intensity, this.desertLightStrength, 1 - Math.exp(-this.directionalLightLerpSpeed * delta));
                        this.game.scene.backgroundIntensity = MathUtils.lerp(this.game.scene.backgroundIntensity, this.desertLightStrength * this.skyboxBackgroundStrengthMult, 1 - Math.exp(-this.directionalLightLerpSpeed * delta)); //Skybox Background Brightness
                        this.game.scene.environmentIntensity = MathUtils.lerp(this.game.scene.environmentIntensity, this.desertEnviroIntensity, 1 - Math.exp(-this.directionalLightLerpSpeed * delta));
                    }
                    break;
                case BiomeTypes.Mountain:
                    if (this.game.directionalLight && this.game.scene) {
                        this.game.directionalLight.intensity = MathUtils.lerp(this.game.directionalLight.intensity, this.mountainLightStrength, 1 - Math.exp(-this.directionalLightLerpSpeed * delta));
                        this.game.scene.backgroundIntensity = MathUtils.lerp(this.game.scene.backgroundIntensity, this.mountainLightStrength * this.skyboxBackgroundStrengthMult, 1 - Math.exp(-this.directionalLightLerpSpeed * delta)); //Skybox Background Brightness
                        this.game.scene.environmentIntensity = MathUtils.lerp(this.game.scene.environmentIntensity, this.mountainEnviroIntensity, 1 - Math.exp(-this.directionalLightLerpSpeed * delta));

                    }
                    break;
                case BiomeTypes.Tundra:
                    if (this.game.directionalLight && this.game.scene) {
                        this.game.directionalLight.intensity = MathUtils.lerp(this.game.directionalLight.intensity, this.tundraLightStrength, 1 - Math.exp(-this.directionalLightLerpSpeed * delta));
                        this.game.scene.backgroundIntensity = MathUtils.lerp(this.game.scene.backgroundIntensity, this.tundraLightStrength * this.skyboxBackgroundStrengthMult, 1 - Math.exp(-this.directionalLightLerpSpeed * delta)); //Skybox Background Brightness
                        this.game.scene.environmentIntensity = MathUtils.lerp(this.game.scene.environmentIntensity, this.tundraEnviroIntensity, 1 - Math.exp(-this.directionalLightLerpSpeed * delta));
            
                    }
                    break;
                case BiomeTypes.Plains:
                    if (this.game.directionalLight && this.game.scene) {
                        this.game.directionalLight.intensity = MathUtils.lerp(this.game.directionalLight.intensity, this.plainsLightStrength, 1 - Math.exp(-this.directionalLightLerpSpeed * delta));
                        this.game.scene.backgroundIntensity = MathUtils.lerp(this.game.scene.backgroundIntensity, this.plainsLightStrength * this.skyboxBackgroundStrengthMult, 1 - Math.exp(-this.directionalLightLerpSpeed * delta)); //Skybox Background Brightness
                        this.game.scene.environmentIntensity = MathUtils.lerp(this.game.scene.environmentIntensity, this.plainsEnviroIntensity, 1 - Math.exp(-this.directionalLightLerpSpeed * delta));
                    }
                    break;
            }
        }

    }
}