import {ACESFilmicToneMapping, Camera, EquirectangularReflectionMapping, Mesh, PerspectiveCamera, Scene, SRGBColorSpace, Timer, Vector3, WebGLRenderer, DirectionalLight, Color, AmbientLight, CameraHelper, BasicShadowMap, Fog} from "three";
import {CameraControls} from './camera';
import {World} from './worldgen/world';
import {GroundedSkybox} from "three/examples/jsm/objects/GroundedSkybox.js";
import {HDRLoader} from "three/examples/jsm/loaders/HDRLoader.js";
import {CreateGUI} from "./UI";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import {Model} from "./geometry/modelCreation";
import {BlockPos} from "./positions/blockPos";
import {CubeMeshGrassBlock, CubeMeshWaterBlock, CubeMeshSandBlock} from "./geometry/creation";
import {WorldWrapper} from "./worldgen/worldWrapper";


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
    worldWrapper: WorldWrapper | null,
    
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
    worldWrapper: null,

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
    Game.worldWrapper = new WorldWrapper();

    // Game Camera stuff
    Game.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    Game.camera.rotateY(-Math.PI * 0.75);
    Game.camera.rotateX(-Math.PI / 4.0);


    Game.cameraControls = new CameraControls(Game.camera, Game.renderer.domElement, Game.worldWrapper, false);

    Game.worldWrapper.resetCamera(Game.cameraControls);
    
    Game.stats = new Stats();
    document.body.appendChild(Game.stats.dom);

    // Timer
    Game.timer = new Timer();
    Game.currentFrame = 0;
    

    // Game.renderer.toneMapping = ACESFilmicToneMapping;
    // Game.renderer.toneMappingExposure = 1.0;
    // Game.renderer.outputColorSpace = SRGBColorSpace;

    Game.renderer.shadowMap.enabled = true;

    Game.directionalLight = new DirectionalLight(0xfff9de, 2);
    Game.directionalLight.castShadow = true;
    Game.directionalLight.shadow.mapSize.width = 8192*2;
    Game.directionalLight.shadow.mapSize.height = 8192*2;

    Game.directionalLight.shadow.camera.near = 0;
    Game.directionalLight.shadow.camera.far = 1000;
    Game.directionalLight.shadow.camera.left = -100;
    Game.directionalLight.shadow.camera.right = 100;
    Game.directionalLight.shadow.camera.top = 60;
    Game.directionalLight.shadow.camera.bottom = -60;

    Game.directionalLight.shadow.normalBias = -0.001;
    //Game.directionalLight.shadow.bias = 0.01;

    Game.scene.add(Game.directionalLight);
    Game.scene.add(Game.directionalLight.target);

    Game.scene.fog = new Fog(0x6a7b8b, (Game.worldWrapper.getWorld().worldRadius-1)*16, (Game.worldWrapper.getWorld().worldRadius)*16);

    //const ambientLight = new AmbientLight(0xc2d9ff, 0.8);
    //Game.scene.add(ambientLight);

    // const helper = new CameraHelper(Game.directionalLight.shadow.camera);
    // Game.scene.add(helper);

    new HDRLoader().load(import.meta.env.BASE_URL + "skybox.hdr", (tex) => {
        tex.mapping = EquirectangularReflectionMapping;
        if (Game.scene) {
            // Game.scene.background = new Color(0x97b4d2);
            Game.scene.background = tex;
            Game.scene.backgroundIntensity = 1;
            // Game.scene.backgroundBlurriness = 0.2;

            Game.scene.environment = tex;
            
            Game.scene.environmentIntensity = 0.2;
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
        const SUN_OFFSET = new Vector3(50, 50, 40);
        Game.directionalLight.position.copy(Game.camera.position.clone().add(SUN_OFFSET));
        Game.directionalLight.target.position.copy(Game.camera.position.clone());
    }

    if (Game.scene) Game.worldWrapper?.getWorld().Update(Game.camera, Game.scene);

    // #region AnimateGrass
    CubeMeshGrassBlock.grassMaterial.uniforms.uTime.value = Game.timer?.getElapsed();
    CubeMeshGrassBlock.grassMaterial.uniforms.uPlayerFeetPos.value = Game.cameraControls?.getPlayerFeetPos();

    CubeMeshSandBlock.grassMaterial.uniforms.uTime.value = Game.timer?.getElapsed();
    CubeMeshSandBlock.grassMaterial.uniforms.uPlayerFeetPos.value = Game.cameraControls?.getPlayerFeetPos();
    // #endregion

    // #region AnimateWater
    CubeMeshWaterBlock.waterTopMaterial.uniforms.uTime.value = Game.timer?.getElapsed();
    CubeMeshWaterBlock.waterTopMaterial.uniforms.uCameraPos.value.copy(Game.camera?.position);
    CubeMeshWaterBlock.waterTopMaterial.uniforms.uLightDir.value.copy(Game.directionalLight?.position).normalize();
    // #endregion

    Game.stats?.update();
    requestAnimationFrame(animate);
}

function onWindowResize(): void {
    Game.renderer?.setSize(window.innerWidth, window.innerHeight);
    if (Game.camera) {
        Game.camera.aspect = window.innerWidth / window.innerHeight;
        Game.camera.updateMatrix();
    }
}