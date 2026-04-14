# 🏍️ Vehicle Showcase

A high-performance, interactive **3D vehicle showcase** built with [Three.js](https://threejs.org/), [GSAP](https://gsap.com/), and Vanilla JavaScript. Designed to display two-wheelers (bikes, scooters, etc.) using optimized `.glb` 3D models, with smooth camera controls, part-level interactivity, and a premium dark-mode UI.

---

## 🌐 Live Preview

> Run locally via `npm run dev` — see [Getting Started](#getting-started).

---

## ✨ Features

- 🚗 **Multi-model support** — handles 7 to 20 `.glb` vehicle models efficiently
- 🎥 **Cinematic camera** — GSAP-powered smooth transitions between preset views (Front, Side, Top)
- 🖱️ **Part-level interaction** — hover over individual vehicle parts to highlight them via Raycaster
- 📊 **Dynamic info panel** — glassmorphism overlay displays live vehicle spec data
- 💾 **Smart model caching** — downloaded models are cached; switching back to a vehicle is instant
- 🧹 **GPU memory management** — geometries, materials & textures are fully disposed when swapping models
- 📱 **Mobile responsive** — adaptive UI layout, shadow disabled on mobile GPUs, larger touch targets
- 📈 **Real-time FPS monitor** — `stats.js` panel for development performance tracking
- 🎨 **Studio lighting** — `RoomEnvironment` HDRI for realistic reflections on metallic surfaces

---

## 🛠️ Tech Stack

| Technology | Role |
|---|---|
| [Three.js v0.183](https://threejs.org/) | 3D rendering engine |
| [GSAP v3.15](https://gsap.com/) | Cinematic camera animations & UI fades |
| [GLTFLoader](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) | Load `.glb` / `.gltf` 3D models |
| [DRACOLoader](https://threejs.org/docs/#examples/en/loaders/DRACOLoader) | Decompress Draco-compressed models |
| [OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls) | Mouse/touch orbit, pan, zoom |
| [Vite v8](https://vitejs.dev/) | Blazing-fast dev server & bundler |
| [stats.js](https://github.com/mrdoob/stats.js/) | FPS/memory monitor |
| Vanilla JavaScript (ES Modules) | Application logic |

---

## 📁 Project Structure

```
vehicle-showcase/
├── public/
│   └── models/            ← Place your .glb vehicle files here
├── src/
│   ├── core/
│   │   ├── SceneManager.js       # Three.js scene, renderer, camera, lights, animation loop
│   │   ├── AssetLoader.js        # GLTFLoader + DRACOLoader, model cache, GPU cleanup
│   │   ├── CameraController.js   # GSAP cinematic camera transitions
│   │   └── InteractionManager.js # Raycaster for part-level hover highlighting
│   └── main.js                   # App entry point, loadVehicle() orchestration
├── index.html                    # HTML shell + all CSS (glassmorphism UI)
├── package.json
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/prathamesh6678/vehicle-showcase.git
cd vehicle-showcase

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open **http://localhost:5173** in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🎮 Usage Guide

### Adding Real Vehicle Models

1. Export your bike/scooter from Blender (or download a `.glb`) and compress it with Draco:
   ```bash
   npx gltf-pipeline -i your_bike.glb -o your_bike_draco.glb --draco.compressionLevel 7
   ```

2. Place the compressed file in `/public/models/`

3. In `src/main.js`, update the `loadVehicle()` call:
   ```js
   loadVehicle('/models/yamaha_r6.glb', {
       name: 'Yamaha R6',
       description: 'A supersport 600cc motorcycle.',
       speed: '240 km/h',
       accel: '3.1 s',
       weight: '187 kg'
   });
   ```

### Switching Between Multiple Vehicles

Call `loadVehicle()` any time. The previous model is automatically cleaned from GPU memory before the new one loads:

```js
// Example: wire a "Next Vehicle" button
document.getElementById('btn-next').addEventListener('click', () => {
    loadVehicle('/models/honda_cbr.glb', { name: 'Honda CBR 1000RR', ... });
});
```

### Camera Presets

Use the built-in `CameraController` for custom cinematic angles:

```js
// Camera flies smoothly to this position and target in 1.5 seconds
sceneManager.cameraController.animateTo(
    { x: 3, y: 1, z: 2 },   // camera position
    { x: 0, y: 0.5, z: 0 }, // look-at target
    1.5                      // duration in seconds
);
```

---

## 🏗️ Implementation Phases

The project was built progressively through 7 phases:

| Phase | Description |
|---|---|
| **Phase 1** | Three.js scene, PerspectiveCamera, OrbitControls, HDRI studio lighting |
| **Phase 2** | `AssetLoader` with GLTFLoader, DRACOLoader, shadow setup |
| **Phase 3** | GSAP cinematic camera transitions, Front/Side/Top presets |
| **Phase 4** | Glassmorphism HTML info panel, live vehicle spec data binding |
| **Phase 5** | `InteractionManager` Raycaster — per-mesh highlight on hover |
| **Phase 6** | Model cache, GPU `dispose()` cleanup, loading progress bar |
| **Phase 7** | Mobile-responsive layout, shadow disabled on mobile, adaptive camera |

---

## ⚡ Performance Notes

- **Draco compression** reduces `.glb` file sizes by up to **70%**
- Models are **cached** after first download — instant on revisit
- **Frustum culling** is enabled on all meshes — off-screen geometry is skipped
- **Shadow maps disabled on mobile** — saves ~16MB of VRAM per light
- **Pixel ratio capped at 2** — prevents 3x DPR resolution on mobile GPUs from killing performance
- Aim for models under **5MB** (after Draco compression) for best load times

---

## 🐛 Common Issues

| Issue | Fix |
|---|---|
| Model doesn't appear | Check browser console for 404. Verify the URL/path is correct. |
| Robot arms detached | Rigged `.glb` files need an `AnimationMixer`. Static vehicle models will load fine. |
| No hover glow | Check that `interactionManager.addInteractable(model)` was called after loading. |
| Low FPS on mobile | Reduce shadow map size in `SceneManager.js` or set `renderer.shadowMap.enabled = false` |
| Duplicate `_onFrame` | JavaScript classes silently override duplicate methods. Ensure only one `_onFrame` exists. |

---

## 🗺️ Roadmap

- [ ] Vehicle selector carousel (Left / Right browsing)
- [ ] Paint color configurator (swap material colors at runtime)
- [ ] Annotation labels on hovered parts (popup tooltips)
- [ ] GSAP scroll-based intro animation
- [ ] Electron wrapper for desktop app distribution

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<p align="center">Built with ❤️ using Three.js, GSAP & Vanilla JavaScript</p>
