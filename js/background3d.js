
document.addEventListener('DOMContentLoaded', () => {
    // Scene setup
    const scene = new THREE.Scene();

    // Soft fog - reduced density for vibrancy
    scene.fog = new THREE.FogExp2(0xffffff, 0.001);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Style the canvas
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-1';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    document.body.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); // Very strong ambient light
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5); // Extremely strong directional light
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5); // Strong fill light
    fillLight.position.set(-10, 0, -10);
    scene.add(fillLight);

    // Geometry Group
    const group = new THREE.Group();
    scene.add(group);

    // Shape Generators
    function createHeartShape() {
        const x = 0, y = 0;
        const heartShape = new THREE.Shape();
        heartShape.moveTo(x + 0.5, y + 0.5);
        heartShape.bezierCurveTo(x + 0.5, y + 0.5, x + 0.4, y, x, y);
        heartShape.bezierCurveTo(x - 0.6, y, x - 0.6, y + 0.7, x - 0.6, y + 0.7);
        heartShape.bezierCurveTo(x - 0.6, y + 1.1, x - 0.3, y + 1.54, x + 0.5, y + 1.9);
        heartShape.bezierCurveTo(x + 1.2, y + 1.54, x + 1.6, y + 1.1, x + 1.6, y + 0.7);
        heartShape.bezierCurveTo(x + 1.6, y + 0.7, x + 1.6, y, x + 1.0, y);
        heartShape.bezierCurveTo(x + 0.7, y, x + 0.5, y + 0.5, x + 0.5, y + 0.5);
        return heartShape;
    }

    // Geometries
    const sphereGeo = new THREE.SphereGeometry(0.5, 64, 64); // Smoother sphere
    const torusGeo = new THREE.TorusGeometry(0.4, 0.2, 30, 100); // Fatter, smoother torus

    // Capsule - very round
    const capsuleGeo = new THREE.CapsuleGeometry(0.3, 0.6, 8, 16);

    // TorusKnot - round & complex
    const torusKnotGeo = new THREE.TorusKnotGeometry(0.3, 0.1, 100, 16);

    const heartShape = createHeartShape();
    // Puffy Heart: Increased bevel thickness and size
    const heartGeo = new THREE.ExtrudeGeometry(heartShape, { depth: 0.3, bevelEnabled: true, bevelSegments: 5, steps: 2, bevelSize: 0.1, bevelThickness: 0.1 });
    heartGeo.center();

    const geometries = [sphereGeo, torusGeo, capsuleGeo, torusKnotGeo, heartGeo];

    // Colors (Mid-tone Pastels - slightly stronger than "Soft")
    const colors = [
        0xFF99CC, // Pink
        0xFFEE88, // Yellow
        0x88FFCC, // Mint
        0xDD99DD  // Purple
    ];

    for (let i = 0; i < 25; i++) { // Slightly increased count back to 25
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const material = new THREE.MeshPhongMaterial({
            color: color,
            flatShading: false,
            shininess: 150, // Ultra shiny
            transparent: true,
            opacity: 0.9, // Higher opacity to color against strong light
            depthWrite: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = (Math.random() - 0.5) * 25;
        mesh.position.y = (Math.random() - 0.5) * 25;
        mesh.position.z = (Math.random() - 0.5) * 20;

        mesh.rotation.x = Math.random() * 2 * Math.PI;
        mesh.rotation.y = Math.random() * 2 * Math.PI;

        // Large scale (Motif size reduced slightly)
        const scale = 2.0 + Math.random() * 2.0; // Reduced: 2.0 to 4.0
        mesh.scale.set(scale, scale, scale);

        group.add(mesh);
    }

    camera.position.z = 10;

    // Animation variables
    let scrollY = window.scrollY;

    // Handle scroll
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });

    // Handle resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        // Constant slow rotation
        group.rotation.x += 0.0005;
        group.rotation.y += 0.001;

        // Individual object rotation
        group.children.forEach(child => {
            child.rotation.x += 0.005;
            child.rotation.y += 0.005;
        });

        // Scroll based rotation influence
        const targetRotation = scrollY * 0.0005;
        group.rotation.z = targetRotation;

        renderer.render(scene, camera);
    }

    animate();
});
