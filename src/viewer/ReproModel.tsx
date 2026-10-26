import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useLab } from '../app/LabContext';
import { effectiveCloseUp, effectiveColourBy, effectiveMode, effectiveSlice, effectiveTint, focusIds, highlightedIds, isVisible } from '../app/state';
import type { AnatomicalStructure, Body } from '../contract/schema';
import { femaleAnchors, modeBounds, sliceWorld } from '../repro/anchors';
import type { Live } from '../repro/live';
import { baseColour, cutColour, GLOW, HIGHLIGHT, HOVER, lobules, realLook, realOpacity } from './palette';
import { closeHoles } from './closeHoles';
import { applyQuality, hasTissueData, makeTissueMaterial, quality, type TissueMaterial } from './tissue';

export const modelUrl = (body: Body) => `${import.meta.env.BASE_URL}models/${body}.glb`;

const GREY = new THREE.Color('#a59a96');
const HIGHLIGHT_COLOUR = new THREE.Color(HIGHLIGHT);
const GLOW_COLOUR = new THREE.Color(GLOW);
const BLEED_COLOUR = new THREE.Color('#6a0a18');

/** Pointer travel (px) above which a press is treated as a drag (rotate), not a pick. */
const CLICK_SLOP = 5;

/** The cut shared with the label layer and the overlays, so hits on the removed side can be ignored. */
export const clip = { plane: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), active: false };

interface Cap { back: THREE.Mesh; front: THREE.Mesh; face: THREE.Mesh; material: THREE.MeshStandardMaterial; closed: THREE.BufferGeometry }
/** A part of the model. Its cut cap is built the first time a cut crosses it (closing a mesh is costly). */
interface Part { id: string; mesh: THREE.Mesh; material: TissueMaterial; structure: AnatomicalStructure; box: THREE.Box3; cap: Cap | null; order: number; capSize: number; capTint: THREE.Color }

/** Cut-face grain: one tile of the noise texture spans this many metres. */
const GRAIN_TILE = 0.01;
let grain: THREE.DataTexture | null = null;
/** A soft, tileable value-noise texture (deterministic) that gives cut faces a tissue grain. */
function grainTexture(): THREE.DataTexture {
  if (grain) return grain;
  const n = 128;
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const octave = (cells: number) => {
    const lattice = Array.from({ length: cells * cells }, rand);
    const at = (x: number, y: number) => lattice[(y % cells) * cells + (x % cells)]!;
    const step = n / cells;
    return (x: number, y: number) => {
      const gx = Math.floor(x / step), gy = Math.floor(y / step);
      const fx = smooth((x % step) / step), fy = smooth((y % step) / step);
      const top = at(gx, gy) * (1 - fx) + at(gx + 1, gy) * fx;
      const bottom = at(gx, gy + 1) * (1 - fx) + at(gx + 1, gy + 1) * fx;
      return top * (1 - fy) + bottom * fy;
    };
  };
  const coarse = octave(8), medium = octave(16), fine = octave(32);
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const v = 0.84 + 0.08 * coarse(x, y) + 0.05 * medium(x, y) + 0.03 * fine(x, y);
    data.set([v * 255, v * 255, v * 255, 255], (y * n + x) * 4);
  }
  grain = new THREE.DataTexture(data, n, n);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.magFilter = THREE.LinearFilter;
  grain.minFilter = THREE.LinearMipmapLinearFilter;
  grain.generateMipmaps = true;
  grain.colorSpace = THREE.SRGBColorSpace;
  grain.needsUpdate = true;
  return grain;
}

/**
 * Stencil capping (as in three.js' clipping-stencil example): back faces behind the cut add 1 and
 * front faces subtract 1, so the stencil is non-zero exactly where the cut passes through the
 * inside of a closed mesh. The face drawn there is the filled cut surface, in the tissue's colour.
 * The stencil passes use a closed copy of the part (`closeHoles`); a part with a morph target
 * shares the visible mesh's morph weights, so its cap follows its shape.
 */
