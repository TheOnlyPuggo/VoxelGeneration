import {Vector3, MathUtils, PerspectiveCamera, Scene} from "three";
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls.js';
import {World} from "./worldgen/world";
import {BlockPos} from "./positions/blockPos";
import {Vec3} from "./positions/vec3";
import * as Blocks from "./worldgen/blocks";
import {Block} from "./worldgen/block";

enum PlayerState {
    Normal,
    Crouching,
    Sprinting,
}

export class CameraControls {
    camera: PerspectiveCamera;
    canvas: HTMLCanvasElement;
    isFlyingControls: boolean;
    world: World | null = null;
    pointerLockControls: PointerLockControls;
    inputWrapper: InputWrapper;
    public playerPos: Vector3 = new Vector3();

    public playerHeight: number = 1.8;
    private playerHeightLerpSpeed: number = 10;
    private readonly playerStandingHeight: number = 1.8;
    private readonly playerCrouchingHeight: number = 1.45;
    private readonly eyeOffset: number = 0.05; //To ensure the camera is not at the very top of the player's head so we don't clip into blocks
    private readonly playerWidth: number = 0.4;
    private readonly jumpForce: number = 8;
    private readonly gravity: number = 25;

    private velocity: Vector3 = new Vector3();
    private isGrounded: boolean = false;

    private speed: number = 4.317;
    private walkSpeed: number = 4.317;
    private sprintSpeed: number = 5.612;
    private crouchSpeed: number = 1.3;
    private moveLerpSpeed: number = 10;

    private headBobOffset: number = 0;
    private headSwayOffset: number = 0;
    private headBobFrequency: number = 12;
    private headBobFrequencyMultiplier: number = 1;
    private headBobAmplitude: number = 0.09;
    private headBobLerpSpeed: number = 10;

    private playerState: PlayerState = PlayerState.Normal; 
    private cameraLerpSpeed: number = 10;

    private lastDestroyedBlock: Block;

    constructor(camera: PerspectiveCamera, canvas: HTMLCanvasElement, world: World, isFlyingControls: boolean = false) {
        this.camera = camera;
        this.canvas = canvas;
        this.world = world;
        this.isFlyingControls = isFlyingControls;

        this.playerPos = this.camera.position.clone();

        this.pointerLockControls = new PointerLockControls(this.camera, this.canvas);
        document.addEventListener('click', () => this.pointerLockControls.lock());

        this.inputWrapper = new InputWrapper();

        this.lastDestroyedBlock = Blocks.DIRT;
    }
    
    
    Update(delta: number, scene: Scene | null) {
        this.blockInteractionHandle(delta, scene);

        (this.isFlyingControls) ? this.FlyingHandle(delta) : this.WalkingHandle(delta);


        this.inputWrapper.ClearPressed();
    }
    
    public getPlayerFeetPos(): Vector3 {
        return this.playerPos.clone().add(new Vector3(0, -this.playerHeight, 0));
    }

    private blockInteractionHandle(delta: number, scene: Scene | null): void {
        if (this.inputWrapper.IsPressed(Input.Destroy)) {
            const front = new Vector3();
            this.camera.getWorldDirection(front);
            const raycast: BlockPos[] | undefined = this.world?.raycastForBlock(Vec3.fromVector3(this.camera.position), Vec3.fromVector3(front), 5,
                (block: Block): boolean => block.getVisible());
            if (raycast) {
                if (this.world) this.lastDestroyedBlock = this.world.getBlockAt(raycast[raycast.length - 1]);
                this.world?.setBlockAt(raycast[raycast.length - 1], Blocks.AIR, scene);
            }
        }
        if (this.inputWrapper.IsPressed(Input.Place)) {
            const front = new Vector3();
            this.camera.getWorldDirection(front);
            const raycast: BlockPos[] | undefined = this.world?.raycastForBlock(Vec3.fromVector3(this.camera.position), Vec3.fromVector3(front), 5,
                (block: Block): boolean => block.getVisible());
            if (raycast && raycast.length > 2) {
                const newBlockPos = raycast[raycast.length - 2];
                if (!this.collidesWithBlockPos(newBlockPos)) this.world?.setBlockAt(newBlockPos, this.lastDestroyedBlock, scene)
            }
        }
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

        this.playerPos = this.camera.position.clone();
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

        this.velocity.x = MathUtils.lerp(this.velocity.x, dir.x, 1 - Math.exp(-this.moveLerpSpeed * delta));
        this.velocity.z = MathUtils.lerp(this.velocity.z, dir.z, 1 - Math.exp(-this.moveLerpSpeed * delta));

        if (this.inputWrapper.inputs.get(Input.Up) && this.isGrounded) {
            this.velocity.y = this.jumpForce;
        }
        
        this.PlayerStateHandle(delta, dir);
        this.CrouchingHeight(delta);
        this.MoveAndCollide(delta);
        this.HeadBob(delta, dir);
    }

