import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useDice } from '../contexts/DiceContext';
import type { RolledDie } from '../lib/dice';

/**
 * Dadi 3D animati (three.js).
 * Il risultato è già stato deciso dal generatore crittografico dell'app: l'animazione fa rotolare
 * i dadi e li ferma con la faccia corrispondente rivolta verso l'alto, così ciò che si vede
 * coincide sempre con il valore registrato.
 */

const SUPPORTED = new Set([4, 6, 8, 10, 12, 20]);
const MAX_DICE = 14;
const DURATION = 1500; // ms di rotolamento
const HOLD = 900; // ms di permanenza sul tavolo dopo l'arresto

interface Face { normal: THREE.Vector3; center: THREE.Vector3; radius: number }

/** Trapezoedro pentagonale (d10) con facce a "aquilone" planari. */
function createD10Geometry(): { geometry: THREE.BufferGeometry; faces: Face[] } {
  const h = 0.105;
  const H = h * (1 + Math.cos(Math.PI / 5)) / (1 - Math.cos(Math.PI / 5));
  const ring = Array.from({ length: 10 }, (_, i) => new THREE.Vector3(Math.cos(i * Math.PI / 5), Math.sin(i * Math.PI / 5), i % 2 === 0 ? h : -h));
  const top = new THREE.Vector3(0, 0, H);
  const bottom = new THREE.Vector3(0, 0, -H);
  const positions: number[] = [];
  const faces: Face[] = [];
  const pushKite = (apex: THREE.Vector3, a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, flip: boolean) => {
    const tris = flip ? [[apex, c, b], [apex, b, a]] : [[apex, a, b], [apex, b, c]];
    tris.forEach(t => t.forEach(v => positions.push(v.x, v.y, v.z)));
    const center = new THREE.Vector3().add(apex).add(a).add(b).add(c).multiplyScalar(0.25);
    const normal = new THREE.Vector3().subVectors(a, apex).cross(new THREE.Vector3().subVectors(c, apex)).normalize();
    if (normal.dot(center) < 0) normal.negate();
    faces.push({ normal, center, radius: Math.min(...[apex, a, b, c].map(v => v.distanceTo(center))) });
  };
  for (let k = 0; k < 5; k++) {
    pushKite(top, ring[(2 * k) % 10], ring[(2 * k + 1) % 10], ring[(2 * k + 2) % 10], false);
    pushKite(bottom, ring[(2 * k + 1) % 10], ring[(2 * k + 2) % 10], ring[(2 * k + 3) % 10], true);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return { geometry, faces };
}

/** Raggruppa i triangoli di una geometria platonica in facce (stessa normale). */
function facesFromGeometry(geometry: THREE.BufferGeometry): Face[] {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = g.getAttribute('position');
  const groups = new Map<string, { normal: THREE.Vector3; points: THREE.Vector3[] }>();
  for (let i = 0; i < pos.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(pos, i);
    const b = new THREE.Vector3().fromBufferAttribute(pos, i + 1);
    const c = new THREE.Vector3().fromBufferAttribute(pos, i + 2);
    const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a)).normalize();
    const key = normal.toArray().map(v => v.toFixed(2)).join(',');
    const group = groups.get(key) || { normal, points: [] };
    group.points.push(a, b, c);
    groups.set(key, group);
  }
  return Array.from(groups.values()).map(({ normal, points }) => {
    const unique = points.filter((p, i) => points.findIndex(q => q.distanceTo(p) < 1e-4) === i);
    const center = unique.reduce((acc, p) => acc.add(p), new THREE.Vector3()).multiplyScalar(1 / unique.length);
    return { normal, center, radius: Math.min(...unique.map(p => p.distanceTo(center))) };
  });
}

const geometryCache = new Map<number, { geometry: THREE.BufferGeometry; faces: Face[] }>();
function getDieShape(sides: number) {
  const cached = geometryCache.get(sides);
  if (cached) return cached;
  let shape: { geometry: THREE.BufferGeometry; faces: Face[] };
  if (sides === 10) shape = createD10Geometry();
  else {
    const geometry = sides === 4 ? new THREE.TetrahedronGeometry(1.15)
      : sides === 6 ? new THREE.BoxGeometry(1.25, 1.25, 1.25).toNonIndexed()
        : sides === 8 ? new THREE.OctahedronGeometry(1.05)
          : sides === 12 ? new THREE.DodecahedronGeometry(1.05)
            : new THREE.IcosahedronGeometry(1.1);
    geometry.computeVertexNormals();
    shape = { geometry, faces: facesFromGeometry(geometry) };
  }
  geometryCache.set(sides, shape);
  return shape;
}

