import * as THREE from 'three';

export class InteractionManager {
    constructor(camera, container) {
        this.camera = camera;
        this.container = container; 

        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();
        
        // Array of 3D objects we want to raycast against
        this.interactableObjects = [];
        
        // State tracking for highlighting
        this.hoveredMesh = null;
        this.originalEmissive = new THREE.Color(0x000000);

        this._initPointerListener();
    }

    /**
     * Add a mesh or group (like a loaded .glb model) to the raycasting array
     */
    addInteractable(object) {
        this.interactableObjects.push(object);
    }

    _initPointerListener() {
        // Initially place pointer way off-screen so it doesn't accidentally trigger center screen
        this.pointer.set(-9999, -9999);

        window.addEventListener('mousemove', (event) => {
            // Using window guarantees we catch mouse moves even if the DOM layout is tricky
            this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
    }

    /**
     * Called every frame in the animation loop
     */
    update() {
        if (this.interactableObjects.length === 0) return;

        this.raycaster.setFromCamera(this.pointer, this.camera);
        const intersects = this.raycaster.intersectObjects(this.interactableObjects, true);

        if (intersects.length > 0) {
            const hitMesh = intersects[0].object;

            if (this.hoveredMesh !== hitMesh) {
                this._restoreHovered();

                // Only interact with actual meshes
                if (hitMesh.isMesh) {
                    this.hoveredMesh = hitMesh;
                    console.log("Hovering over part:", hitMesh.name); // Debug log to see the exactly part hit!
                    
                    // Backup the original material
                    this.originalMaterial = this.hoveredMesh.material;
                    
                    // Create a dedicated bright highlight material
                    // This is 100% guaranteed to work on any model
                    const highlightMat = new THREE.MeshStandardMaterial({
                        color: 0x4488ff,
                        emissive: 0x1144ff,
                        emissiveIntensity: 2,
                        roughness: 0.1,
                        metalness: 0.8,
                        transparent: true,
                        opacity: 0.9
                    });
                    
                    // Swap the material safely
                    this.hoveredMesh.material = highlightMat;
                    document.body.style.cursor = 'pointer';
                }
            }
        } else {
            this._restoreHovered();
            document.body.style.cursor = 'default';
        }
    }

    _restoreHovered() {
        if (this.hoveredMesh && this.originalMaterial) {
            // Put the original material back
            this.hoveredMesh.material = this.originalMaterial;
            this.originalMaterial = null;
            this.hoveredMesh = null;
        }
    }
}