function makeCap(source: THREE.Mesh, plane: THREE.Plane, order: number, colour: string, size: number): Cap {
  const stencilMat = (side: THREE.Side, op: THREE.StencilOp) => new THREE.MeshBasicMaterial({
    side, colorWrite: false, depthWrite: false, depthTest: false,
    stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc,
    stencilFail: op, stencilZFail: op, stencilZPass: op,
    clippingPlanes: [plane],
  });
  const closed = closeHoles(source.geometry);
  const back = new THREE.Mesh(closed, stencilMat(THREE.BackSide, THREE.IncrementWrapStencilOp));
  const front = new THREE.Mesh(closed, stencilMat(THREE.FrontSide, THREE.DecrementWrapStencilOp));
  if (closed.morphAttributes.position && source.morphTargetInfluences) back.morphTargetInfluences = front.morphTargetInfluences = source.morphTargetInfluences;
  back.renderOrder = front.renderOrder = order;
  const map = grainTexture().clone();
  map.repeat.setScalar(Math.max(1, size / GRAIN_TILE));
  const material = new THREE.MeshStandardMaterial({
    color: colour, map, roughness: 0.5, metalness: 0, side: THREE.DoubleSide,
    stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc,
    stencilFail: THREE.ReplaceStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp,
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  face.renderOrder = order + 0.1;
  for (const m of [back, front, face]) {
    m.visible = false;
    m.raycast = () => {}; // never pickable
    m.matrixAutoUpdate = false;
  }
  return { back, front, face, material, closed };
}

/** A fine cell pattern in the colour: the bumpy ovary surface, glandular lobes, the prostate. */
function makeLobuleMaterial(material: TissueMaterial, scale: number, depth: number, key: string) {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prev.call(material, shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLobPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLobPos = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLobPos;')
      .replace('#include <color_fragment>', [
        '#include <color_fragment>',
        '{',
        // Two sheared sine lattices make rounded cells separated by darker seams (no loops or
        // hashes, which some GPU compilers warn about).
        `  vec3 p = vLobPos * ${scale.toFixed(1)};`,
        '  vec3 q = p + 0.6 * sin(p.yzx * 0.37 + 1.7);',
        '  float a = abs(sin(q.x) * sin(q.y) * sin(q.z));',
        '  float b = abs(sin(q.x * 0.71 + q.z * 0.7 + 2.3) * sin(q.y * 0.69 - q.x * 0.7 + 0.4) * sin(q.z * 0.7 + q.y * 0.71 + 1.1));',
        `  diffuseColor.rgb *= 1.0 - ${depth.toFixed(2)} * (1.0 - smoothstep(0.02, 0.35, max(a, b)));`,
        '}',
      ].join('\n'));
  };
  material.customProgramCacheKey = () => `tissue-lobule-${key}${material.defines?.USE_TISSUE !== undefined ? '-baked' : ''}`;
}

/** Female parts that move with the growing uterus (the tubes and ovaries rise with the cornua). */
const MOVES_LEFT = ['tube-isthmus-left', 'tube-ampulla-left', 'tube-infundibulum-left', 'tube-fimbriae-left', 'ovary-left', 'mesosalpinx-left', 'mesovarium-left'];
const MOVES_RIGHT = MOVES_LEFT.map((id) => id.replace('-left', '-right'));

export function ReproModel({ onReady, view }: { onReady?: () => void; view: Live }) {
  const { def, state, dispatch } = useLab();
  const gltf = useGLTF(modelUrl(def.body));
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  // Shaders compiled for every part (see below), so changing view never stalls on compiling.
  const [warm, setWarm] = useState(false);
  const mode = effectiveMode(def, state);
  const close = effectiveCloseUp(def, state);
  const bounds = useMemo(() => modeBounds(def, mode), [def, mode]);

  const parts = useMemo(() => {
    const out = new Map<string, Part>();
    gltf.scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      const id = o.name || o.parent?.name || '';
      const s = def.structures.find((x) => x.id === id);
      if (!s) return;
      const material = makeTissueMaterial(realLook(s), hasTissueData(o));
      material.clippingPlanes = [clip.plane];
      const lob = lobules(s);
      if (lob) makeLobuleMaterial(material, lob.scale, lob.depth, s.layer);
      o.geometry.computeBoundingBox();
      const box = o.geometry.boundingBox!.clone();
      // A morphing part's box must hold its full range of shapes.
      const morph = o.geometry.morphAttributes.position?.[0];
      if (morph) { const v = new THREE.Vector3(); const pos = o.geometry.getAttribute('position'); for (let i = 0; i < pos.count; i++) box.expandByPoint(v.fromBufferAttribute(pos, i).add(new THREE.Vector3().fromBufferAttribute(morph, i))); }
      const capSize = box.getSize(new THREE.Vector3()).length() * 1.05;
      out.set(id, { id, mesh: o, material, structure: s, box, cap: null, order: 0, capSize, capTint: new THREE.Color(cutColour(s)) });
    });
    // Large structures first, so smaller ones inside them draw their caps last.
    const sorted = [...out.values()].sort((a, b) => b.box.getSize(new THREE.Vector3()).lengthSq() - a.box.getSize(new THREE.Vector3()).lengthSq());
    sorted.forEach((p, i) => { p.order = 10 + i * 2; });
    return out;
  }, [gltf, def]);

  // Attach materials in an effect, not in useMemo: StrictMode may run the memo twice, and the
  // meshes must carry the materials this component actually updates. Dispose them on unmount.
  useLayoutEffect(() => {
    for (const p of parts.values()) {
      p.mesh.material = p.material;
      p.mesh.userData.structureId = p.id;
    }
    // Compile every part's shader once, with all parts shown, before the model counts as ready.
    let live = true;
    for (const p of parts.values()) p.mesh.visible = true;
    gl.compileAsync(gltf.scene, camera).catch(() => {}).finally(() => {
      if (!live) return;
      setWarm(true);
      onReady?.();
      invalidate();
    });
    return () => parts.forEach((p) => {
      live = false;
      p.material.dispose();
      const c = p.cap;
      if (c) {
        c.material.map?.dispose();
        c.material.dispose();
        if (c.closed !== p.mesh.geometry) c.closed.dispose();
        (c.back.material as THREE.Material).dispose();
        (c.front.material as THREE.Material).dispose();
        c.face.geometry.dispose();
        gltf.scene.remove(c.back, c.front, c.face);
        p.cap = null;
      }
      p.mesh.scale.setScalar(1); p.mesh.position.set(0, 0, 0);
      if (p.mesh.morphTargetInfluences) p.mesh.morphTargetInfluences[0] = 0;
    });
  }, [parts, onReady, gltf, gl, camera, invalidate]);

  // Follow quality changes (a slow device drops the costly coat and sheen).
  useEffect(() => quality.subscribe((level) => {
    for (const p of parts.values()) { applyQuality(p.material, level); p.material.needsUpdate = true; }
    invalidate();
  }), [parts, invalidate]);

  const focus = focusIds(def, state);
  const tint = effectiveTint(def, state);
  const lit = tint ? highlightedIds(def, focus) : new Set<string>();
  const colourBy = effectiveColourBy(def, state);
  const slice = effectiveSlice(def, state);

  // The cut plane: keeps the side where n·p + c ≥ 0. The plane stays attached to every material
  // (parked far outside the model when there is no cut), so turning a cut on or off never
  // recompiles the tissue shaders.
  useEffect(() => {
    const a = slice.axis;
    clip.active = a !== 'off';
    if (clip.active) {
      const ax = a === 'sagittal' ? 0 : a === 'axial' ? 1 : 2;
      const at = sliceWorld(bounds, ax, slice.at);
      const n = new THREE.Vector3();
      n.setComponent(ax, slice.flip ? 1 : -1);
      clip.plane.set(n, slice.flip ? -at : at);
    } else {
      clip.plane.set(new THREE.Vector3(-1, 0, 0), 100);
    }
    invalidate();
  }, [slice.axis, slice.at, slice.flip, bounds, invalidate]);

  // Shape changes: the lining's thickness, the growing uterus, the placenta and the parts that rise with it.
  useEffect(() => {
    const endo = parts.get('endometrium');
    if (endo?.mesh.morphTargetInfluences) endo.mesh.morphTargetInfluences[0] = view.endometrium;
    const gu = parts.get('gravid-uterus');
    const pregnant = mode === 'pregnancy' || mode === 'birth';
    const g = pregnant ? view.gravid : 0;
    if (gu?.mesh.morphTargetInfluences) gu.mesh.morphTargetInfluences[0] = g;
    if (def.body === 'female') {
      const pf = femaleAnchors().pregnancy;
      const term = new THREE.Vector3(...pf.termAnchor), base = new THREE.Vector3(...pf.baseAnchor);
      const anchor = base.clone().lerp(term, g);
      const s = pregnant ? Math.max(0.001, view.placentaScale) : 1;
      // p' = anchor + s (p − term): the term-placed placenta scaled about its wall point and carried with the wall.
      const offset = anchor.clone().addScaledVector(term, -s);
      for (const p of parts.values()) {
        if (p.structure.layer === 'pregnancy' && p.id !== 'gravid-uterus') {
          p.mesh.scale.setScalar(s); p.mesh.position.copy(offset); p.mesh.updateMatrix();
        }
      }
      const shiftL = new THREE.Vector3(...pf.cornuShiftLeft).multiplyScalar(g), shiftR = new THREE.Vector3(...pf.cornuShiftRight).multiplyScalar(g);
      for (const id of MOVES_LEFT) { const p = parts.get(id); if (p) { p.mesh.position.copy(shiftL); p.mesh.updateMatrix(); } }
      for (const id of MOVES_RIGHT) { const p = parts.get(id); if (p) { p.mesh.position.copy(shiftR); p.mesh.updateMatrix(); } }
    }
    invalidate();
  }, [parts, view.endometrium, view.gravid, view.placentaScale, mode, def.body, invalidate]);

  useEffect(() => {
    const showGlow = mode !== 'explore';
    for (const p of parts.values()) {
      const s = p.structure;
      p.mesh.visible = isVisible(def, state, p.id) && !(s.layer === 'pregnancy' && p.id !== 'gravid-uterus' && (mode === 'pregnancy' || mode === 'birth') && view.placentaScale < 0.05);
      const isLit = lit.has(p.id);
      const isHover = state.hovered === p.id && !isLit;
      const dim = lit.size > 0 && !isLit;
      const painted = colourBy !== 'real';
      const glow = showGlow ? Math.min(2, view.activity[p.id] ?? 0) : 0;
      p.material.color.set(baseColour(s, colourBy));
      if (p.id === 'endometrium' && view.bleeding && !painted) p.material.color.lerp(BLEED_COLOUR, 0.55);
      if (p.id.startsWith('corpus-cavernosum') && view.erection > 0 && !painted) p.material.color.lerp(BLEED_COLOUR, 0.35 * view.erection);
      if (isLit && !painted) p.material.color.lerp(HIGHLIGHT_COLOUR, 0.35);
      else if (dim && glow === 0) p.material.color.lerp(GREY, 0.45);
      if (glow > 0) { p.material.emissive.copy(GLOW_COLOUR); p.material.emissiveIntensity = 0.08 + 0.32 * (glow / 2); }
      else if (isLit) { p.material.emissive.copy(painted ? p.material.color : HIGHLIGHT_COLOUR); p.material.emissiveIntensity = painted ? 0.22 : 0.3; }
      else { p.material.emissive.set(isHover ? HOVER : '#000000'); p.material.emissiveIntensity = isHover ? 0.3 : 0; }

      let opacity = realOpacity(s, def.body, mode);
      if (dim && opacity < 1) opacity *= 0.6;
      const transparent = opacity < 1;
      // Changing `transparent` changes the shader program; only flag an update when it flips.
      if (p.material.transparent !== transparent) p.material.needsUpdate = true;
      p.material.transparent = transparent;
      p.material.opacity = opacity;
      p.material.depthWrite = !transparent;
      p.mesh.renderOrder = transparent ? 2 : 0;

      p.capTint.set(colourBy !== 'real' ? baseColour(s, colourBy) : cutColour(s));
      if (isLit) p.capTint.lerp(HIGHLIGHT_COLOUR, 0.3);
      else if (dim) p.capTint.lerp(GREY, 0.35);
      p.cap?.material.color.copy(p.capTint);
    }
    invalidate();
  }, [parts, def, state, lit, colourBy, mode, close, view, warm, invalidate]);

  // Keep each cap on the plane, just large enough to cover the part's footprint, and show it only
  // where the plane crosses a solid part.
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const size = useMemo(() => new THREE.Vector3(), []);
  const worldBox = useMemo(() => new THREE.Box3(), []);
  useFrame(() => {
    for (const p of parts.values()) {
      const solid = p.mesh.visible && !p.material.transparent;
      p.mesh.updateMatrix();
      worldBox.copy(p.box).applyMatrix4(p.mesh.matrix);
      const show = clip.active && solid && clip.plane.intersectsBox(worldBox);
      if (show && !p.cap) {
        const c = makeCap(p.mesh, clip.plane, p.order, `#${p.capTint.getHexString()}`, p.capSize);
        c.face.renderOrder = p.order + 1;
        gltf.scene.add(c.back, c.front, c.face);
        p.cap = c;
      }
      const c = p.cap;
      if (!c) continue;
      c.back.visible = c.front.visible = c.face.visible = show;
      if (show) {
        c.back.matrix.copy(p.mesh.matrix);
        c.front.matrix.copy(p.mesh.matrix);
        clip.plane.projectPoint(worldBox.getCenter(tmp), tmp);
        c.face.position.copy(tmp);
        c.face.lookAt(tmp.x - clip.plane.normal.x, tmp.y - clip.plane.normal.y, tmp.z - clip.plane.normal.z);
        c.face.scale.setScalar(worldBox.getSize(size).length() * 1.05);
        c.face.updateMatrix();
      }
    }
  });

  /** Ignore hits on the part of the model the cut has removed. */
  const removed = (e: ThreeEvent<PointerEvent | MouseEvent>) => clip.active && clip.plane.distanceToPoint(e.point) < 0;
  const pick = (e: ThreeEvent<MouseEvent>) => {
    const id = e.object.userData.structureId as string | undefined;
    if (!id || !e.object.visible || removed(e)) return; // let the event reach the next hit
    const m = (e.object as THREE.Mesh).material as THREE.Material;
    if (m.transparent && m.opacity < 0.3) return; // ghosted parts are see-through to clicks
    e.stopPropagation();
    if (e.delta > CLICK_SLOP) return;
    dispatch({ type: 'select', id });
  };
  const over = (e: ThreeEvent<PointerEvent>) => {
    const id = e.object.userData.structureId as string | undefined;
    if (!id || !e.object.visible || removed(e)) return;
    const m = (e.object as THREE.Mesh).material as THREE.Material;
    if (m.transparent && m.opacity < 0.3) return;
    e.stopPropagation();
    dispatch({ type: 'hover', id });
    document.body.style.cursor = 'pointer';
  };
  const out = (e: ThreeEvent<PointerEvent>) => {
    if (e.object.userData.structureId === state.hovered) dispatch({ type: 'hover', id: null });
    document.body.style.cursor = '';
  };

  return <primitive object={gltf.scene} onClick={pick} onPointerOver={over} onPointerOut={out} />;
}
