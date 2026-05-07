/**
 * Crea una escena 3D con una spotLight rotando continuamente,
 * además de una estatua que rota on scroll
 * @author Alvaro Ruiz - alvaro-ruiz.dev
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const scene = new THREE.Scene();

// ----- CONFIG ------ //
let modelOnFrontMobile = false;
let modelOnFrontDesktop = true;

let cameraYOffset = 0;
let textureFilename = 'disturb.jpg';
let modelPath = "./caesar-clean.glb";


let topFov = 50; // less zoom -> more fov
let topFovNarrow = 80; // Smaller in narrow devices

let bottomFov =40; // more zoom -> less fov
let bottomFovNarrow = 60;

const narrowThreshold = 1000;

// -------APPLY CONFIG (not implemented) ---------- //
const params = new URLSearchParams(window.location.search);
if (params.get('modelOnFrontDesktop') === 'false') {
    modelOnFrontDesktop = false;
}


let container = {};
const sizes = {};
let statue = {};

let canvas = {};
let renderer = {};
let controls = {};
let controlsDomElement = {};

let spotLight = {};
let spotLight2 = {};
const lights = []; // Luces añadidas a la escena cargada. Servirán como referencia para la posición de la 1ª luz

let lightTarget = {};
let lightOrbitRadius = 1; // Distancia de la luz a la estatua

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
    const texture = texLoader.load( textureFilename );
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;

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

    scene.add(spotLight);      // solo lightTarget a la escena

    // Segunda spotLight
    spotLight2 = new THREE.SpotLight();
    spotLight2.copy(spotLight);
    spotLight2.map = texture;

    scene.add(spotLight2);
    // statue

    statue.reciveShadow = true;
    statue.castShadow = true;
}

function onSceneLoaded(model)
{
    scene.add( model );
    // const gridHelper = new THREE.GridHelper( 1, 1 );
    // scene.add( gridHelper );

    model.traverse( ( child ) => {
        if (child.isLight) {
            lights.push(child);
            console.log("light position found");
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
    // console.log("Resized canvas to " + sizes.width + ", " + sizes.height);
    camera.aspect = sizes.width / sizes.height;

    onScroll(); // Por si cargamos la página a "mitad" scrollear


    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}



//--------------
// INIT SCENE AND CAMERA
// ------------

function isNarrowDevice() {
    return window.innerWidth < narrowThreshold;
}
function isMobileDevice() {
    const userAgentCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // touch screen con pantalla pequeña:
    const touchCheck = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const screenCheck = window.innerWidth <= 1024;

    return userAgentCheck || (touchCheck && screenCheck);
}

let camera;

let camPositions = [];



function isMobilePlatform() {
    if (navigator.userAgentData) {
        return navigator.userAgentData.mobile;
    }
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
}

function chooseModel() {
    const modelParam = params.get('model'); // Busca el valor de ?model=

    if (modelParam === 'discobolo') {
        modelPath = "./discobolo.glb";
        cameraYOffset = 30;
    } else {

    }
}

function createControls() {
    controlsDomElement = document.createElement('div');
    controlsDomElement.classList.add('controlssss');
    // controlsDomElement.style.position = 'absolute';
    // controlsDomElement.style.top = '0';
    // controlsDomElement.style.width = '50%';
    // controlsDomElement.style.height = '100%';
    controlsDomElement.style.cssText = container.style.cssText;
    controlsDomElement.style.minWidth = '45%';
    controlsDomElement.style.pointerEvents = 'auto';
    controlsDomElement.style.zIndex = '1000';
    // container.appendChild(controlsDomElement);
    document.body.appendChild(controlsDomElement);

    controls = new OrbitControls(camera, controlsDomElement);
    controls.enableDamping = true; // Suaviza el movimiento (da inercia)
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false; // Mantiene el eje Y estable


    const params = new URLSearchParams(window.location.search);
    const controlsParam = params.get('controls'); // Busca el valor de ?controls=

    if (controlsParam === 'disabled') {
        controlsDomElement.style.pointerEvents = 'none';
        controlsDomElement.style.zIndex = '0';
    }
}

function init() {
    chooseModel();
    if (isMobilePlatform()) {
        topFov = 43;
    }

    container = document.createElement("div");

    container.style.zIndex = 10;
    container.style.position = "fixed"; // Clave para que no se mueva con el scroll
    container.style.top = "50%";        // Mitad de la altura
    container.style.right = "0";        // Lo pega al borde derecho
    container.style.transform = "translateY(-50%)"; // Corregir altura
    container.style.paddingTop = "20svh"; // Hacer hueco
    container.style.paddingRight= "5vw";
    container.style.maxWidth = "50vw";
    container.classList.add('webgl-container');
    container.innerHTML = "";
    container.style.height = "100%";

    if ( (!isMobileDevice() && modelOnFrontDesktop) || isMobileDevice() && modelOnFrontMobile) {
        document.body.appendChild(container);
    }
    else {
        let outerContainer = document.querySelector(".row-bg-wrap");
        outerContainer.appendChild(container);
    }

    // Save original size
    sizes.width = container.clientWidth; sizes.height = container.clientHeight;

    // Append canvas
    canvas = document.createElement("canvas");
    canvas.textContent = "Tu navegador no soporta canvas o la animación no se pudo cargar. Esta escena muestra una estatua de Julio César rotando al hacer scroll.";
    container.appendChild(canvas);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true // To combine other renderers
    });


    // Controls relate

    camera = new THREE.PerspectiveCamera(topFov,
        sizes.width / sizes.height,   // aspect
        0.01,                          // near point
        1000                          // far away point
    );

    window.addEventListener("resize", resize);


    // Load glb model
    const loader = new GLTFLoader();

    // AFTER LOAD MODEL
    loader.load( modelPath, function ( gltf ) {
        onSceneLoaded(gltf.scene);
        setupLights();
        // Controls require an invisible dom element
        createControls();

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

        camera.lookAt(statue.position);

        resize();

        renderer.setAnimationLoop( animate );
        // controls.active = false;

    }, undefined, function ( error ) {
        console.error( "Error loading model: " + error );
    } );
}

let scrollPercent = 0;
function onScroll() {

    // Calculamos qué porcentaje de la página se ha recorrido
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    scrollPercent = scrollTop / docHeight;
}
window.addEventListener("scroll", onScroll);

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
    spotLight2.position.x = Math.cos(angle + Math.PI) * lightOrbitRadius;
    spotLight2.position.z = Math.sin(angle + Math.PI) * lightOrbitRadius;


    // Camera zoom
    if (isNarrowDevice()) {
        // console.log("isNarrow");
        camera.fov = topFovNarrow * (1 - scrollPercent) + bottomFovNarrow * scrollPercent ;
    }
    else {
        // console.log("NOT Narrow");
        camera.fov = topFov * (1 - scrollPercent) + bottomFov * scrollPercent;
    }
    camera.updateProjectionMatrix();
    // const targetPos = new THREE.Vector3().copy(camPositions[0]);
    // targetPos.lerp(camPositions[1], scrollPercent); // scrollPercent debe ser de 0 a 1
    // camera.position.copy(targetPos);
    // camera.position.y -= cameraYOffset;
    // Render
    renderer.render(scene, camera);

}

init();


