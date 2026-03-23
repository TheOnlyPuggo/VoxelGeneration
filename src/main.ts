import * as THREE from 'three';
import { CuboidMesh, CuboidMeshOneColor, CuboidMeshMultiTexture, CuboidMeshOneTexture } from './creation';
import { CameraControls } from './camera';
import { World } from './worldgen/world';
import { GroundedSkybox } from "three/examples/jsm/objects/GroundedSkybox.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import {CreateGUI} from "./UI";

export const Game: {
    scene: THREE.Scene | null,
    camera: THREE.Camera | null,
    cameraControls: CameraControls | null,
    renderer: THREE.WebGLRenderer | null,
    environment: {
        skybox: GroundedSkybox | null,
    },
    timer: THREE.Timer | null,
} = {
    scene: null,
    camera: null,
    cameraControls: null,
    renderer: null,
    environment: {
        skybox: null,
    },
    timer: null,
};

init();
animate(0.0);

function init(): void {
    // Setup
    Game.scene = new THREE.Scene();

    Game.renderer = new THREE.WebGLRenderer();
    Game.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(Game.renderer.domElement);

    // Game Camera stuff
    Game.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    Game.cameraControls = new CameraControls(Game.camera, Game.renderer.domElement, 10.0, true);

    Game.camera.position.x = 1.0;
    Game.camera.position.z = 1.0;
    Game.camera.position.y = 1.0;
    Game.camera.rotateY(Math.PI / 4.0)
    Game.camera.rotateX(-Math.PI / 4.0); Game.renderer.domElement

    // Timer
    Game.timer = new THREE.Timer();

    // Temp Cube Creation Example
    // let dirtBlockMesh: CuboidMesh = new CuboidMeshOneTexture(1, 1, 1, 1.0, "dirt.png");
    // Game.scene.add(dirtBlockMesh.Mesh() ?? new THREE.Mesh());

    // let grassBlockMesh: CuboidMesh = new CuboidMeshMultiTexture(1, 1, 1, 1.0,
    //     "grass_textures/grass_top.png",
    //     "grass_textures/grass_bottom.png",
    //     "grass_textures/grass_side.png",
    //     {
    //         px: 0,
    //         nx: 0,
    //         py: 0,
    //         ny: 0,
    //         pz: 0,
    //         nz: 0
    //     },
    // );

    // Game.scene.add( grassBlockMesh.Mesh() ?? new THREE.Mesh() );

    // World Creation
    let world: World = new World();
    let meshes: THREE.Mesh[][] = world.getMeshes();
    for (let i = 0; i < meshes.length; i++) {
        for (let j = 0; j < meshes[i].length; ++j) {
            Game.scene.add( meshes[i][j] );
        }
    }

    // Light
    let ambientLight = new THREE.AmbientLight(0x404040, 10.0);
    Game.scene.add(ambientLight);

    //#region Skybox
    let skyboxTexture = new HDRLoader().load(import.meta.env.BASE_URL + "skybox.hdr");
    Game.environment.skybox = new GroundedSkybox(skyboxTexture, 100, 1000);

    let skyboxBrightness = 0.7;
    Game.environment.skybox.material.color.setRGB(skyboxBrightness, skyboxBrightness, skyboxBrightness);
    Game.scene.add(Game.environment.skybox);
    //#endregion

    // GUI
    CreateGUI(Game);

    window.addEventListener("resize", onWindowResize, false);
}

function animate(time: number): void {
    Game.timer?.update(time);

    if (Game.renderer != null && Game.scene != null && Game.camera != null)
        Game.renderer?.render(Game.scene, Game.camera);


    Game.cameraControls?.Update(Game.timer?.getDelta() ?? 0);
    Game.environment.skybox?.position.copy(Game.camera?.position as THREE.Vector3);

    requestAnimationFrame(animate)
};

function onWindowResize(): void {
    Game.renderer?.setSize(window.innerWidth, window.innerHeight);
    Game.camera?.updateMatrix();
}