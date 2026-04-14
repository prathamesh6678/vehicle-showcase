import { SceneManager } from './core/SceneManager.js';
import * as THREE from 'three';

// Get our container div
const container = document.getElementById('canvas-container');

// Boot the scene
const sceneManager = new SceneManager(container);

// Add the ground plane
sceneManager.addGround();

// ── Placeholder: Add a vehicle proxy cube ──────────────────────
// Before your real GLB models are ready, always test with primitives
// A BoxGeometry at the same position/scale helps you validate
// lighting, camera, and shadows before worrying about 3D models.

const testGeo = new THREE.BoxGeometry(2, 1.2, 4);
const testMat = new THREE.MeshStandardMaterial({
  color: 0xcc3300,        // Red — easy to spot
  metalness: 0.6,
  roughness: 0.3,
});
const testMesh = new THREE.Mesh(testGeo, testMat);
testMesh.position.set(0, 0.6, 0);  // Sit on the ground (y = half height)
testMesh.castShadow = true;
testMesh.receiveShadow = true;
sceneManager.scene.add(testMesh);

// ── Debug Helpers ──────────────────────────────────────────────
// ALWAYS use these during development. Remove for production.
// AxesHelper: Red=X, Green=Y, Blue=Z
sceneManager.scene.add(new THREE.AxesHelper(3));

// GridHelper shows the ground plane in world units
sceneManager.scene.add(new THREE.GridHelper(20, 20, 0x222233, 0x222233));

// Shows your shadow camera frustum — critical for debugging shadows
const shadowHelper = new THREE.CameraHelper(sceneManager.dirLight.shadow.camera);
sceneManager.scene.add(shadowHelper);