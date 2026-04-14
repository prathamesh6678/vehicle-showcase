import { SceneManager } from './core/SceneManager.js';
import { AssetLoader } from './core/AssetLoader.js';
import * as THREE from 'three';
import gsap from 'gsap';

// Get our container div
const container = document.getElementById('canvas-container');

// Boot the scene
const sceneManager = new SceneManager(container);

// Add the ground plane
sceneManager.addGround();

// ── Load 3D Model ──────────────────────────────────────────────
const assetLoader = new AssetLoader();

// The previous motorcycle link triggered a 404, so we are using the official Three.js
// 'RobotExpressive' model. It's heavily separated into multiple parts (Head, Arm, Leg, Torso),
// which perfectly demonstrates our Raycaster hovering feature for Phase 5!
const PLACEHOLDER_MODEL_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb';

// ── DOM refs for the loading overlay ─────────────────────────
const loadingOverlay = document.getElementById('loading-overlay');
const loadingBar = document.getElementById('loading-bar');
const loadingPercent = document.getElementById('loading-percent');

// Track the current model so we can safely dispose it before loading the next
let currentModel = null;

/**
 * Load a vehicle by URL and update the UI accordingly.
 * This is the core "swap" function — reusable for any vehicle in your fleet.
 */
async function loadVehicle(url, vehicleData) {
    try {
        // Show the loading overlay
        loadingOverlay.classList.remove('hidden');
        loadingBar.style.width = '0%';
        loadingPercent.textContent = '0%';

        // ── Cleanup Previous Model ───────────────────────────────
        // This is the most important performance step:
        // Remove from scene first, then dispose GPU memory
        if (currentModel) {
            sceneManager.scene.remove(currentModel);
            assetLoader.cleanupModel(currentModel);
            sceneManager.interactionManager.interactableObjects = []; // Clear raycaster targets
            currentModel = null;
        }

        // ── Load New Model with Progress ─────────────────────────
        const vehicleModel = await assetLoader.loadModel(url, (progress) => {
            loadingBar.style.width = `${progress}%`;
            loadingPercent.textContent = `${Math.round(progress)}%`;
        });

        vehicleModel.scale.set(0.5, 0.5, 0.5);
        vehicleModel.position.set(0, 0, 0);
        sceneManager.scene.add(vehicleModel);
        sceneManager.interactionManager.addInteractable(vehicleModel);
        currentModel = vehicleModel;

        // ── Update the Info Panel ────────────────────────────────
        document.getElementById('vehicle-name').innerText = vehicleData.name;
        document.getElementById('vehicle-desc').innerText = vehicleData.description;
        document.getElementById('stat-speed').innerText = vehicleData.speed;
        document.getElementById('stat-accel').innerText = vehicleData.accel;
        document.getElementById('stat-weight').innerText = vehicleData.weight;
        gsap.to('#vehicle-info-panel', { opacity: 1, duration: 1, delay: 0.3 });

        // ── Hide Overlay with a smooth fade ──────────────────────
        loadingOverlay.classList.add('hidden');

        console.log(`[main] Model loaded: ${vehicleData.name}`);

    } catch (error) {
        console.error("Failed to load vehicle:", error);
        loadingOverlay.classList.add('hidden');
    }
}

// ── Initial Load ─────────────────────────────────────────────
// When you have real bikes, you'll call loadVehicle() with their URLs and data
const VEHICLE_URL = 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/RobotExpressive/RobotExpressive.glb';

loadVehicle(VEHICLE_URL, {
    name: "Mech-Bot Prototype",
    description: "A multi-part Three.js model. Hover any part to see the Raycaster highlighting individual sections.",
    speed: "N/A",
    accel: "Instant",
    weight: "200 kg"
});

// ── UI Integration & Camera Cinematic Controls ───────────────
document.getElementById('btn-front').addEventListener('click', () => {
    sceneManager.cameraController.animateTo(
        { x: 0, y: 1.5, z: 6 }, // Position: Straight back
        { x: 0, y: 1, z: 0 },   // Target: Center of model
        1.5                     // Duration: 1.5s
    );
});

document.getElementById('btn-side').addEventListener('click', () => {
    sceneManager.cameraController.animateTo(
        { x: 6, y: 2, z: 0 },   // Position: Far right side
        { x: 0, y: 1, z: 0 },   // Target: Center of model
        1.5
    );
});

document.getElementById('btn-top').addEventListener('click', () => {
    sceneManager.cameraController.animateTo(
        { x: 0, y: 8, z: 0.1 }, // Position: High up (slight Z offset prevents gimble lock)
        { x: 0, y: 1, z: 0 },   // Target: Center of model
        2.0                     // Duration: 2s (longer for dramatic swoop)
    );
});

// ── Debug Helpers ──────────────────────────────────────────────
// ALWAYS use these during development. Remove for production.
// AxesHelper: Red=X, Green=Y, Blue=Z
sceneManager.scene.add(new THREE.AxesHelper(3));

// GridHelper shows the ground plane in world units
sceneManager.scene.add(new THREE.GridHelper(20, 20, 0x222233, 0x222233));

// Shows your shadow camera frustum — critical for debugging shadows
const shadowHelper = new THREE.CameraHelper(sceneManager.dirLight.shadow.camera);
sceneManager.scene.add(shadowHelper);