import { helpers } from '../utils/helpers.js';

export class ThreeDController {
    constructor(simulator) {
        this.simulator = simulator;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.earth = null;
        this.asteroid = null;
        this.trajectoryLine = null;
        this.trajectoryPoints = [];
        
        this.isAnimating = false;
        this.animationStartTime = 0;
        this.animationDuration = 2000;
        this.currentTrajectory = null;
    }
    
    initialize() {
        this.setupScene();
        this.createObjects();
        this.setupCameraControls();
        this.startAnimation();
        this.setupResizeHandler();
    }
    
    setupScene() {
        const container = document.querySelector('.three-container');
        const canvas = document.getElementById('three-canvas');
        
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        
        this.camera = new THREE.PerspectiveCamera(
            75, 
            container.clientWidth / container.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 0, 150);
        
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
    
    createObjects() {
        this.createEarth();
        this.createAsteroid();
        this.createStars();
        this.createTrajectory();
        this.setupLighting();
    }
    
    createEarth() {
        const geometry = new THREE.SphereGeometry(50, 32, 32);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x2233ff,
            shininess: 30
        });
        
        this.earth = new THREE.Mesh(geometry, material);
        this.scene.add(this.earth);
    }
    
    createAsteroid() {
        const geometry = new THREE.SphereGeometry(2, 8, 8);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x8B4513,
            flatShading: true
        });
        
        this.asteroid = new THREE.Mesh(geometry, material);
        this.asteroid.position.set(120, 90, -180);
        this.scene.add(this.asteroid);
    }
    
    createTrajectory() {
        this.updateTrajectory(false);
    }
    
    calculateBezierPoints(start, end, deflected = false) {
        const points = [];
        const segments = 50;
        
        let control1, control2;
        
        if (deflected) {
            control1 = new THREE.Vector3(60, 120, -90);
            control2 = new THREE.Vector3(-75, 80, 50);
        } else {
            control1 = new THREE.Vector3(60, 120, -90);
            control2 = new THREE.Vector3(30, 60, -30);
        }
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = new THREE.Vector3();
            
            point.x = Math.pow(1 - t, 3) * start.x + 
                      3 * Math.pow(1 - t, 2) * t * control1.x + 
                      3 * (1 - t) * Math.pow(t, 2) * control2.x + 
                      Math.pow(t, 3) * end.x;
                      
            point.y = Math.pow(1 - t, 3) * start.y + 
                      3 * Math.pow(1 - t, 2) * t * control1.y + 
                      3 * (1 - t) * Math.pow(t, 2) * control2.y + 
                      Math.pow(t, 3) * end.y;
                      
            point.z = Math.pow(1 - t, 3) * start.z + 
                      3 * Math.pow(1 - t, 2) * t * control1.z + 
                      3 * (1 - t) * Math.pow(t, 2) * control2.z + 
                      Math.pow(t, 3) * end.z;
            
            points.push(point);
        }
        
        return points;
    }
    
    updateTrajectory(deflected) {
        const start = new THREE.Vector3(120, 90, -180);
        const end = deflected ? 
            new THREE.Vector3(-150, 70, 100) : 
            new THREE.Vector3(0, 0, 0);
        
        const points = this.calculateBezierPoints(start, end, deflected);
        this.currentTrajectory = points;
        
        if (this.trajectoryLine) {
            this.scene.remove(this.trajectoryLine);
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: deflected ? 0x00ff00 : 0xff4444, 
            linewidth: 2,
            transparent: true,
            opacity: 0.7
        });
        
        this.trajectoryLine = new THREE.Line(geometry, material);
        this.scene.add(this.trajectoryLine);
        
        this.updateTrajectoryPoints(points);
    }
    
    updateTrajectoryPoints(points) {
        this.trajectoryPoints.forEach(point => this.scene.remove(point));
        this.trajectoryPoints = [];
        
        const pointGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const pointMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.5
        });
        
        points.forEach((point, index) => {
            if (index % 5 === 0) { 
                const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
                pointMesh.position.copy(point);
                this.scene.add(pointMesh);
                this.trajectoryPoints.push(pointMesh);
            }
        });
    }
    
    createStars() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.7,
            sizeAttenuation: true
        });
        
        const vertices = [];
        for (let i = 0; i < 5000; i++) {
            vertices.push(
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000,
                (Math.random() - 0.5) * 2000
            );
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }
    
    setupLighting() {
        const ambient = new THREE.AmbientLight(0x333333, 0.3);
        this.scene.add(ambient);
        
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(200, 100, 150);
        this.scene.add(sun);
    }
    
    setupCameraControls() {
        const canvas = document.getElementById('three-canvas');
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;
        let radius = 150;
        let phi = 0;
        let theta = 0;
        
        const updateCamera = () => {
            const spherical = new THREE.Spherical(radius, phi, theta);
            this.camera.position.setFromSpherical(spherical);
            this.camera.lookAt(0, 0, 0);
        };
        
        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            canvas.style.cursor = 'grabbing';
        });
        
        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            canvas.style.cursor = 'grab';
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - lastX;
            const deltaY = e.clientY - lastY;
            
            phi += deltaX * 0.01;
            theta += deltaY * 0.01;
            theta = helpers.clamp(theta, -Math.PI/2, Math.PI/2);
            
            updateCamera();
            lastX = e.clientX;
            lastY = e.clientY;
        });
        
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            radius += e.deltaY * 0.01;
            radius = helpers.clamp(radius, 50, 300);
            updateCamera();
        });
        
        updateCamera();
    }
    
    startAnimation() {
        const animate = () => {
            requestAnimationFrame(animate);
            
            if (this.earth) this.earth.rotation.y += 0.005;
            if (this.asteroid && !this.isAnimating) {
                this.asteroid.rotation.x += 0.01;
                this.asteroid.rotation.y += 0.015;
            }
            
            if (this.isAnimating) {
                this.updateAnimation();
            }
            
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }
    
    updateAnimation() {
        const elapsed = Date.now() - this.animationStartTime;
        const progress = Math.min(elapsed / this.animationDuration, 1);
        const eased = helpers.easeOutCubic(progress);
        
        if (this.currentTrajectory && this.currentTrajectory.length > 0) {
            const pointIndex = Math.floor(eased * (this.currentTrajectory.length - 1));
            const targetPoint = this.currentTrajectory[pointIndex];
            
            if (targetPoint) {
                this.asteroid.position.copy(targetPoint);
                const scale = 1 + eased * 1.5;
                this.asteroid.scale.set(scale, scale, scale);
            }
        }
        
        if (progress >= 1) {
            this.isAnimating = false;
            
            if (!this.animationDeflected) {
                this.asteroid.visible = false;
                setTimeout(() => {
                    this.resetAsteroid();
                }, 1000);
            }
        }
    }
    
    animateTrajectory(deflected) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animationDeflected = deflected;
        this.animationStartTime = Date.now();
        
        this.updateTrajectory(deflected);
        
        this.asteroid.position.copy(this.currentTrajectory[0]);
        this.asteroid.visible = true;
        this.asteroid.scale.set(1, 1, 1);
    }
    
    resetAsteroid() {
        this.asteroid.position.set(120, 90, -180);
        this.asteroid.visible = true;
        this.asteroid.scale.set(1, 1, 1);
        
        this.updateTrajectory(false);
    }
    
    setupResizeHandler() {
        const container = document.querySelector('.three-container');
        
        window.addEventListener('resize', () => {
            const width = container.clientWidth;
            const height = container.clientHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        });
    }
    
    updateAsteroidSize() {
        if (this.asteroid) {
            const scale = Math.max(0.1, this.simulator.state.diameter / 100);
            this.asteroid.scale.set(scale, scale, scale);
        }
    }
}