    CrouchingHeight(delta: number) {
        var previousHeight = this.playerHeight;

        var targetHeight = this.playerState === PlayerState.Crouching ? this.playerCrouchingHeight : this.playerStandingHeight;
        this.playerHeight = MathUtils.lerp(this.playerHeight, targetHeight, 1 - Math.exp(-this.playerHeightLerpSpeed * delta));

        var heightDifference = this.playerHeight - previousHeight;
        if (heightDifference > 0) {
            this.playerPos.y += heightDifference; // Move the player up when standing up to prevent sinking into the ground
        }
    }
    

    PlayerStateHandle(delta: number, dir: Vector3) {
        var targetCamFOV = 90;

        switch(this.playerState) {
            case PlayerState.Normal:
                this.speed = this.walkSpeed;
                this.headBobFrequencyMultiplier = 1;
                
                if (this.inputWrapper.IsPressed(Input.Sprint)) this.playerState = PlayerState.Sprinting;
                if (this.inputWrapper.IsHeld(Input.Down)) this.playerState = PlayerState.Crouching;
                break;
            case PlayerState.Crouching:
                this.speed = this.crouchSpeed;
                this.headBobFrequencyMultiplier = 0.75;

                targetCamFOV = 85;

                if (!this.inputWrapper.IsHeld(Input.Down)) this.playerState = PlayerState.Normal;
                break;
            case PlayerState.Sprinting:
                this.speed = this.sprintSpeed;
                this.headBobFrequencyMultiplier = 2;

                targetCamFOV = 105;

                if (this.inputWrapper.IsPressed(Input.Sprint) || (dir.x == 0 && dir.z == 0)) this.playerState = PlayerState.Normal;
                if (this.inputWrapper.IsHeld(Input.Down)) this.playerState = PlayerState.Crouching;
                break;
        }
        
        this.camera.fov = MathUtils.lerp(this.camera.fov, targetCamFOV, 1 - Math.exp(-this.cameraLerpSpeed * delta));
        this.camera.updateProjectionMatrix();
    }

    HeadBob(delta: number, dir: Vector3) {
        if (dir.x != 0 || dir.z != 0) {
            this.headBobOffset = MathUtils.lerp(this.headBobOffset, Math.sin(Date.now() * 0.001 * this.headBobFrequency * this.headBobFrequencyMultiplier) * this.headBobAmplitude, 1 - Math.exp(-this.headBobLerpSpeed * delta));
            this.headSwayOffset = MathUtils.lerp(this.headSwayOffset, Math.cos(Date.now() * 0.001 * this.headBobFrequency * 0.5 * this.headBobFrequencyMultiplier) * this.headBobAmplitude * 1, 1 - Math.exp(-this.headBobLerpSpeed * delta));
        } else {
            this.headBobOffset = MathUtils.lerp(this.headBobOffset, 0, 1 - Math.exp(-this.headBobLerpSpeed * delta));
            this.headSwayOffset = MathUtils.lerp(this.headSwayOffset, 0, 1 - Math.exp(-this.headBobLerpSpeed * delta));
        }

        this.camera.position.copy(this.playerPos);
        this.camera.position.y -= this.eyeOffset;
        this.camera.position.y += this.headBobOffset;

        // Apply head swayoffset as sidways according to the camera
        const swayRight = new Vector3();
        this.camera.getWorldDirection(swayRight);
        swayRight.cross(this.camera.up).normalize();
        swayRight.multiplyScalar(this.headSwayOffset);
        this.camera.position.add(swayRight);
    }

    MoveAndCollide(delta: number) {
        this.velocity.y -= this.gravity * delta;
        
        let safeStepSize = 0.4;
        let speed = this.velocity.length();
        let steps = Math.max(1, Math.ceil(speed * delta / safeStepSize));
        let subDelta = delta/steps;

        let groundedThisFrame = false;
        for(let i = 0; i < steps; ++i) {
            if (this.CollisionStep(subDelta)) groundedThisFrame = true;
        }
        this.isGrounded = groundedThisFrame;
    }

