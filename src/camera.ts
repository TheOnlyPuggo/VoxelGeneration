import {Camera, HalfFloatType, Vector3} from "three";
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { World } from "./worldgen/world";
import { EPSILON } from "three/tsl";

export class CameraControls {
    camera: Camera;
    canvas: HTMLCanvasElement;
    isFlyingControls: boolean;
    world: World | null = null;
    pointerLockControls: PointerLockControls;
    inputWrapper: InputWrapper;

    private readonly height: number = 1.2;
    private readonly playerWidth: number = 0.4;
    private readonly jumpForce: number = 8;
    private readonly gravity: number = 25;

    private velocity: Vector3 = new Vector3();
    private isGrounded: boolean = false;
    private speed: number = 3;

    constructor(camera: Camera, canvas: HTMLCanvasElement, world: World, isFlyingControls: boolean = false) {
        this.camera = camera;
        this.canvas = canvas;
        this.world = world;
        this.isFlyingControls = isFlyingControls;

        this.pointerLockControls = new PointerLockControls(this.camera, this.canvas);
        document.addEventListener('click', () => this.pointerLockControls.lock());

        this.inputWrapper = new InputWrapper();
    }

    Update(delta: number) {
        (this.isFlyingControls) ? this.FlyingHandle(delta) : this.WalkingHandle(delta);
    }

    FlyingHandle(delta: number) {
        let direction = new Vector3();
        direction.set(
            Number(this.inputWrapper.inputs.get(Input.Right)) - Number(this.inputWrapper.inputs.get(Input.Left)),
            Number(this.inputWrapper.inputs.get(Input.Up)) - Number(this.inputWrapper.inputs.get(Input.Down)),
            Number(this.inputWrapper.inputs.get(Input.Backward)) - Number(this.inputWrapper.inputs.get(Input.Forward)),
        );

        direction.multiplyScalar(this.speed * 2);

        this.pointerLockControls.moveRight(direction.x * delta);
        this.camera.position.y += (direction.y * delta);
        this.pointerLockControls.moveForward(-direction.z * delta);
    }

    WalkingHandle(delta: number) {
        const front = new Vector3();
        this.camera.getWorldDirection(front);
        front.y = 0;
        front.normalize();

        const right = new Vector3();
        right.crossVectors(front, this.camera.up).normalize();

        const moveX = Number(this.inputWrapper.inputs.get(Input.Right)) - Number(this.inputWrapper.inputs.get(Input.Left));
        const moveZ = Number(this.inputWrapper.inputs.get(Input.Forward)) - Number(this.inputWrapper.inputs.get(Input.Backward));

        const dir = new Vector3();
        dir.addScaledVector(right, moveX);
        dir.addScaledVector(front, moveZ);
        dir.normalize().multiplyScalar(this.speed);

        this.velocity.x = dir.x;
        this.velocity.z = dir.z;

        if (this.inputWrapper.inputs.get(Input.Up) && this.isGrounded) {
            this.velocity.y = this.jumpForce;
        }

        this.MoveAndCollide(delta);
    }

    MoveAndCollide(delta: number) {
        const EPSILON = 0.001;
        const hw = this.playerWidth / 2;

        this.velocity.y -= this.gravity * delta;

        // X Axis
        this.camera.position.x += this.velocity.x * delta;
        if (this.CollidesWithWorld(this.camera.position)) {
            if (this.velocity.x > 0) {
                this.camera.position.x = Math.round(this.camera.position.x + hw) - 0.5 - hw - EPSILON;
            } else {
                this.camera.position.x = Math.round(this.camera.position.x - hw) + 0.5 + hw + EPSILON;
            }
            this.velocity.x = 0;
        }

        // Y Axis
        this.camera.position.y += this.velocity.y * delta;
        if (this.CollidesWithWorld(this.camera.position)) {
            if (this.velocity.y <= 0) {
                const feetY = this.camera.position.y - this.height;
                this.camera.position.y = Math.floor(feetY) + 1 + this.height + EPSILON;
                this.isGrounded = true;
            } else {
                console.log("Collided with ceiling");
                this.camera.position.y = Math.floor(this.camera.position.y) - EPSILON;
            }
            this.velocity.y = 0;
        } else {
            this.isGrounded = false;
        }

        // Z Axis
        this.camera.position.z += this.velocity.z * delta;
        if (this.CollidesWithWorld(this.camera.position)) {
            if (this.velocity.z > 0) {
                this.camera.position.z = Math.round(this.camera.position.z + hw) - 0.5 - hw - EPSILON;
            } else {
                this.camera.position.z = Math.round(this.camera.position.z - hw) + 0.5 + hw + EPSILON;
            }
            this.velocity.z = 0;
        }
    }

    CollidesWithWorld(position: Vector3): boolean {
        const hw = this.playerWidth / 2;
        const { x, y, z } = position;

        for (let dy = this.height/2; dy >= -this.height; dy -= this.height / 2) {
            for (const dx of [-hw, hw]) {
                for (const dz of [-hw, hw]) {
                    if (this.IsSolid(x + dx, y + dy, z + dz)) return true;
                }
            }
        }
        return false;
    }

    IsSolid(x: number, y: number, z: number): boolean {
        return this.world ? !this.world.getTransparentAt(Math.round(x), Math.floor(y), Math.round(z)) : false;
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