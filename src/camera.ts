import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export class CameraControls {
    camera: THREE.Camera;
    canvas: HTMLCanvasElement;
    speed: number;
    isFlyingControls: boolean;

    pointerLockControls: PointerLockControls;
    inputWrapper: InputWrapper;

    constructor(camera: THREE.Camera, canvas: HTMLCanvasElement, speed: number = 0.0, isFlyingControls = false) {
        this.camera = camera;
        this.canvas = canvas;
        this.speed = speed;
        this.isFlyingControls = isFlyingControls;

        this.pointerLockControls = new PointerLockControls(this.camera, this.canvas);
        document.addEventListener('click', () => this.pointerLockControls.lock());

        this.inputWrapper = new InputWrapper();
    }

    Update(delta: number) {
        if (this.isFlyingControls) this.FlyingHandle(delta);
    }

    FlyingHandle(delta: number) {
        let direction = new THREE.Vector3();
        direction.set(
            Number(this.inputWrapper.inputs.get(Input.Right)) - Number(this.inputWrapper.inputs.get(Input.Left)),
            Number(this.inputWrapper.inputs.get(Input.Up)) - Number(this.inputWrapper.inputs.get(Input.Down)),
            Number(this.inputWrapper.inputs.get(Input.Backward)) - Number(this.inputWrapper.inputs.get(Input.Forward)),
        );

        direction.multiplyScalar(10);

        this.pointerLockControls.moveRight(direction.x * delta);
        this.camera.position.y += (direction.y * delta);
        this.camera.translateZ(direction.z * delta);
    }
}

enum Input {
    Forward,
    Backward,
    Left,
    Right,
    Up,
    Down,
}

export class InputWrapper {
    inputs;
    inputMap: Map<string, Input>;

    constructor() {
        this.inputs = new Map<Input, boolean>([
            [Input.Forward, false],
            [Input.Backward, false],
            [Input.Left, false],
            [Input.Right, false],
            [Input.Up, false],
            [Input.Down, false],
        ]);

        this.inputMap = new Map<string, Input>([
            ["KeyW", Input.Forward],
            ["KeyS", Input.Backward],
            ["KeyA", Input.Left],
            ["KeyD", Input.Right],
            ["Space", Input.Up],
            ["ShiftLeft", Input.Down],
        ]);

        document.addEventListener('keydown', e => this.OnKeyDown(e));
        document.addEventListener('keyup', e => this.OnKeyUp(e));
    }

    OnKeyDown(e: KeyboardEvent) {
        if ( !(this.inputMap.has(e.code) && this.inputs.has((this.inputMap.get(e.code) ?? 0))) ) return;
        this.inputs.set(this.inputMap.get(e.code) ?? 0, true);
    }

    OnKeyUp(e: KeyboardEvent) {
        if ( !(this.inputMap.has(e.code) && this.inputs.has((this.inputMap.get(e.code) ?? 0))) ) return;
        this.inputs.set(this.inputMap.get(e.code) ?? 0, false);
    }
}