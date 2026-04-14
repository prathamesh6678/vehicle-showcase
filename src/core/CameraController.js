import gsap from 'gsap';

export class CameraController {
    constructor(camera, controls) {
        this.camera = camera;
        this.controls = controls;
        this.isAnimating = false;
    }

    /**
     * Smoothly animate camera to a new position and target
     * @param {Object} position - {x, y, z} new camera position
     * @param {Object} target - {x, y, z} new point the camera looks at
     * @param {Number} duration - animation time in seconds
     */
    animateTo(position, target, duration = 1.5) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        // Disable user interaction during the cinematic sweep
        this.controls.enabled = false;

        // Animate Camera Position
        gsap.to(this.camera.position, {
            x: position.x,
            y: position.y,
            z: position.z,
            duration: duration,
            ease: 'power3.inOut' // Smooth acceleration & deceleration
        });

        // Animate OrbitControls Target
        gsap.to(this.controls.target, {
            x: target.x,
            y: target.y,
            z: target.z,
            duration: duration,
            ease: 'power3.inOut',
            onComplete: () => {
                // Re-enable interactivity when done
                this.controls.enabled = true;
                this.isAnimating = false;
            }
        });
    }
}
