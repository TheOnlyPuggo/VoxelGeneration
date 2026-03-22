import * as THREE from 'three';
import { FlyControls } from 'three/examples/jsm/Addons.js';

export class CameraControls {
    camera: THREE.Camera;
    canvas: HTMLCanvasElement;
    speed: number;
    isFlyingControls: boolean;
    
    flyControls: FlyControls;

    constructor(camera: THREE.Camera, canvas: HTMLCanvasElement, speed: number = 0.0, isFlyingControls = false) {
        this.camera = camera;
        this.canvas = canvas;
        this.speed = speed;
        this.isFlyingControls = isFlyingControls;

        this.flyControls = new FlyControls(camera, canvas);
    }

    Update() {
        if (this.isFlyingControls) this.FlyingHandle();
    }

    FlyingHandle() {
        this.flyControls.movementSpeed = this.speed;
        this.flyControls.rollSpeed = Math.PI / 12;
        this.flyControls.dragToLook = true;

        this.flyControls.update(0.01);
    }
}