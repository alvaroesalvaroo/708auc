/**
 * Crea una escena 3D con una spotLight rotando continuamente,
 * además de una estatua que rota on scroll
 * @author Alvaro Ruiz - alvaro-ruiz.dev
 */


import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// import { GridHelper} from "./three/src/helpers/GridHelper.js";


const scene = new THREE.Scene();


let container = {};
const sizes = {};
let statue = {};
// Create renderer in html canvas webgl element
let canvas = {};
let renderer = {};
let controls = {};
let controlsDomElement = {};

let spotLight = {};
const lights = [];
let lightTarget = {};
let lightOrbitRadius = 1;
console.log("Init 3D light rotation script");
function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff);
    ambientLight.intensity = 0.2;
    scene.add(ambientLight);

    for (const light of lights) {
        light.active = false;
        light.intensity = 0; // BLENDER-THREE.JS LIGHT ADJUSTEMENT
    }

    // Load texture
    const texLoader = new THREE.TextureLoader().setPath( './' );
    const filename = 'disturb.jpg';
    const texture = texLoader.load( filename );
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    console.log(texture);

    // Setup stoplight
    spotLight = new THREE.SpotLight( 0xffffff, 100 );
    spotLight.name = 'spotLight';

    if (lights && lights[0]) {
        spotLight.position.copy(lights[0].position);
        lightOrbitRadius = Math.sqrt(Math.pow(spotLight.position.x, 2) + Math.pow(spotLight.position.z, 2));
    }

    spotLight.name = 'spotLight';
    spotLight.map = texture;
    // spotLight.angle = Math.PI / 6;
    lightTarget = new THREE.Object3D();
    lightTarget.position.copy(statue.position);
    lightTarget.position.y += 2;

    spotLight.target = lightTarget;
    spotLight.penumbra = 1;
    spotLight.decay = 2;
    spotLight.distance = 0;
    spotLight.intensity = 50;

    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.camera.near = 2;
    spotLight.shadow.camera.far = 10;
    spotLight.shadow.focus = 1;
    spotLight.shadow.bias = - .003;
    spotLight.shadow.intensity = 1;

    // lightTarget.add(spotLight);  // spotLight hijo de lightTarget
    scene.add(spotLight);      // solo lightTarget a la escena
    // statue
    statue.reciveShadow = true;
    statue.castShadow = true;
    console.log(statue);
}

function onSceneLoaded(model)
{
    scene.add( model );
    // const gridHelper = new THREE.GridHelper( 1, 1 );
    // scene.add( gridHelper );

    model.traverse( ( child ) => {
        if (child.isLight) {
            lights.push(child);
            console.log("Pushed light");
        }
        else if (child.isMesh) {
            statue = child;
            console.log("Statue found");
        }
        else if (child.name.startsWith("CamPosition")) {
            console.log("cam position found");
            camPositions.push(child);
            camPositions.visible = false;
        }
    })
}

// ---------
// SCREEN RESIZE
// --------

function resize () {
    // Update sizes
    sizes.width = container.clientWidth;
    sizes.height = container.clientHeight;
    console.log("Resized canvas to " + sizes.width + ", " + sizes.height);
    camera.aspect = sizes.width / sizes.height;
    let isNarrowDevice = sizes.width < narrowThreshold;
    let initialFov = (isNarrowDevice ? fovNarrow : fov);
    camera.setFocalLength(initialFov);
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}



//--------------
// INIT SCENE AND CAMERA
// ------------

const fov = 50;
const fovNarrow = 45; // For (narrow) mobile devices
let initialFov = fov;
const narrowThreshold = 500;
let cameraYOffset = 0;
let camera;

let camPositions = [];

let modelPath = "./caesar-clean.glb";

let minFov = 30;

function isMobilePlatform() {
    if (navigator.userAgentData) {
        return navigator.userAgentData.mobile;
    }
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
}

function chooseModel() {
    const params = new URLSearchParams(window.location.search);
    const modelParam = params.get('model'); // Busca el valor de ?model=

    if (modelParam === 'discobolo') {
        modelPath = "./discobolo.glb";
        cameraYOffset = 30;
    } else {

    }
}

function createControls() {
    const params = new URLSearchParams(window.location.search);
    const controlsParam = params.get('controls'); // Busca el valor de ?controls=

    controlsDomElement = document.createElement('div');
    controlsDomElement.classList.add('controls');
    controlsDomElement.style.position = 'absolute';
    controlsDomElement.style.top = '0';
    controlsDomElement.style.width = '100%';
    controlsDomElement.style.height = '100%';
    controlsDomElement.style.pointerEvents = 'auto';
    controlsDomElement.style.zIndex = '100';
    container.appendChild(controlsDomElement);
    // document.body.appendChild(controlsDomElement);

    controls = new OrbitControls(camera, controlsDomElement);
    controls.enableDamping = true; // Suaviza el movimiento (da inercia)
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false; // Mantiene el eje Y estable

    if (controlsParam === 'disabled') {
        controlsDomElement.style.pointerEvents = 'none';
        controlsDomElement.style.zIndex = '0';
    }
}