const labelCache = new Map<string, THREE.Texture>();
function labelTexture(text: string) {
  const cached = labelCache.get(text);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${text.length > 2 ? 54 : text.length > 1 ? 64 : 76}px "Roboto Condensed", Arial, sans-serif`;
  ctx.fillText(text, 64, 66);
  // Sottolineatura per distinguere 6 e 9
  if (text === '6' || text === '9') ctx.fillRect(44, 104, 40, 7);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  labelCache.set(text, texture);
  return texture;
}

/** Etichette delle facce: per il d10 dei decimi del d100 si usano 00–90. */
function faceLabels(sides: number, tens: boolean): string[] {
  if (sides === 10) return Array.from({ length: 10 }, (_, i) => (tens ? `${i}0`.padStart(2, '0') : `${i}`));
  return Array.from({ length: sides }, (_, i) => `${i + 1}`);
}

interface DieSpec { sides: number; label: string; dropped?: boolean; tens?: boolean }

/** Converte i risultati in dadi da mostrare (il d100 diventa due d10). */
function toSpecs(dice: RolledDie[]): DieSpec[] {
  const specs: DieSpec[] = [];
  dice.forEach(d => {
    if (d.sides === 100) {
      const units = d.value % 10;
      const tens = ((d.value - units) % 100) / 10;
      specs.push({ sides: 10, label: `${tens}0`.padStart(2, '0'), tens: true, dropped: d.dropped }, { sides: 10, label: `${units}`, dropped: d.dropped });
    } else if (SUPPORTED.has(d.sides)) {
      specs.push({ sides: d.sides, label: d.sides === 10 ? `${d.value % 10}` : `${d.value}`, dropped: d.dropped });
    }
  });
  return specs.slice(0, MAX_DICE);
}

function buildDie(spec: DieSpec, color: THREE.Color) {
  const { geometry, faces } = getDieShape(spec.sides);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.38, metalness: 0.15, flatShading: true, transparent: spec.dropped, opacity: spec.dropped ? 0.45 : 1 });
  const mesh = new THREE.Mesh(geometry, material);
  const labels = faceLabels(spec.sides, Boolean(spec.tens));
  let resultFace = faces[0];
  faces.forEach((face, i) => {
    const text = labels[i % labels.length];
    if (text === spec.label) resultFace = face;
    const size = Math.max(0.35, face.radius * (spec.sides === 4 ? 1.1 : spec.sides === 10 ? 1.25 : 1.35));
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({ map: labelTexture(text), transparent: true, depthWrite: false, opacity: spec.dropped ? 0.6 : 1 }),
    );
    plane.position.copy(face.center).addScaledVector(face.normal, 0.012);
    plane.lookAt(face.center.clone().add(face.normal.clone().multiplyScalar(2)));
    mesh.add(plane);
  });
  // Orientamento finale: faccia del risultato verso la camera (+Z) con rotazione casuale sul tavolo
  const finalQuat = new THREE.Quaternion().setFromUnitVectors(resultFace.normal.clone().normalize(), new THREE.Vector3(0, 0, 1));
  const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), (Math.random() - 0.5) * 0.9);
  finalQuat.premultiply(yaw);
  return { mesh, finalQuat };
}

export default function Dice3D() {
  const { animating, finishAnimation, reportDice3dFailure } = useDice();
  const mountRef = useRef<HTMLDivElement>(null);
  const [total, setTotal] = useState<{ id: string; value?: number; label: string } | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!animating || !mountRef.current) return;
    const entry = animating;
    const specs = toSpecs(entry.dice || []);
    if (specs.length === 0) { finishAnimation(entry.id); return; }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      if (!renderer.getContext() || renderer.getContext().isContextLost()) throw new Error('WebGL non disponibile');
    } catch {
      // WebGL non disponibile: si mostra solo il risultato nel vassoio
      reportDice3dFailure();
      finishAnimation(entry.id);
      return;
    }
    // Con "Riduci movimento" i dadi compaiono già al loro posto, senza volare né rotolare
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const duration = reduced ? 450 : DURATION;
    const mount = mountRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    mount.appendChild(renderer.domElement);
    setActive(true);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
    camera.position.set(0, 0, 24);
    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-4, 6, 12);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xff8a92, 0.5);
    rim.position.set(6, -4, 6);
    scene.add(rim);

    const accent = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#c8102e';
    const color = new THREE.Color(accent);
    const visibleH = 2 * Math.tan(THREE.MathUtils.degToRad(16)) * 24;
    const visibleW = visibleH * (width / height);
    const cols = Math.min(specs.length, Math.max(2, Math.floor(visibleW / 2.6)));
    const scale = Math.min(1.25, visibleW / (cols * 2.6));

    const dice = specs.map((spec, i) => {
      const { mesh, finalQuat } = buildDie(spec, color);
      mesh.scale.setScalar(scale);
      const row = Math.floor(i / cols);
      const col = i % cols;
      const rowCount = Math.min(cols, specs.length - row * cols);
      const target = new THREE.Vector3((col - (rowCount - 1) / 2) * 2.6 * scale + (Math.random() - 0.5) * 0.5, -row * 2.6 * scale + (Math.random() - 0.5) * 0.4, 0);
      // Partenza dall'angolo del vassoio (in basso a destra), con un po' di dispersione
      const start = reduced ? target.clone() : new THREE.Vector3(visibleW / 2 + 2 + Math.random() * 2, -visibleH / 2 - 1 - Math.random() * 2, 3);
      const axis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const spin = reduced ? 0.35 : Math.PI * (6 + Math.random() * 4);
      const delay = reduced ? 0 : i * 45;
      const shadow = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }));
      shadow.position.z = -1.2 * scale;
      scene.add(shadow);
      scene.add(mesh);
      return { mesh, shadow, finalQuat, target, start, axis, spin, delay };
    });

    const startTime = performance.now();
    let frame = 0;
    let stopped = false;
    let finished = false;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const tmpQ = new THREE.Quaternion();

    const animate = (now: number) => {
      if (stopped) return;
      const elapsed = now - startTime;
      dice.forEach(d => {
        const t = Math.min(1, Math.max(0, (elapsed - d.delay) / duration));
        const e = easeOut(t);
        d.mesh.position.lerpVectors(d.start, d.target, e);
        // Rimbalzi che si smorzano: l'altezza è resa con lo spostamento in Z (verso la camera)
        const bounce = reduced ? 0 : Math.abs(Math.sin(t * Math.PI * 3)) * Math.pow(1 - t, 2) * 3.5;
        d.mesh.position.z = bounce;
        tmpQ.setFromAxisAngle(d.axis, d.spin * (1 - e));
        d.mesh.quaternion.copy(d.finalQuat).multiply(tmpQ);
        d.shadow.position.x = d.mesh.position.x + 0.25;
        d.shadow.position.y = d.mesh.position.y - 0.25;
        d.shadow.scale.setScalar(scale * (0.95 - bounce * 0.08));
        (d.shadow.material as THREE.MeshBasicMaterial).opacity = 0.32 - bounce * 0.05;
      });
      renderer.render(scene, camera);
      const lastDelay = dice[dice.length - 1].delay;
      if (elapsed < duration + lastDelay) frame = requestAnimationFrame(animate);
      else {
        finished = true;
        setTotal({ id: entry.id, value: entry.total, label: entry.label });
        finishAnimation(entry.id);
        window.setTimeout(() => { if (!stopped) cleanup(); }, HOLD);
      }
    };
    frame = requestAnimationFrame(animate);

    const cleanup = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      dice.forEach(d => {
        (d.mesh.material as THREE.Material).dispose();
        d.mesh.children.forEach(c => { ((c as THREE.Mesh).material as THREE.Material).dispose(); (c as THREE.Mesh).geometry.dispose(); });
        d.shadow.geometry.dispose();
        (d.shadow.material as THREE.Material).dispose();
      });
      // Su iOS Safari i contesti WebGL sono pochi: va rilasciato esplicitamente, altrimenti dopo qualche tiro i dadi non compaiono più
      renderer.forceContextLoss();
      renderer.dispose();
      renderer.domElement.remove();
      setTotal(cur => (cur?.id === entry.id ? null : cur));
      if (!mount.querySelector('canvas')) setActive(false);
    };

    // Esc salta l'animazione
    const skip = (e: KeyboardEvent) => { if (e.key === 'Escape' && !stopped) { finishAnimation(entry.id); cleanup(); } };
    window.addEventListener('keydown', skip);
    return () => {
      window.removeEventListener('keydown', skip);
      // A fine corsa i dadi restano visibili per HOLD ms (li rimuove il timer); se arriva un nuovo tiro prima, si chiude subito
      if (!stopped && !finished) cleanup();
    };
  }, [animating, finishAnimation, reportDice3dFailure]);

  return (
    <div ref={mountRef} className="fixed inset-0 z-[90] pointer-events-none print:hidden" aria-hidden="true">
      <div className={`absolute inset-0 transition-opacity duration-300 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,.55),rgba(0,0,0,.25))] ${active ? 'opacity-100' : 'opacity-0'}`} />
      {total && total.value !== undefined && (
        <div className="absolute z-10 left-1/2 bottom-[14%] -translate-x-1/2 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-black/75 border border-white/15 px-6 py-3 text-white shadow-2xl">
            <div className="text-[11px] uppercase tracking-widest font-bold font-serif text-white/70 max-w-[70vw] truncate">{total.label}</div>
            <div className="text-5xl font-display font-black leading-none mt-1">{total.value}</div>
          </div>
        </div>
      )}
    </div>
  );
}
