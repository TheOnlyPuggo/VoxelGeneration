import {ACESFilmicToneMapping, Camera, EquirectangularReflectionMapping, Mesh, PerspectiveCamera, Scene, SRGBColorSpace, Timer, Vector3, WebGLRenderer, DirectionalLight, AmbientLight, CameraHelper, BasicShadowMap} from "three";
import {CameraControls} from './camera';
import {World} from './worldgen/world';
import {GroundedSkybox} from "three/examples/jsm/objects/GroundedSkybox.js";
import {HDRLoader} from "three/examples/jsm/loaders/HDRLoader.js";
import {CreateGUI} from "./UI";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import {Model} from "./geometry/modelCreation";
import {BlockPos} from "./positions/blockPos";
import {CubeMeshGrassBlock} from "./geometry/creation";

export const Game: {
    scene: Scene | null,
    camera: PerspectiveCamera | null,
    cameraControls: CameraControls | null,
    renderer: WebGLRenderer | null,
    directionalLight: DirectionalLight | null,
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
    directionalLight: null,
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
    

    // Game.renderer.toneMapping = ACESFilmicToneMapping;
    // Game.renderer.toneMappingExposure = 1.0;
    // Game.renderer.outputColorSpace = SRGBColorSpace;

    Game.renderer.shadowMap.enabled = false;

    Game.directionalLight = new DirectionalLight(0xfff9de, 1.5);
    Game.directionalLight.position.set(45, 120, 30);
    Game.directionalLight.target = Game.camera;
    Game.directionalLight.castShadow = true;
    Game.directionalLight.shadow.mapSize.width = 4096*0.25;
    Game.directionalLight.shadow.mapSize.height = 4096*.25;

    Game.directionalLight.shadow.camera.near = 0;
    Game.directionalLight.shadow.camera.far = 1000;
    Game.directionalLight.shadow.camera.left = -50;
    Game.directionalLight.shadow.camera.right = 50;
    Game.directionalLight.shadow.camera.top = 30;
    Game.directionalLight.shadow.camera.bottom = -30;
    Game.scene.add(Game.directionalLight);

    const ambientLight = new AmbientLight(0xc2d9ff, 0.8);
    Game.scene.add(ambientLight);

    const helper = new CameraHelper(Game.directionalLight.shadow.camera);
    Game.scene.add(helper);

    new HDRLoader().load(import.meta.env.BASE_URL + "skybox.hdr", (tex) => {
        tex.mapping = EquirectangularReflectionMapping;
        if (Game.scene) {
            Game.scene.background = tex;
            Game.scene.environment = tex;
            Game.scene.backgroundIntensity = 0.5;
            Game.scene.environmentIntensity = 0;
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

    if (Game.camera && Game.directionalLight) {
        Game.directionalLight.position.copy(Game.camera.position.clone().add(new Vector3(45, 120, 30)));
        Game.directionalLight.target = Game.camera;
    }

    if (Game.scene) Game.world?.Update(Game.camera, Game.scene);

    // #region AnimateGrass
    CubeMeshGrassBlock.grassMaterial.uniforms.uTime.value = Game.timer?.getElapsed();
    // #endregion

    Game.stats?.update();
    requestAnimationFrame(animate);
}

function onWindowResize(): void {
    Game.renderer?.setSize(window.innerWidth, window.innerHeight);
    Game.camera?.updateMatrix();
}