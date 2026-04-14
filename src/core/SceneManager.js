import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Stats from 'stats.js';

const stats = new Stats();
stats.showPanel(0); // 0 = FPS, 1 = ms/frame, 2 = MB memory
document.body.appendChild(stats.dom);

export class SceneManager {
    constructor(container) {
        this.container = container;
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this._initRenderer();
        this._initScene();
        this._initCamera();
        this._initLights();
        this._initResizeHandler();

        // Start the render loop
        this._animate();
    }

    // ─── Renderer ────────────────────────────────────────────────
    _initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,    // Smooth edges (disable on low-end devices later)
            alpha: false,       // We're using a solid bg, no transparency needed
        });

        // Pixel ratio: never go above 2 — retina is fine, 3x kills mobile GPUs
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);

        // Physically correct lighting — makes materials look realistic
        this.renderer.useLegacyLights = false;

        // Tone mapping makes HDR colors look natural on screen
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;

        // Enables correct gamma for textures
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Allows shadows (we'll use these for ground shadow)
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.container.appendChild(this.renderer.domElement);
    }

    // ─── Scene ───────────────────────────────────────────────────
    _initScene() {
        this.scene = new THREE.Scene();

        // Fog adds depth — far objects fade into the background color
        // Params: color, near distance, far distance
        this.scene.fog = new THREE.Fog(0x0a0a0f, 20, 80);

        // A subtle background gradient effect using a large sphere (skybox trick)
        const bgGeo = new THREE.SphereGeometry(50, 32, 32);
        const bgMat = new THREE.MeshBasicMaterial({
            color: 0x0a0a0f,
            side: THREE.BackSide   // Render inside of sphere
        });
        this.scene.add(new THREE.Mesh(bgGeo, bgMat));
    }

    // ─── Camera ──────────────────────────────────────────────────
    _initCamera() {
        // PerspectiveCamera(fov, aspectRatio, nearClip, farClip)
        // fov: 60° is a natural human-like field of view
        // nearClip/farClip: objects outside this range aren't rendered
        this.camera = new THREE.PerspectiveCamera(
            60,
            this.width / this.height,
            0.1,   // Near clip — very close objects
            100    // Far clip — matches our fog distance
        );

        // Position the camera: x=0 (centered), y=2 (slightly above ground), z=6 (back)
        this.camera.position.set(0, 2, 6);
        // Look at the origin — where our vehicle will sit
        this.camera.lookAt(0, 0, 0);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        // Smooth damping — the camera "glides" to a stop, very satisfying UX
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Limit vertical rotation — users shouldn't flip the model upside down
        this.controls.minPolarAngle = Math.PI * 0.1;  // 18° from top
        this.controls.maxPolarAngle = Math.PI * 0.85; // 153° — prevents going underground

        // Zoom limits
        this.controls.minDistance = 2;
        this.controls.maxDistance = 15;

        // Target — the point the camera orbits around
        this.controls.target.set(0, 1, 0); // Slightly above ground (vehicle center)
        this.controls.update();
    }

    // Inside _onFrame():
    _onFrame() {
        // Controls MUST be updated every frame when damping is enabled
        this.controls.update();
    }

    // ─── Lights ──────────────────────────────────────────────────
    _initLights() {
        // 1. Ambient light — fills the entire scene with a base color
        //    Think of it as global "room lighting"
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambient);

        // 2. Hemisphere light — sky color from above, ground color from below
        //    Gives a more natural outdoor feel than ambient alone
        const hemi = new THREE.HemisphereLight(0x8ab4f8, 0x2d1b00, 0.5);
        this.scene.add(hemi);

        // 3. Directional light — like the sun, casts parallel rays and shadows
        this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.dirLight.position.set(5, 8, 5);
        this.dirLight.castShadow = true;

        // Shadow map quality — higher = sharper but more expensive
        this.dirLight.shadow.mapSize.set(2048, 2048);
        // Shadow camera frustum — keep this tight around the vehicle
        this.dirLight.shadow.camera.near = 0.1;
        this.dirLight.shadow.camera.far = 30;
        this.dirLight.shadow.camera.left = -10;
        this.dirLight.shadow.camera.right = 10;
        this.dirLight.shadow.camera.top = 10;
        this.dirLight.shadow.camera.bottom = -10;
        this.scene.add(this.dirLight);

        // 4. Rim light — a colored backlight that separates the vehicle from background
        //    This is what gives vehicles that "studio shoot" look
        const rimLight = new THREE.DirectionalLight(0x4466ff, 0.8);
        rimLight.position.set(-5, 3, -5);
        this.scene.add(rimLight);
    }

    // ─── Ground ──────────────────────────────────────────────────
    addGround() {
        // A reflective ground plane so vehicles cast soft shadows
        const geo = new THREE.CircleGeometry(8, 64);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x111118,
            metalness: 0.3,
            roughness: 0.8,
        });
        const ground = new THREE.Mesh(geo, mat);
        ground.rotation.x = -Math.PI / 2;  // Lay flat
        ground.receiveShadow = true;         // Receive shadows from vehicles
        this.scene.add(ground);
        return ground;
    }

    // ─── Resize Handler ──────────────────────────────────────────
    _initResizeHandler() {
        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;

            // Camera aspect must update — otherwise the scene stretches
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();

            // Renderer must match new window size
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });
    }

    // ─── Animation Loop ──────────────────────────────────────────
    _animate() {
        stats.begin();
        // requestAnimationFrame is the browser's built-in render loop
        // It syncs to the display's refresh rate (60fps, 120fps, etc.)
        this.animationId = requestAnimationFrame(() => this._animate());

        // This is where you'd update animations, physics, controls each frame
        this._onFrame();

        // Render the scene from the camera's perspective
        this.renderer.render(this.scene, this.camera);
        stats.end();
    }

    // Override this in subclasses or attach callbacks for per-frame logic
    _onFrame() {
        // Will be used for: controls.update(), GSAP tickers, object rotations
    }

    // Clean up everything — important for preventing memory leaks
    destroy() {
        cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this._resizeHandler);
        this.renderer.dispose();
    }
}