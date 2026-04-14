import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as THREE from 'three';

export class AssetLoader {
    constructor() {
        // ── Loader Setup ─────────────────────────────────────────
        this.gltfLoader = new GLTFLoader();
        this.dracoLoader = new DRACOLoader();
        this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        this.dracoLoader.preload(); // Pre-initialize the Draco WASM decoder in the background
        this.gltfLoader.setDRACOLoader(this.dracoLoader);

        // ── Cache Map ─────────────────────────────────────────────
        // Key: url string, Value: loaded THREE.Group
        // This ensures we NEVER download the same model twice
        this._cache = new Map();
    }

    /**
     * Loads a .glb model. Returns cached version if already loaded.
     * @param {string} url - The path or URL to the model
     * @param {function} onProgress - Optional progress callback (0-100)
     * @returns {Promise<THREE.Group>}
     */
    async loadModel(url, onProgress) {
        // ── Cache Hit ─────────────────────────────────────────────
        // If this URL was already loaded, return a CLONE of the cached model.
        // Cloning is cheap (shares geometry/textures on GPU), but gives us
        // an independent scene node we can position/scale/remove freely.
        if (this._cache.has(url)) {
            console.log(`[AssetLoader] Cache hit for: ${url}`);
            return this._cache.get(url).clone();
        }

        return new Promise((resolve, reject) => {
            this.gltfLoader.load(
                url,
                (gltf) => {
                    const model = gltf.scene;

                    // Enable shadows and optimize textures for every Mesh
                    model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;

                            // Ensure frustum culling is enabled (objects outside camera view skip rendering)
                            child.frustumCulled = true;
                        }
                    });

                    // Store in cache before resolving
                    this._cache.set(url, model);
                    resolve(model.clone());
                },
                (xhr) => {
                    if (xhr.total > 0 && onProgress) {
                        onProgress((xhr.loaded / xhr.total) * 100);
                    }
                },
                (error) => {
                    console.error('Error loading model:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Properly destroys a model and frees all GPU memory.
     * ALWAYS call this before swapping to a new vehicle model!
     * @param {THREE.Object3D} model - The model to dispose
     */
    cleanupModel(model) {
        if (!model) return;

        // Traverse every child of the model group
        model.traverse((child) => {
            if (!child.isMesh) return;

            // 1. Free the geometry (vertex data) from GPU memory
            if (child.geometry) {
                child.geometry.dispose();
            }

            // 2. Free all materials and their textures
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat) => {
                if (!mat) return;

                // Dispose every texture map the material may have
                const textureMaps = [
                    'map', 'normalMap', 'roughnessMap', 'metalnessMap',
                    'aoMap', 'emissiveMap', 'envMap', 'lightMap'
                ];
                textureMaps.forEach((mapKey) => {
                    if (mat[mapKey]) {
                        mat[mapKey].dispose();
                    }
                });

                // Dispose the material itself
                mat.dispose();
            });
        });

        console.log('[AssetLoader] Model disposed from GPU memory.');
    }
}
