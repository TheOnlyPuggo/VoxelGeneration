
import {Camera} from "three";
import {GUI} from 'lil-gui';
import {CameraControls} from './camera';

type GameLike = {
    camera: Camera | null
    cameraControls: CameraControls | null,
}

export function CreateGUI(gameProps: GameLike) {
    const gui = new GUI();
    const positionFolder = gui.addFolder("Position");
    const cameraFolder = gui.addFolder("Camera");

    if (gameProps.camera != null) {
        positionFolder.add(gameProps.camera.position, "x").listen();
        positionFolder.add(gameProps.camera.position, "y").listen();
        positionFolder.add(gameProps.camera.position, "z").listen();
    }

    if (gameProps.cameraControls != null) {
        cameraFolder.add(gameProps.cameraControls, "isFlyingControls").listen();
    }
}