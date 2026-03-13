import * as THREE from 'three';

const Game: {
    scene: THREE.Scene | null,
    camera: THREE.Camera | null,
    renderer: THREE.WebGLRenderer | null,
} = {
    scene: null,
    camera: null,
    renderer: null,
};

init();
animate(0.0);

function init(): void {
    Game.scene = new THREE.Scene();
    Game.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);

    Game.renderer = new THREE.WebGLRenderer();
    Game.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(Game.renderer.domElement);

    Game.camera.position.z = 5.0;

    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    const cube = new THREE.Mesh( geometry, material );
    Game.scene.add( cube );

    window.addEventListener("resize", onWindowResize, false);
}

function animate(time: number): void {

    if (Game.renderer != null && Game.scene != null && Game.camera != null)
        Game.renderer?.render(Game.scene, Game.camera);

    requestAnimationFrame(animate)
};

function onWindowResize(): void {
    Game.renderer?.setSize(window.innerWidth, window.innerHeight);
    Game.camera?.updateMatrix();
}