function init() {
    chooseModel();
    if (isMobilePlatform()) {
        minFov = 43;
    }
    console.log("Initializing 3D scene...");
    // Select and clear container
    // container = document.querySelector('#project-details-section .project-slider');
    // let outherContainer = document.querySelector("#webgl-container")
    // let referenceContainer = document.querySelector("#reference")
    container = document.createElement("div");


    container.style.zIndex = 100;
    container.style.position = "fixed"; // Clave para que no se mueva con el scroll
    container.style.top = "50%";        // Mitad de la altura
    container.style.right = "0";        // Lo pega al borde derecho
    container.style.transform = "translateY(-50%)"; // Corregir altura
    container.style.paddingTop = "20svh"; // Hacer hueco
    container.style.paddingRight= "10vw";
    container.style.maxWidth = "50vw";
    document.body.appendChild(container);
    // document.body.insertAfter(container, referenceContainer);
    // Save original size
    sizes.width = container.clientWidth; sizes.height = container.clientHeight;
    container.classList.add('webgl-container');
    container.innerHTML = "";
    container.style.height = "100%";

    // Append canvas
    canvas = document.createElement("canvas");
    container.appendChild(canvas);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true // To combine other renderers
    });

    // Controls relate

    camera = new THREE.PerspectiveCamera(fov,
        sizes.width / sizes.height,   // aspect
        0.01,                          // near point
        1000                          // far away point
    );




    window.addEventListener("resize", resize);

    console.log("Init lab (small) scene in container with sizes: " + sizes.width + ", " + sizes.height);

    // Load glb model
    const loader = new GLTFLoader();

    // AFTER LOAD MODEL
    loader.load( modelPath, function ( gltf ) {
        onSceneLoaded(gltf.scene);
        setupLights();
        // Controls require an invisible dom element
        createControls();
        resize();

        controls.target.copy(statue.position);
        controls.target.y -= 0.3;
        controls.update();

        // const currentAzimuth = controls.getAzimuthalAngle();
        // controls.minAzimuthAngle = currentAzimuth - 45 * (Math.PI / 180);
        // controls.maxAzimuthAngle = currentAzimuth + 40 * (Math.PI / 180);
        controls.update();

        const currentPolar = 60 * (Math.PI / 180);
        controls.minPolarAngle = currentPolar;
        // controls.minPolarAngle = currentPolar - 2 * (Math.PI / 180); // 45 grados hacia arriba
        controls.maxPolarAngle = currentPolar; // Un poco hacia abajo
        controls.update();

        camera.position.copy(camPositions[0].position);
        camera.position.y -= cameraYOffset;

        const initialDistance = camera.position.distanceTo(controls.target);
        controls.minDistance = initialDistance;
        controls.maxDistance = initialDistance + 1;
        camera.lookAt(statue.position);

        renderer.setAnimationLoop( animate );
        // controls.active = false;

    }, undefined, function ( error ) {
        console.error( "Error loading model: " + error );
    } );
}

let scrollPercent = 0;
window.addEventListener("scroll", () => {
        // Calculamos qué porcentaje de la página se ha recorrido
        const scrollTop = window.scrollY;
        const docHeight = document.body.scrollHeight - window.innerHeight;
        scrollPercent = scrollTop / docHeight;
    }
);

// -------------
// MAIN LOOP

const clock = new THREE.Clock();
let deltaTime;

function animate() {

    controls.update(); // Solo necesario si enableDamping = true o autoRotate = true

    // ROTATION
    // scene.rotation.y = scrollPercent * (Math.PI * 2); // No lerp
    // Cool lerp
    statue.rotation.y += (scrollPercent * Math.PI * 2 - statue.rotation.y) * 0.1;
    // lightTarget.rotation.y += (scrollPercent * Math.PI - lightTarget.rotation.y) * 0.1;
    const speed = Math.PI / 4;
    const angle = clock.getElapsedTime() * speed;
    spotLight.position.x = Math.cos(angle) * lightOrbitRadius;
    spotLight.position.z = Math.sin(angle) * lightOrbitRadius;


    // Camera zoom
    camera.fov = minFov * scrollPercent + initialFov *(1 - scrollPercent);
    camera.updateProjectionMatrix();
    // const targetPos = new THREE.Vector3().copy(camPositions[0]);
    // targetPos.lerp(camPositions[1], scrollPercent); // scrollPercent debe ser de 0 a 1
    // camera.position.copy(targetPos);
    // camera.position.y -= cameraYOffset;
    // Render
    renderer.render(scene, camera);

}

init();


