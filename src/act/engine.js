import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const ASSET_ROOT = `${import.meta.env?.BASE_URL ?? '/'}assets/models/kenney-space-kit/`;
const ASSET_FILES = {
  player: 'craft_speederA.glb',
  enemy: 'alien.glb',
  invaderA: 'astronautA.glb',
  invaderB: 'astronautB.glb',
  asteroidA: 'rock_crystalsLargeA.glb',
  asteroidB: 'rock_largeA.glb',
  asteroidC: 'rock_largeB.glb',
  meteor: 'meteor_detailed.glb',
  rock: 'rock.glb',
  crystals: 'rock_crystals.glb',
  platform: 'platform_large.glb',
  terrain: 'terrain.glb',
};
const VIEW_HALF_HEIGHT = 12;
const TILT_SHIFT_SHADER = {
  uniforms: { tDiffuse: { value: null }, focusPoint: { value: new THREE.Vector2(0.5, 0.5) } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 focusPoint;
    varying vec2 vUv;
    void main() {
      float distanceFromFocus = distance(vUv, focusPoint);
      float edge = smoothstep(0.045, 0.43, distanceFromFocus);
      float blur = edge * 0.0017;
      vec4 color = texture2D(tDiffuse, vUv) * 0.36;
      color += texture2D(tDiffuse, vUv + vec2(0.0, blur)) * 0.16;
      color += texture2D(tDiffuse, vUv - vec2(0.0, blur)) * 0.16;
      color += texture2D(tDiffuse, vUv + vec2(blur, 0.0)) * 0.16;
      color += texture2D(tDiffuse, vUv - vec2(blur, 0.0)) * 0.16;
      float vignette = 1.0 - smoothstep(0.22, 0.88, length((vUv - 0.5) * vec2(0.82, 1.0)));
      color.rgb *= mix(0.88, 1.0, vignette);
      gl_FragColor = color;
    }
  `,
};

export function createCenteredActorRoot(source, targetSize = 1.5) {
  const actorRoot = new THREE.Group();
  actorRoot.name = `ACT actor root: ${source.name || 'asset'}`;

  // Keep normalization on the visual child. Gameplay owns the outer root's
  // world transform, which update loops are free to overwrite every frame.
  const visual = source.clone(true);
  visual.position.set(0, 0, 0);
  visual.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
    if (Array.isArray(child.material)) child.material = child.material.map((material) => material.clone());
    else if (child.material) child.material = child.material.clone();
  });

  const bounds = new THREE.Box3().setFromObject(visual);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const scaleFactor = targetSize / maxDimension;
  visual.scale.multiplyScalar(scaleFactor);
  visual.position.copy(center.multiplyScalar(-scaleFactor));
  actorRoot.add(visual);

  actorRoot.userData.footprintRadius = Math.hypot(size.x, size.z) * scaleFactor * 0.5;
  actorRoot.userData.forwardExtent = Math.max(0.05, (bounds.max.z - bounds.getCenter(new THREE.Vector3()).z) * scaleFactor);
  actorRoot.userData.normalizedBounds = {
    width: size.x * scaleFactor,
    depth: size.z * scaleFactor,
    height: size.y * scaleFactor,
  };
  return actorRoot;
}

export function createMirroredComposite(first, second) {
  second.scale.x *= -1;
  const composite = new THREE.Group();
  composite.name = `ACT mirrored composite: ${first.name || 'asset'}`;
  composite.add(first, second);
  const dimensions = first.userData.normalizedBounds;
  composite.userData.footprintRadius = dimensions
    ? Math.hypot(dimensions.width * 2, dimensions.depth) * 0.5
    : Math.max(first.userData.footprintRadius || 0, second.userData.footprintRadius || 0) * 1.5;
  composite.userData.forwardExtent = Math.max(
    first.userData.forwardExtent || 0,
    second.userData.forwardExtent || 0,
  );
  return composite;
}

export async function createEngine({ mount, onFrame, onResize, onLoading }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#171a1b');
  const camera = new THREE.OrthographicCamera(-16, 16, VIEW_HALF_HEIGHT, -VIEW_HALF_HEIGHT, 0.1, 100);
  // A restrained oblique angle (all axes nonzero) keeps the ground readable.
  camera.position.set(5, 52, 4);
  camera.up.set(0, 0, -1);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(renderer.domElement);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const tiltShiftPass = new ShaderPass(TILT_SHIFT_SHADER);
  composer.addPass(tiltShiftPass);
  composer.addPass(new OutputPass());

  scene.add(new THREE.HemisphereLight('#e9eddf', '#303438', 2.1));
  const keyLight = new THREE.DirectionalLight('#fff0d3', 2.7);
  keyLight.position.set(-5, 15, 7);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight('#b7d6e2', 1.1);
  fillLight.position.set(7, 10, -8);
  scene.add(fillLight);

  const resize = () => {
    const width = Math.max(1, mount.clientWidth);
    const height = Math.max(1, mount.clientHeight);
    const halfHeight = VIEW_HALF_HEIGHT;
    const aspect = width / height;
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    onResize?.({ halfWidth: halfHeight * aspect, halfHeight });
  };
  const observer = new ResizeObserver(resize);
  observer.observe(mount);
  resize();

  const loader = new GLTFLoader();
  const entries = Object.entries(ASSET_FILES);
  let loaded = 0;
  const models = {};
  await Promise.all(entries.map(async ([key, file]) => {
    const gltf = await loader.loadAsync(`${ASSET_ROOT}${file}`);
    models[key] = gltf.scene;
    loaded += 1;
    onLoading?.(loaded, entries.length);
  }));

  const clock = new THREE.Clock();
  let alive = true;
  let performanceMode = false;
  let previousVisibility = document.visibilityState;
  document.addEventListener('visibilitychange', () => {
    previousVisibility = document.visibilityState;
    clock.getDelta();
  });
  const animate = () => {
    if (!alive) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    if (document.visibilityState === 'visible' && previousVisibility === 'visible') onFrame(dt);
    previousVisibility = document.visibilityState;
    if (performanceMode) renderer.render(scene, camera);
    else composer.render();
  };
  renderer.setAnimationLoop(animate);

  return {
    scene,
    camera,
    renderer,
    models,
    bounds: { halfWidth: camera.right, halfHeight: VIEW_HALF_HEIGHT },
    makeModel(name, targetSize = 1.5) {
      const source = models[name];
      if (!source) throw new Error(`Missing local asset model: ${name}`);
      return createCenteredActorRoot(source, targetSize);
    },
    makeMirroredComposite(name, targetSize = 1.5) {
      const source = models[name];
      if (!source) throw new Error(`Missing local asset model: ${name}`);
      return createMirroredComposite(
        createCenteredActorRoot(source, targetSize),
        createCenteredActorRoot(source, targetSize),
      );
    },
    setFocusWorld(x, y, z) {
      const projected = new THREE.Vector3(x, y, z).project(camera);
      tiltShiftPass.uniforms.focusPoint.value.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);
    },
    setPerformanceMode(enabled) {
      performanceMode = Boolean(enabled);
      const pixelRatio = enabled ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.5);
      renderer.setPixelRatio(pixelRatio);
      composer.setPixelRatio(pixelRatio);
      tiltShiftPass.enabled = !performanceMode;
      renderer.setSize(mount.clientWidth, mount.clientHeight, false);
      composer.setSize(mount.clientWidth, mount.clientHeight);
    },
    dispose() {
      alive = false;
      observer.disconnect();
      renderer.setAnimationLoop(null);
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

export { THREE };
