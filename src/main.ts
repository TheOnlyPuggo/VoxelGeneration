import {AmbientLight, Box3, BoxGeometry, Camera, Frustum, Matrix4, Mesh, MeshBasicMaterial, PerspectiveCamera, Raycaster, Scene, Timer, Vector3, WebGLRenderer} from "three";
import {CameraControls} from './camera';
import {World} from './worldgen/world';
import {GroundedSkybox} from "three/examples/jsm/objects/GroundedSkybox.js";
import {HDRLoader} from "three/examples/jsm/loaders/HDRLoader.js";
import {CreateGUI} from "./UI";
import {Chunk, chunkSize} from "./worldgen/chunk";
import Stats from 'three/examples/jsm/libs/stats.module.js';

export const Game: {
    scene: Scene | null,
    camera: Camera | null,
    cameraControls: CameraControls | null,
    renderer: WebGLRenderer | null,
    environment: {
        skybox: GroundedSkybox | null,
    },
    timer: Timer | null,

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

    instantiatedMeshes: null,
    currentFrame: null,
    stats: null,
};

init();
animate(0.0);

function init(): void {
    // Setup
    Game.scene = new Scene();

    Game.renderer = new WebGLRenderer({precision: "highp"});
    Game.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(Game.renderer.domElement);

    // Game Camera stuff
    Game.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    Game.cameraControls = new CameraControls(Game.camera, Game.renderer.domElement, 10.0, true);

    Game.camera.position.x = 1.0;
    Game.camera.position.z = 1.0;
    Game.camera.position.y = 1.0;
    Game.camera.rotateY(Math.PI / 4.0)
    Game.camera.rotateX(-Math.PI / 4.0); Game.renderer.domElement
    
    Game.stats = new Stats();
    document.body.appendChild(Game.stats.dom);

    // Timer
    Game.timer = new Timer();

    Game.currentFrame = 0;


    // Temp Cube Creation Example
    // let testBlock: CuboidMesh = new CuboidMeshOneColor(1, 1, 1, 1.0, new Color(0xff0000), false);
    // let testBlockMesh = testBlock.Mesh({px: 0, nx: 0, py: 0, ny: 0, pz: 0, nz: 0});
    // Game.scene.add(testBlockMesh ?? new Mesh());

    // let dirtBlock: CuboidMesh = new CuboidMeshOneTexture(1, 1, 1, 1.0, "one_texture/dirt.png");
    // let dirtBlockMesh = dirtBlock.Mesh({px: 0, nx: 0, py: 0, ny: 0, pz: 0, nz: 0});
    // Game.scene.add(dirtBlockMesh ?? new Mesh());

    // let grassBlockMesh: CuboidMesh = new CuboidMeshMultiTexture(1, 1, 1, 1.0,
    //     "grass_textures/grass_top.png",
    //     "grass_textures/grass_bottom.png",
    //     "grass_textures/grass_side.png"
    // );

    // Game.scene.add( grassBlockMesh.Mesh({px: 1, nx: 0, py: 0, ny: 0, pz: 0, nz: 0}) ?? new Mesh() );

    // World Creation
    let world: World = new World();
    let meshes: Mesh[] = world.getMeshes();
    Game.instantiatedMeshes = [];
    for (let i = 0; i < meshes.length; i++) {
        Game.instantiatedMeshes?.push(meshes[i]);
        Game.scene.add( meshes[i] );


        //Test Box
        let meshCubeOutline = new Mesh(new BoxGeometry(chunkSize, chunkSize, chunkSize), new MeshBasicMaterial({color: 0xffff00, wireframe: true}));
        meshCubeOutline.position.copy(meshes[i].position);
        meshCubeOutline.position.add(new Vector3(chunkSize / 2.0 - 0.5, chunkSize / 2.0 - 0.5, chunkSize / 2.0 - 0.5));
        Game.scene.add(meshCubeOutline);

        let originMesh = new Mesh(new BoxGeometry(0.1, 0.1, 0.1), new MeshBasicMaterial({color: 0xff0000}));
        originMesh.position.copy(meshes[i].position);
        Game.scene.add(originMesh);
    }

    //#region Skybox Dynamic - Currently very laggy dont use until we get occlussion culling
    // Game.renderer.toneMapping = ACESFilmicToneMapping;
    // Game.renderer.toneMappingExposure = 1.0;
    // Game.renderer.outputColorSpace = SRGBColorSpace;

    // new HDRLoader().load(import.meta.env.BASE_URL + "skybox.hdr", (tex) => {
    //     tex.mapping = EquirectangularReflectionMapping;
    //     if (Game.scene) {
    //         Game.scene.background = tex;
    //         Game.scene.environment = tex;
    //         Game.scene.backgroundIntensity = 0.5;
    //         Game.scene.environmentIntensity = 0.5;
    //     }
    // });

    //#region No lighting Skybox
    let ambientLight = new AmbientLight(0x404040, 10.0);
    Game.scene.add(ambientLight);
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
    Game.currentFrame = (Game.currentFrame ?? 0) + 1;

    if (Game.renderer != null && Game.scene != null && Game.camera != null)
        Game.renderer?.render(Game.scene, Game.camera);


    Game.cameraControls?.Update(Game.timer?.getDelta() ?? 0);
    Game.environment.skybox?.position.copy(Game.camera?.position as Vector3);

    //#region Occlusion Culling Test
    let len = Game.instantiatedMeshes?.length ?? 0;

    const frustum = new Frustum();
    const matrix = new Matrix4();
    
    if (Game.camera?.projectionMatrix != null) {
        matrix.multiplyMatrices(Game.camera?.projectionMatrix, Game.camera?.matrixWorldInverse);
        frustum.setFromProjectionMatrix(matrix);
    }


    if (Game.instantiatedMeshes != null) {

        let chunksPerFrame = 3;
        for (let i = (Game.currentFrame*chunksPerFrame) % len; i < (Game.currentFrame*chunksPerFrame + chunksPerFrame) % len; i++) {
        //for (let i = 0; i < len; i++) {

            

            


            
            let isVisible = false;
            


            let mesh = Game.instantiatedMeshes[i];

            let box = new Box3().setFromObject(mesh);
            if (!frustum.intersectsBox(box)) {
                continue;
            }

            let points = [];

            points.push(mesh.position.clone().add(new Vector3(0, 0, 0)));
            points.push(mesh.position.clone().add(new Vector3(chunkSize, 0, 0)));
            points.push(mesh.position.clone().add(new Vector3(0, chunkSize, 0)));
            points.push(mesh.position.clone().add(new Vector3(0, 0, chunkSize)));
            points.push(mesh.position.clone().add(new Vector3(chunkSize, chunkSize, 0)));
            points.push(mesh.position.clone().add(new Vector3(chunkSize, 0, chunkSize)));
            points.push(mesh.position.clone().add(new Vector3(0, chunkSize, chunkSize)));
            points.push(mesh.position.clone().add(new Vector3(chunkSize, chunkSize, chunkSize)));

            let raycaster = new Raycaster();
            let cameraPos = Game.camera?.position as Vector3;
            let occluderMeshes = Game.instantiatedMeshes.filter(m => m !== mesh);

            
            

            for (let point of points) {
                let rayDir = new Vector3().subVectors(point, cameraPos).normalize();
                raycaster.set(cameraPos, rayDir);

                let intersects = raycaster.intersectObjects(occluderMeshes, false);
                
                if (intersects.length === 0) {
                    // Nothing blocking
                    isVisible = true;
                    break;
                }

                let hit = intersects[0];
                let distanceToPoint = cameraPos.distanceTo(point);
                if (!hit || hit.distance > distanceToPoint) {
                    isVisible = true;
                    break;
                }
            }   

            //console.log(isVisible);
            
            Game.instantiatedMeshes[i].visible = isVisible;

            /*
            if (Game.instantiatedMeshes[i].position.distanceTo(Game.camera?.position as Vector3) < 20) {
                Game.instantiatedMeshes[i].visible = true;
            } else {
                Game.instantiatedMeshes[i].visible = false;
            }
                */
        }
    }
    //#endregion

    Game.stats?.update();
    requestAnimationFrame(animate)
};

function onWindowResize(): void {
    Game.renderer?.setSize(window.innerWidth, window.innerHeight);
    Game.camera?.updateMatrix();
}