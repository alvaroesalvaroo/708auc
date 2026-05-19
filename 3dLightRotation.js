/**
 * Crea una escena 3D con una spotLight rotando continuamente,
 * además de una estatua que rota on scroll
 * @author Alvaro Ruiz - alvaro-ruiz.dev
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GridHelper } from 'three';

let scene = {};

// ----- CONFIG ------ //
let modelOnFrontMobile = false;
let modelOnFrontDesktop = false;

let containerTop = "-100px"; // Offset horizontal de la escena 3D
let containerRight = "-10vw"; // Offset vertical de la escena 3D

let textureFilename = 'disturb.jpg';


let topFov = 50; // less zoom -> more fov
let topFovNarrow = 80; // Smaller in narrow devices

let bottomFov =40; // more zoom -> less fov
let bottomFovNarrow = 60;

const narrowThreshold = 1000; // pixeles a partir de los cuales consideramos "narrow device" y hacemos la escena más pequeña

const lightSpeed = Math.PI / 4; // Velocidad, en radianes/s de giro de las luces


// -------APPLY CONFIG---------- //
// urlparams compatibles en true/false son "modelOnFrontDesktop", "controls" y "grid"

const params = new URLSearchParams(window.location.search);
if (params.get('modelOnFrontDesktop') === 'false') {
    modelOnFrontDesktop = false;
} else if (params.get('modelOnFrontDesktop') === 'true') {
    modelOnFrontDesktop = true;
}

let basePath = "/"; // MODELOS Y IMAGEN SE ENCUENTRAN EN LA RAIZ DEL SERVER. Si se mueven, cambiar este path
if (window.location.hostname === 'localhost') basePath = '/708auc/'; // Para trabajar en localhost/708auc

let modelPath = ""; // Decided beyond

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
let lightOrbitRadius = 1; // Distancia de la luz a la estatua. Recalculada al cargar el modelo

const LIGHT_OFFSET = 1; // Distancia respecto la estatua a la que se proyecta la textura de luz

let texture = {};



function loadLightTexture() {
    const texLoader = new THREE.TextureLoader().setPath( basePath );
    texture = texLoader.load( textureFilename );
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
}

function setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff);
    ambientLight.intensity = 0.2;
    scene.add(ambientLight);

    for (const light of lights) {
        light.active = false;
        light.intensity = 0;// Deactivate lights in scene
    }

    // Setup stoplight
    spotLight = new THREE.SpotLight( 0xffffff, 100 );
    spotLight.name = 'spotLight';

    if (lights && lights[0]) {
        spotLight.position.copy(lights[0].position);
        lightOrbitRadius = Math.sqrt(Math.pow(spotLight.position.x, 2) + Math.pow(spotLight.position.z, 2));
    }

    spotLight.name = 'spotLight';
    spotLight.map = texture;
    lightTarget = new THREE.Object3D();
    lightTarget.position.copy(statue.position);
    lightTarget.position.y += LIGHT_OFFSET;
    scene.add(lightTarget);
    spotLight.target = lightTarget;
    spotLight.penumbra = 1;
    spotLight.decay = 2.3;
    spotLight.distance = 0;
    spotLight.intensity = 40;

    // NO PROYECTAMOS SOMBRA
    spotLight.castShadow = false;

    scene.add(spotLight);      // solo lightTarget a la escena

    // Segunda spotLight
    spotLight2 = new THREE.SpotLight();
    spotLight2.copy(spotLight);
    spotLight2.target = lightTarget;
    spotLight2.map = texture;

    scene.add(spotLight2);
    // statue

    statue.reciveShadow = true;
    statue.castShadow = true;
}

function onSceneLoaded(model)
{
    scene.add( model );
    if (params.get('grid') == 1) {
        const gridHelper = new THREE.GridHelper( 10, 10 );
        scene.add( gridHelper );
    }


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

// Resize, pero maximo una vez cada 300 ms
let resizeTimer;
window.addEventListener("resize", () => {
    // Si ya hay un temporizador en marcha, lo cancelamos
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
        resize(); // Llamada a tu función original
    }, 300);
});

function resize () {

    onScroll(); // Por si cargamos la página a "mitad" scrollear
    sizes.width = container.clientWidth;
    sizes.height = container.clientHeight;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}


window.addEventListener("scroll", onScroll);

let scrollPercent = 0;

function onScroll() {
    // Calculamos qué porcentaje de la página se ha recorrido
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    scrollPercent = scrollTop / docHeight;
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

let camPositions = []; // Se detectan como emptys en la escena 3D (camPosition, camPosition1, camPosition...)

function createControls() {
    controlsDomElement = document.createElement('div');
    controlsDomElement.classList.add('controlssss');
    //
    controlsDomElement.style.cssText = container.style.cssText; // Copy container position?
    controlsDomElement.style.top = "120px";
    controlsDomElement.style.minWidth = '45%';
    controlsDomElement.style.pointerEvents = 'auto';
    controlsDomElement.style.zIndex = '1000';
    document.body.appendChild(controlsDomElement);


    // controlsDomElement.style.position = "absolute"; // El padre esta fixed
    // controlsDomElement.style.top = "120px";
    // controlsDomElement.style.left = "0";
    // controlsDomElement.style.right = "0";
    // controlsDomElement.style.width = "100%";
    // controlsDomElement.style.height = "calc(100% - 120px)"; // Ocupa el 100% del espacio restante
    // container.appendChild(controlsDomElement);

    controls = new OrbitControls(camera, controlsDomElement);
    controls.enableDamping = true; // Suaviza el movimiento (da inercia)
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false; // Mantiene el eje Y estable


    const params = new URLSearchParams(window.location.search);
    const controlsParam = params.get('controls'); // Busca el valor de ?controls=

    if (controlsParam === 'disabled' || controlsParam === 'false') {
        controlsDomElement.style.pointerEvents = 'none';
        controlsDomElement.style.zIndex = '-10';
    }
}

// Modelo de más resolución en desktop
function chooseModel() {

    if (isMobileDevice()) {
        modelPath = basePath + 'caesar-46k.glb';
    }
    else {
        // modelPath = basePath + 'caesar-168k.glb';
        modelPath = basePath + 'caesar-46k.glb';
    }
}

function init() {

    chooseModel();
    scene = new THREE.Scene();

    container = document.createElement("div");
    container.classList.add('webgl-container');
    container.style.pointerEvents = 'none';
    container.style.zIndex = 10;
    container.style.position = "fixed"; // Clave para que no se mueva con el scroll
    container.style.top = containerTop;        // OFFSETY
    container.style.right = containerRight;        // OFFSETX

    container.style.paddingTop = "20lvh"; // LVH ES LA MEJOR MANERA DE EVITAR SALTOS EN MOVILE. dhv funciona en apple, en android regular
    container.style.height = "100lvh";

    container.style.maxWidth = "50vw";
    container.style.minWidth = "45vw";
    container.innerHTML = "";

    if ( (!isMobileDevice() && modelOnFrontDesktop) || isMobileDevice() && modelOnFrontMobile) {
        document.body.appendChild(container);
    }
    else {
        let outerContainer = document.querySelector(".row-bg-wrap");
        outerContainer.classList.add('outer-container');
        outerContainer.appendChild(container);
    }

    // Save original size
    sizes.width = container.clientWidth; sizes.height = container.clientHeight;

    // Append canvas
    canvas = document.createElement("canvas");
    canvas.textContent = "Esta escena 3D muestra una estatua de Julio César rotando al hacer scroll.";
    container.appendChild(canvas);

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true // To combine other renderers
    });

    camera = new THREE.PerspectiveCamera(topFov,
        sizes.width / sizes.height,   // aspect
        0.01,                          // near point
        1000                          // far away point
    );


    // Load glb model
    const loader = new GLTFLoader();
    loadLightTexture();
    console.log("Loading " + modelPath + "...");
    loader.load( modelPath, function ( gltf ) {
        // AFTER LOAD MODEL
        onSceneLoaded(gltf.scene);
        setupLights();
        // Controls require an invisible dom element
        createControls();

        // Pasamos camera y statue a world position
        const worldPos = new THREE.Vector3(); // origen de coordenadas
        camera.getWorldPosition(worldPos);
        statue.getWorldPosition(worldPos);

        // Cam target es la estatua position. Le damos un offset
        let camTarget = new THREE.Vector3().copy(statue.position);
        camTarget.x += 0; // possible offset?
        camTarget.y -= 0.3;

        controls.target.copy(camTarget);
        controls.update();

        // polar angle estará fijo
        const currentPolar = 60 * (Math.PI / 180);
        controls.minPolarAngle = currentPolar;
        controls.maxPolarAngle = currentPolar;
        controls.update();

        camera.position.copy(camPositions[0].position);

        resize();

        renderer.setAnimationLoop( animate );

    }, undefined, function ( error ) {
        console.error( "Error loading model: " + error );
    } );
}


// -------------
// MAIN LOOP

const clock = new THREE.Clock();

function animate() {

    controls.update(); // Solo necesario si enableDamping = true o autoRotate = true

    // ROTATION
    // scene.rotation.y = scrollPercent * (Math.PI * 2); // No lerp
    // Cool lerp
    statue.rotation.y += (scrollPercent * Math.PI * 2 - statue.rotation.y) * 0.1;

    const angle = clock.getElapsedTime() * lightSpeed;
    spotLight.position.x = Math.cos(angle) * lightOrbitRadius;
    spotLight.position.z = Math.sin(angle) * lightOrbitRadius;
    spotLight2.position.x = Math.cos(angle + Math.PI) * lightOrbitRadius;
    spotLight2.position.z = Math.sin(angle + Math.PI) * lightOrbitRadius;


    // Camera zoom
    if (isNarrowDevice()) {
        camera.fov = topFovNarrow * (1 - scrollPercent) + bottomFovNarrow * scrollPercent ;
    }
    else {
        camera.fov = topFov * (1 - scrollPercent) + bottomFov * scrollPercent;
    }
    camera.updateProjectionMatrix();

    // Render
    renderer.render(scene, camera);

}

init();

// FIX MENU LOCO DESPLEGABLE SLIDER TERRIBLE

let botonLoco;
// setTimeout(() => {
//     botonLoco = document.querySelector('[aria-label="Navigation Menu"]');
//
//     if (botonLoco) {
//         console.warn("botonloco: ");
//         console.warn(botonLoco);
//         botonLoco.addEventListener('click', e => {
//
//             toggleControls();
//
//         }, true)
//     }
//     else {
//         console.warn("No bottonloco found.");
//     }
// }, 300);

document.addEventListener('click', e => {

    // Buscamos si el clic se originó en el botón o en CUALQUIERA de sus hijos (los iconos internos)
    botonLoco = e.target.closest('[aria-label="Navigation Menu"]');
    console.log(botonLoco);

    if (botonLoco) {
        console.warn("¡Clic interceptado con éxito al botonLoco");
        toggleControls();
    }

}, true);



let isSliderOn = false;

function toggleControls() {

    isSliderOn = !isSliderOn;
    console.warn("restart scene");
    init();

    console.warn("toggle controls");
    if (isSliderOn) {
        console.warn("Abril");

        controlsDomElement.style.pointerEvents = 'none';
        container.style.zIndex = 9999;

        const botonCerrar = document.querySelector('.slide_out_area_close');

        if (botonCerrar) {
            botonCerrar.addEventListener('click', e => {
                // e.preventDefault();
                toggleControls();

            })
        } else {
            console.warn("No hay boton cerrar!");
        }

    } else {
        console.warn("Cerral");
        // Volver a la pantalla inicial
        location.reload();
        // controlsDomElement.style.pointerEvents = '';
        // controlsDomElement.style.pointerEvents = '';
    }

}





