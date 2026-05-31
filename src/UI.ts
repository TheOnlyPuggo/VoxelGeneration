import {Camera} from "three";
// @ts-ignore
import {GUI} from 'lil-gui';
import {CameraControls} from './camera';
import {World} from "./worldgen/world";

type GameLike = {
    world: World | null
    camera: Camera | null
    cameraControls: CameraControls | null,
}

export function CreateGUI(gameProps: GameLike) {
    const gui = new GUI();
    const positionFolder = gui.addFolder("Position");
    const cameraFolder = gui.addFolder("Camera");

    if (gameProps.camera != null) {
        positionFolder.add(gameProps.camera.position, "x").listen().onChange((value: number) => {
            if (gameProps.world != null) gameProps.world.SetStructureGenFirstTime(true);
        });
        positionFolder.add(gameProps.camera.position, "y").listen().onChange((value: number) => {
            if (gameProps.world != null) gameProps.world.SetStructureGenFirstTime(true);
        });
        positionFolder.add(gameProps.camera.position, "z").listen().onChange((value: number) => {
            if (gameProps.world != null) gameProps.world.SetStructureGenFirstTime(true);
        });
    }

    if (gameProps.cameraControls != null) {
        cameraFolder.add(gameProps.cameraControls, "isFlyingControls").listen();
    }
}