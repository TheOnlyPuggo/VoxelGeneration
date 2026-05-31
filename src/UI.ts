import {Camera, Scene} from "three";
// @ts-ignore
import {GUI} from 'lil-gui';
import {CameraControls} from './camera';
import {WorldWrapper} from "./worldgen/worldWrapper";

type GameLike = {
    worldWrapper: WorldWrapper | null
    camera: Camera | null
    cameraControls: CameraControls | null,
    scene: Scene | null
}

export function CreateGUI(gameProps: GameLike) {
    const gui = new GUI();
    const positionFolder = gui.addFolder("Position");
    const cameraFolder = gui.addFolder("Camera");
    const seedFolder = gui.addFolder("Seed");

    if (gameProps.camera) {
        positionFolder.add(gameProps.camera.position, "x").listen().onChange((value: number) => {
            if (gameProps.worldWrapper) gameProps.worldWrapper.getWorld().SetStructureGenFirstTime(true);
        });
        positionFolder.add(gameProps.camera.position, "y").listen().onChange((value: number) => {
            if (gameProps.worldWrapper) gameProps.worldWrapper.getWorld().SetStructureGenFirstTime(true);
        });
        positionFolder.add(gameProps.camera.position, "z").listen().onChange((value: number) => {
            if (gameProps.worldWrapper) gameProps.worldWrapper.getWorld().SetStructureGenFirstTime(true);
        });
    }

    if (gameProps.cameraControls) {
        cameraFolder.add(gameProps.cameraControls, "isFlyingControls").listen();
    }

    if (gameProps.worldWrapper) {
        seedFolder.add(gameProps.worldWrapper, "seed").listen();
        seedFolder.add(gameProps.worldWrapper, "biomeSize").listen();
        seedFolder.add({
            regenerateWorld: function() {
                if (gameProps.scene && gameProps.cameraControls) {
                    gameProps.worldWrapper?.regenerate(gameProps.scene, gameProps.cameraControls);
                }
            }
        }, "regenerateWorld");
    }
}