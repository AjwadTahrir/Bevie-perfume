import {
  AddEquation,
  Color,
  CustomBlending,
  DirectionalLight,
  Group,
  MeshPhysicalMaterial,
  NeutralToneMapping,
  OneFactor,
  PMREMGenerator,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
  ZeroFactor,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/**
 * BOTTLE STAGE
 * One WebGL renderer for the whole collection. Its canvas is moved into
 * whichever card is being hovered and shows that bottle's GLB (public/models),
 * turning with the pointer. Nothing renders unless a bottle is on show or
 * easing back to rest, and only one bottle is ever drawn at a time.
 *
 * The camera is the Blender render camera (Cam_Label_ThreeQuarter, 85 mm,
 * 36 mm sensor fitted to the 2000 px height), converted from Blender's Z-up to
 * glTF's Y-up, with the same 1600x2000 -> 1336x1670 crop as the WebP renders,
 * so the live bottle lands exactly where the still one was.
 */

const CAMERA = {
  position: [0.23455, 0.08849, 0.19681],
  forward: [-0.75661, -0.15643, -0.63487],
  up: [-0.11984, 0.98769, -0.10055],
  fov: (2 * Math.atan(18 / 85) * 180) / Math.PI,
}
const FRAME = { width: 1600, height: 2000, crop: [131, 116, 1336, 1670] }
/** Height of the bottle's middle: it turns and tilts about this point. */
const PIVOT_Y = 0.048
const MAX_YAW = 0.42 // rad, about 24 degrees each way
const MAX_PITCH = 0.07

const base = import.meta.env.BASE_URL
let stage = null

function createStage() {
  let renderer
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  } catch {
    return null
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = SRGBColorSpace
  // Neutral keeps the label artwork's colours, as the stills do.
  renderer.toneMapping = NeutralToneMapping
  renderer.toneMappingExposure = 1
  renderer.domElement.className = 'bottle-gl-canvas'

  const scene = new Scene()
  const pmrem = new PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.45
  pmrem.dispose()

  // The Blender studio's area lights as directional lights (positions in Y-up).
  for (const [x, y, z, intensity] of [
    [-0.3, 0.24, 0.24, 2.4], // key softbox, front left
    [0.34, 0.1, 0.2, 0.7], // fill, front right
    [-0.15, 0.09, -0.15, 1.6], // rim left
    [0.15, 0.09, -0.15, 1.6], // rim right
    [0, 0.4, 0.16, 0.5], // top
  ]) {
    const light = new DirectionalLight(0xffffff, intensity)
    light.position.set(x, y, z)
    scene.add(light)
  }

  // Tight near/far around the bottle (camera ~0.31 m away): the label sits 0.03 mm
  // outside the glass, which a loose range cannot separate on 16-bit depth buffers.
  const camera = new PerspectiveCamera(CAMERA.fov, FRAME.width / FRAME.height, 0.15, 0.6)
  camera.position.fromArray(CAMERA.position)
  camera.up.fromArray(CAMERA.up)
  camera.lookAt(new Vector3().fromArray(CAMERA.position).add(new Vector3().fromArray(CAMERA.forward)))
  camera.setViewOffset(FRAME.width, FRAME.height, ...FRAME.crop)

  // pivot turns the bottle about its middle; the model hangs below it.
  const pivot = new Group()
  pivot.position.y = PIVOT_Y
  scene.add(pivot)

  const draco = new DRACOLoader().setDecoderPath(`${base}draco/`)
  const loader = new GLTFLoader().setDRACOLoader(draco)

  return { renderer, scene, camera, pivot, loader, models: new Map() }
}

/**
 * Glass edges: real glass on a light ground reads by its darker, refracting
 * rim. This layer darkens the surface as it turns away from the camera.
 */
const edgeMaterial = () =>
  new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { strength: { value: 0.5 } },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float strength;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.5);
        gl_FragColor = vec4(0.12, 0.12, 0.13, rim * strength);
      }`,
  })

/**
 * Real-time stand-ins for the Cycles glass and liquid. Transmission would
 * hide the liquid and label behind the glass in WebGL, so the glass is two
 * layers instead: a faint tint, and a copy that adds only its reflections
 * (black base, colour added, alpha left alone so the page shows through),
 * so highlights stay bright without clouding what is behind, plus a dark
 * edge layer (edgeMaterial). Label and cap keep the exported materials.
 */
function prepare(root) {
  const reflections = []
  root.traverse((o) => {
    if (!o.isMesh) return
    const name = o.material?.name ?? ''
    if (name.startsWith('M_Glass')) {
      o.material = new MeshPhysicalMaterial({
        color: new Color(0.97, 0.99, 0.98),
        roughness: 0.05,
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
      })
      o.renderOrder = 2
      const shine = o.clone()
      shine.material = new MeshPhysicalMaterial({
        color: 0x000000,
        roughness: 0.02,
        envMapIntensity: 6,
        blending: CustomBlending,
        blendEquation: AddEquation,
        blendSrc: OneFactor,
        blendDst: OneFactor,
        blendSrcAlpha: ZeroFactor,
        blendDstAlpha: OneFactor,
        transparent: true,
        depthWrite: false,
      })
      shine.renderOrder = 4
      const edge = o.clone()
      edge.material = edgeMaterial()
      edge.renderOrder = 3
      reflections.push([o.parent, edge], [o.parent, shine])
    } else if (name.startsWith('M_Perfume')) {
      o.material = new MeshPhysicalMaterial({
        color: new Color(0.9, 0.82, 0.5),
        roughness: 0.05,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
      o.renderOrder = 1
    }
  })
  for (const [parent, shine] of reflections) parent.add(shine)
  root.position.y = -PIVOT_Y
  return root
}

function loadModel(s, id) {
  if (!s.models.has(id)) {
    const p = s.loader.loadAsync(`${base}models/${id}.glb`).then((gltf) => prepare(gltf.scene))
    p.catch(() => s.models.delete(id))
    s.models.set(id, p)
  }
  return s.models.get(id)
}

// Shown bottle state: pointer target and eased current rotation.
const target = { yaw: 0, pitch: 0 }
const current = { yaw: 0, pitch: 0 }
let host = null
let shownId = null
let frame = 0
let token = 0
let onReady = null
/** Called when another viewer takes the canvas away from the current host. */
let onLost = null

window.addEventListener('resize', () => size())

function size() {
  if (!host || !stage) return
  const w = host.clientWidth
  const h = host.clientHeight
  if (w && h) stage.renderer.setSize(w, h, false)
}

function tick(time) {
  frame = 0
  if (!stage) return
  // A slow sway while on show, so the glass keeps catching the light.
  const sway = host ? Math.sin(time / 1400) * 0.05 : 0
  current.yaw += (target.yaw + sway - current.yaw) * 0.08
  current.pitch += (target.pitch - current.pitch) * 0.08
  stage.pivot.rotation.set(current.pitch, current.yaw, 0)
  stage.renderer.render(stage.scene, stage.camera)
  if (onReady) {
    onReady()
    onReady = null
  }
  const resting = Math.abs(current.yaw) < 0.002 && Math.abs(current.pitch) < 0.002
  if (host || !resting) frame = requestAnimationFrame(tick)
}

const kick = () => {
  if (!frame) frame = requestAnimationFrame(tick)
}

/** True once WebGL is available (creates the shared renderer on first call). */
export function supported() {
  if (stage === null) stage = createStage() ?? false
  return Boolean(stage)
}

/** Warm the cache for a bottle without showing it. */
export function preload(id) {
  if (supported()) loadModel(stage, id).catch(() => {})
}

/**
 * Show bottle `id` in `el` (a box with the render's 4:5 shape). `ready` is
 * called after the first frame is drawn, so the caller can crossfade from
 * the still image without a blank moment. `lost` is called if another
 * viewer (e.g. the detail view opening over a hovered card) takes the
 * canvas, so this one can fall back to its image.
 */
export async function show(el, id, ready, lost) {
  if (!supported()) return false
  const mine = ++token
  let model
  try {
    model = await loadModel(stage, id)
  } catch {
    return false
  }
  if (mine !== token) return false
  if (shownId !== id) {
    stage.pivot.clear()
    stage.pivot.add(model)
    shownId = id
    current.yaw = current.pitch = 0
  }
  if (host && host !== el) onLost?.()
  host = el
  onLost = lost
  el.appendChild(stage.renderer.domElement)
  size()
  onReady = ready
  kick()
  return true
}

/** Pointer position over the card, each axis -1..1. */
export function point(x, y) {
  target.yaw = x * MAX_YAW
  target.pitch = y * MAX_PITCH
  kick()
}

/** Ease back to the render's angle and stop drawing. */
export function hide(el) {
  if (el && host !== el) return
  token++
  host = null
  target.yaw = target.pitch = 0
  onReady = null
  onLost = null
  kick()
}
