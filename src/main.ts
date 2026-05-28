import {ACESFilmicToneMapping, Camera, EquirectangularReflectionMapping, Mesh, PerspectiveCamera, Scene, SRGBColorSpace, Timer, Vector3, WebGLRenderer} from "three";
import {CameraControls} from './camera';
import {World} from './worldgen/world';
import {GroundedSkybox} from "three/examples/jsm/objects/GroundedSkybox.js";
import {HDRLoader} from "three/examples/jsm/loaders/HDRLoader.js";
import {CreateGUI} from "./UI";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import {Model} from "./geometry/modelCreation";
import {BlockPos} from "./positions/blockPos";

export const Game: {
    scene: Scene | null,
    camera: PerspectiveCamera | null,
    cameraControls: CameraControls | null,
    renderer: WebGLRenderer | null,
    environment: {
        skybox: GroundedSkybox | null,
    },
    timer: Timer | null,
    world: World | null,
    
    instantiatedMeshes: Mesh[] | null,
    currentFrame: number | null,
    stats: Stats | null;
} = {
    scene: null,
    camera: null,
    cameraControls: null,
    renderer: null,
    environment: {
        skybox: null,
    },
    timer: null,
    world: null,

    instantiatedMeshes: null,
    currentFrame: null,
    stats: null,
};

init();
animate(0.0);

async function init(): Promise<void> {
    // Setup
    Game.scene = new Scene();

    Game.renderer = new WebGLRenderer({precision: "highp"});
    Game.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(Game.renderer.domElement);

    // World Creation
    Game.world = new World();

    // Game Camera stuff
    Game.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    Game.camera.position.x = 7.0;
    Game.camera.position.z = 7.0;
    Game.camera.position.y = Game.world.getHeightAt(Game.camera.position.x, Game.camera.position.z) + 5;
    Game.camera.rotateY(-Math.PI * 0.75);
    Game.camera.rotateX(-Math.PI / 4.0); Game.renderer.domElement


    Game.cameraControls = new CameraControls(Game.camera, Game.renderer.domElement, Game.world, false);

    
    
    Game.stats = new Stats();
    document.body.appendChild(Game.stats.dom);

    // Timer
    Game.timer = new Timer();
    Game.currentFrame = 0;
    

    Game.renderer.toneMapping = ACESFilmicToneMapping;
    Game.renderer.toneMappingExposure = 1.0;
    Game.renderer.outputColorSpace = SRGBColorSpace;

    new HDRLoader().load(import.meta.env.BASE_URL + "skybox.hdr", (tex) => {
        tex.mapping = EquirectangularReflectionMapping;
        if (Game.scene) {
            Game.scene.background = tex;
            Game.scene.environment = tex;
            Game.scene.backgroundIntensity = 0.5;
            Game.scene.environmentIntensity = 0.5;
        }
    });

    // GUI
    CreateGUI(Game);

    window.addEventListener("resize", onWindowResize, false);
}

function animate(time: number): void {
    Game.timer?.update(time);
    Game.currentFrame = (Game.currentFrame ?? 0) + 1;

    if (Game.renderer != null && Game.scene != null && Game.camera != null)
        Game.renderer?.render(Game.scene, Game.camera);


    Game.cameraControls?.Update(Game.timer?.getDelta() ?? 0, Game.scene);
    Game.environment.skybox?.position.copy(Game.camera?.position as Vector3);

    if (Game.scene) Game.world?.Update(Game.camera, Game.scene);

    Game.stats?.update();
    requestAnimationFrame(animate);
}

function onWindowResize(): void {
    Game.renderer?.setSize(window.innerWidth, window.innerHeight);
    Game.camera?.updateMatrix();
}