    CollisionStep(delta: number): boolean {
        const EPSILON = 0.001;
        const hw = this.playerWidth / 2;
        const hh = this.playerHeight / 2;
        let grounded = false;

        // X Axis
        this.playerPos.x += this.velocity.x * delta;
        if (this.CollidesWithWorld(this.playerPos)) {
            if (this.velocity.x > 0) {
                this.playerPos.x = Math.round(this.playerPos.x + hw) - 0.5 - hw - EPSILON;
            } else {
                this.playerPos.x = Math.round(this.playerPos.x - hw) + 0.5 + hw + EPSILON;
            }
            this.velocity.x = 0;
        }

        // Y Axis
        this.playerPos.y += this.velocity.y * delta;
        if (this.CollidesWithWorld(this.playerPos)) {
            if (this.velocity.y > 0) {
                this.playerPos.y = Math.round(this.playerPos.y) - 0.5 - EPSILON;
            } else {
                grounded = true;
                const feetY = this.playerPos.y - this.playerHeight;
                this.playerPos.y = Math.round(feetY) + 0.5 + EPSILON + this.playerHeight;
            }
            this.velocity.y = 0;
        }

        // Z Axis
        this.playerPos.z += this.velocity.z * delta;
        if (this.CollidesWithWorld(this.playerPos)) {
            if (this.velocity.z > 0) {
                this.playerPos.z = Math.round(this.playerPos.z + hw) - 0.5 - hw - EPSILON;
            } else {
                this.playerPos.z = Math.round(this.playerPos.z - hw) + 0.5 + hw + EPSILON;
            }
            this.velocity.z = 0;
        }

        return grounded;
    }

    CollidesWithWorld(position: Vector3): boolean {
        const hw = this.playerWidth / 2;
        const { x, y, z } = position;
        var numRan = 0;
        for (let dy = 0; dy >= -this.playerHeight; dy -= this.playerHeight / 2) {
            for (const dx of [-hw, hw]) {
                for (const dz of [-hw, hw]) {
                    if (this.IsSolid(x + dx, y + dy, z + dz)) return true;
                }
            }
        }
        return false;
    }

    private collidesWithBlockPos(blockPos: BlockPos): boolean {
        return blockPos.x >= Math.round(this.playerPos.x - this.playerWidth / 2) && blockPos.x <= Math.round(this.playerPos.x + this.playerWidth / 2) &&
            blockPos.y >= Math.round(this.playerPos.y - this.playerHeight) && blockPos.x <= Math.round(this.playerPos.y) &&
            blockPos.z >= Math.round(this.playerPos.z - this.playerWidth / 2) && blockPos.z <= Math.round(this.playerPos.z + this.playerWidth / 2);
    }

    IsSolid(x: number, y: number, z: number): boolean {
        return this.world ? this.world.getBlockAt(BlockPos.roundFromVec3(new Vec3(x, y, z))).getSolid() : false;
    }
}

enum Input {
    Forward,
    Backward,
    Left,
    Right,
    Up,
    Down,
    Sprint,
    Destroy,
    Place
}

export class InputWrapper {
    inputs;
    justPressed: Set<Input>;
    inputMap: Map<string, Input>;

    constructor() {
        this.inputs = new Map<Input, boolean>([
            [Input.Forward, false],
            [Input.Backward, false],
            [Input.Left, false],
            [Input.Right, false],
            [Input.Up, false],
            [Input.Down, false],    
            [Input.Sprint, false],
            [Input.Destroy, false],
            [Input.Place, false]
        ]);

        this.justPressed = new Set<Input>();

        this.inputMap = new Map<string, Input>([
            ["KeyW", Input.Forward],
            ["KeyS", Input.Backward],
            ["KeyA", Input.Left],
            ["KeyD", Input.Right],
            ["Space", Input.Up],
            ["KeyC", Input.Down],
            ["ShiftLeft", Input.Sprint],
            ["KeyQ", Input.Destroy],
            ["KeyE", Input.Place]
        ]);

        document.addEventListener('keydown', e => this.OnKeyDown(e));
        document.addEventListener('keyup', e => this.OnKeyUp(e));
    }

    OnKeyDown(e: KeyboardEvent) {
        const input = this.inputMap.get(e.code);
        if (input === undefined || !this.inputs.has(input)) return;

        if (!e.repeat && !this.inputs.get(input)) {
            this.justPressed.add(input);
        }

        this.inputs.set(input, true);
    }

    OnKeyUp(e: KeyboardEvent) {
        const input = this.inputMap.get(e.code);
        if (input === undefined || !this.inputs.has(input)) return;
        this.inputs.set(input, false);
    }

    IsHeld(input: Input): boolean {
        return this.inputs.get(input) ?? false;
    }

    IsPressed(input: Input): boolean {
        return this.justPressed.has(input);
    }
    
    ClearPressed() {
        this.justPressed.clear();
    }
}