import * as THREE from 'three';

/** Colores de las "emociones" que orbitan el núcleo (tonos suaves, acordes a la paleta de bienestar). */
export const EMOCIONES = [
  { nombre: 'alegría', color: 0xd6a675 },
  { nombre: 'calma', color: 0x7fae9c },
  { nombre: 'tristeza', color: 0x6f8fa3 },
  { nombre: 'ansiedad', color: 0x9b8fb0 },
  { nombre: 'ira', color: 0xc07c6a },
];

/** Paleta de la escena: verde petróleo, verde salvia y dorado suave sobre blanco cálido. */
const COLOR_FONDO = 0xf8f7f3;
const COLOR_RED = 0x246b68;
const COLORES_ANILLOS = [0x246b68, 0x7fae9c, 0xd6a675];
const COLOR_PARTICULAS = 0x3d8a86;

/** Posiciones aleatorias en una cáscara esférica (Float32Array xyz). */
export function crearParticulas(cantidad, radioMin, radioMax, rand = Math.random) {
  const pos = new Float32Array(cantidad * 3);
  for (let i = 0; i < cantidad; i++) {
    const r = radioMin + (radioMax - radioMin) * rand();
    const theta = 2 * Math.PI * rand();
    const phi = Math.acos(2 * rand() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i * 3 + 2] = r * Math.cos(phi);
  }
  return pos;
}

export function soportaWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch {
    return false;
  }
}

const vertexShader = /* glsl */ `
  uniform float uTiempo;
  uniform float uPulso;
  varying vec3 vNormal;
  varying float vOnda;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    float onda = sin(position.x * 2.6 + uTiempo * 1.3) * sin(position.y * 3.1 + uTiempo * 0.9)
               + sin(position.z * 2.2 + uTiempo * 1.7) * 0.6;
    vOnda = onda;
    vec3 p = position + normal * onda * (0.12 + uPulso * 0.08);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTiempo;
  varying vec3 vNormal;
  varying float vOnda;
  void main() {
    vec3 petroleo = vec3(0.14, 0.42, 0.41);
    vec3 salvia = vec3(0.50, 0.68, 0.61);
    vec3 dorado = vec3(0.84, 0.65, 0.46);
    float mezcla = 0.5 + 0.5 * sin(vOnda * 1.8 + uTiempo * 0.6);
    vec3 color = mix(petroleo, salvia, mezcla);
    color = mix(color, dorado, smoothstep(0.7, 1.4, vOnda) * 0.45);
    float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.4);
    color = mix(color, vec3(0.97, 0.97, 0.95), fresnel * 0.55);
    gl_FragColor = vec4(color, 0.9);
  }
`;

/**
 * Monta la escena 3D del login: núcleo emocional deformable, malla de "red neuronal",
 * anillos, partículas y emociones en órbita. Devuelve una función de limpieza.
 */
export function montarEscena(contenedor, { reducirMovimiento = false } = {}) {
  const ancho = () => contenedor.clientWidth || window.innerWidth;
  const alto = () => contenedor.clientHeight || window.innerHeight;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(ancho(), alto());
  contenedor.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  escena.fog = new THREE.FogExp2(COLOR_FONDO, 0.045);
  const camara = new THREE.PerspectiveCamera(55, ancho() / alto(), 0.1, 100);
  camara.position.set(0, 0, 7);

  const grupo = new THREE.Group();
  grupo.position.x = ancho() > 900 ? -2.2 : 0;
  escena.add(grupo);

  // Núcleo emocional
  const uniforms = { uTiempo: { value: 0 }, uPulso: { value: 0 } };
  const nucleo = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.5, 48),
    new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true }),
  );
  grupo.add(nucleo);

  // Malla exterior tipo red neuronal
  const red = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(2.1, 2)),
    new THREE.LineBasicMaterial({ color: COLOR_RED, transparent: true, opacity: 0.16 }),
  );
  grupo.add(red);

  // Anillos orbitales
  const anillos = COLORES_ANILLOS.map((color, i) => {
    const anillo = new THREE.Mesh(
      new THREE.TorusGeometry(2.6 + i * 0.45, 0.012, 8, 160),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45 }),
    );
    anillo.rotation.set(Math.PI / 2 + i * 0.5, i * 0.7, 0);
    grupo.add(anillo);
    return anillo;
  });

  // Emociones en órbita
  const orbitas = EMOCIONES.map((emocion, i) => {
    const esfera = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 24, 24),
      new THREE.MeshBasicMaterial({ color: emocion.color }),
    );
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.26, 24, 24),
      new THREE.MeshBasicMaterial({ color: emocion.color, transparent: true, opacity: 0.2 }),
    );
    esfera.add(halo);
    grupo.add(esfera);
    return { esfera, radio: 2.7 + (i % 3) * 0.4, velocidad: 0.25 + i * 0.07, fase: (i / EMOCIONES.length) * Math.PI * 2, inclinacion: 0.4 + i * 0.25 };
  });

  // Partículas suaves
  const geoParticulas = new THREE.BufferGeometry();
  geoParticulas.setAttribute('position', new THREE.BufferAttribute(crearParticulas(1800, 4, 18), 3));
  const particulas = new THREE.Points(
    geoParticulas,
    new THREE.PointsMaterial({ color: COLOR_PARTICULAS, size: 0.04, transparent: true, opacity: 0.35, depthWrite: false }),
  );
  escena.add(particulas);

  // Paralaje con el mouse
  const mouse = { x: 0, y: 0 };
  const alMover = (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  const alRedimensionar = () => {
    camara.aspect = ancho() / alto();
    camara.updateProjectionMatrix();
    renderer.setSize(ancho(), alto());
    grupo.position.x = ancho() > 900 ? -2.2 : 0;
  };
  window.addEventListener('pointermove', alMover);
  window.addEventListener('resize', alRedimensionar);

  const reloj = new THREE.Clock();
  const factor = reducirMovimiento ? 0.25 : 1;
  let animacion;

  const animar = () => {
    const t = reloj.getElapsedTime() * factor;
    uniforms.uTiempo.value = t;
    uniforms.uPulso.value = 0.5 + 0.5 * Math.sin(t * 2.2); // "latido"
    nucleo.rotation.y = t * 0.25;
    nucleo.rotation.x = Math.sin(t * 0.3) * 0.3;
    red.rotation.y = -t * 0.12;
    red.rotation.z = t * 0.05;
    anillos.forEach((a, i) => { a.rotation.z = t * (0.15 + i * 0.08) * (i % 2 ? -1 : 1); });
    orbitas.forEach((o) => {
      const ang = t * o.velocidad + o.fase;
      o.esfera.position.set(Math.cos(ang) * o.radio, Math.sin(ang * 1.3) * o.inclinacion, Math.sin(ang) * o.radio);
    });
    particulas.rotation.y = t * 0.02;
    camara.position.x += (mouse.x * 0.8 - camara.position.x) * 0.04;
    camara.position.y += (-mouse.y * 0.5 - camara.position.y) * 0.04;
    camara.lookAt(grupo.position.x * 0.4, 0, 0);
    renderer.render(escena, camara);
    animacion = requestAnimationFrame(animar);
  };
  animar();

  return () => {
    cancelAnimationFrame(animacion);
    window.removeEventListener('pointermove', alMover);
    window.removeEventListener('resize', alRedimensionar);
    escena.traverse((obj) => {
      obj.geometry?.dispose();
      obj.material?.dispose?.();
    });
    renderer.dispose();
    renderer.domElement.remove();
  };
}
