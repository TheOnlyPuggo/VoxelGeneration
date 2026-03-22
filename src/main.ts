import * as THREE from 'three';
import { CuboidMesh, CuboidMeshMultiTexture } from './creation';
import { CameraControls } from './camera';

const Game: {
    scene: THREE.Scene | null,
    camera: THREE.Camera | null,
    cameraControls: CameraControls | null,
    renderer: THREE.WebGLRenderer | null,
} = {
    scene: null,
    camera: null,
    cameraControls: null,
    renderer: null,
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


    // Temp Cube Creation Example
    let grassBlockMesh: CuboidMesh = new CuboidMeshMultiTexture(1, 1, 1, 
        "grass_textures/grass_top.png",
        "grass_textures/grass_bottom.png",
        "grass_textures/grass_side.png"
    );
    Game.scene.add( grassBlockMesh.Mesh() );

    // Light
    let ambientLight = new THREE.AmbientLight(0x404040, 10.0);
    Game.scene.add(ambientLight);

    window.addEventListener("resize", onWindowResize, false);
}

function animate(time: number): void {
    if (Game.renderer != null && Game.scene != null && Game.camera != null)
        Game.renderer?.render(Game.scene, Game.camera);

    Game.cameraControls?.Update();

    requestAnimationFrame(animate)
};

function onWindowResize(): void {
    Game.renderer?.setSize(window.innerWidth, window.innerHeight);
    Game.camera?.updateMatrix();
}