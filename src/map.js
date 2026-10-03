import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { pieceStyle } from "./pieces.js";
import { getChapterJournalFocus } from "./story.js";

const palette = {
  ground: 0x40515b,
  wood: 0x302c29,
  trim: 0xc2a16b,
  gold: 0xe9b754,
};
function inPolygon(x, z, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, zi] = vertices[i],
      [xj, zj] = vertices[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi)
      inside = !inside;
  }
  return inside;
}
export function createMap(container, labelRoot, onSelect, onViewChange) {
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  let renderPending = false;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  container.appendChild(renderer.domElement);
  const camera = new THREE.OrthographicCamera(-22, 22, 22, -22, 0.1, 180);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.minZoom = 0.65;
  controls.maxZoom = 3;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = Math.PI / 2.35;
  controls.screenSpacePanning = true;
  controls.touches.ONE = THREE.TOUCH.ROTATE;
  controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
  const target = new THREE.Vector3(0, 0, 0);
  let overhead = false;
  function reset() {
    camera.position.set(24, 32, 36);
    controls.target.copy(target);
    camera.zoom = 1;
    overhead = false;
    camera.updateProjectionMatrix();
    controls.update();
    requestRender();
  }
  reset();
  const ambient = new THREE.HemisphereLight(0xc7dffa, 0x384450, 2.4);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xd4e5fa, 3.4);
  sun.position.set(-18, 30, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -25,
    right: 25,
    top: 25,
    bottom: -25,
    near: 0.5,
    far: 90,
  });
  sun.shadow.normalBias = 0.045;
  sun.shadow.bias = -0.0003;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xd7e9ee, 1.5);
  fill.position.set(20, 14, -18);
  scene.add(fill);
  const mat = (color, extras = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.88, ...extras });
  const materials = {
    ground: mat(palette.ground),
    wood: mat(palette.wood),
    trim: mat(palette.trim, { metalness: 0.25 }),
    tree: mat(0x334e49),
    trunk: mat(0x5d4a30),
    stone: mat(0x8c947b),
    house: mat(0xd6c7a3),
    roof: mat(0x696d4d),
  };
  function mesh(geometry, material, x, y, z, parent = scene) {
    const item = new THREE.Mesh(geometry, material);
    item.position.set(x, y, z);
    item.castShadow = true;
    item.receiveShadow = true;
    parent.add(item);
    return item;
  }
  function box(x, y, z, w, h, d, material, parent) {
    return mesh(new THREE.BoxGeometry(w, h, d), material, x, y, z, parent);
  }
  box(0, -0.85, 0, 31.2, 1.6, 23.2, materials.wood);
  box(0, -0.15, 0, 31.35, 0.12, 23.35, materials.trim);
  box(0, -0.015, 0, 30.7, 0.18, 22.7, materials.ground);
  // Inlaid corner studs and subtle lines in the wooden base.
  for (const x of [-14.9, 14.9])
    for (const z of [-10.9, 10.9])
      mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12),
        materials.trim,
        x,
        0.11,
        z,
      );
  for (const y of [-0.5, -1.18]) {
    box(0, y, 11.61, 30.9, 0.018, 0.012, materials.trim);
    box(15.61, y, 0, 0.012, 0.018, 22.9, materials.trim);
  }
  const tiers = [];
  const terrainColors = [
    0x4c5b63, 0x586670, 0x63727d, 0x6f7d87, 0x7b8890, 0x89949c, 0x97a2a7,
    0xaab4b8, 0xc4cbd0,
  ];
  const terrainMaterials = terrainColors.map(color => mat(color));
  const terrainEdgeMaterial = new THREE.LineBasicMaterial({ color: 0x283b4b, transparent: true, opacity: 0.32 });
  for (let layer = 0; layer < 9; layer++) {
    const scale = Math.pow(0.84, layer);
    const vertices = Array.from({ length: 84 }, (_, i) => {
      const a = (i / 84) * Math.PI * 2,
        wave = 1 + 0.067 * Math.sin(a * 5 + 0.5) + 0.03 * Math.cos(a * 9);
      return [
        Math.min(15.2, Math.max(-15.2, 8 + Math.cos(a) * 13.8 * scale * wave)),
        Math.min(
          11.2,
          Math.max(-11.2, -5.7 + Math.sin(a) * 10.8 * scale * wave),
        ),
      ];
    });
    const shape = new THREE.Shape();
    vertices.forEach(([x, z], i) =>
      i ? shape.lineTo(x, -z) : shape.moveTo(x, -z),
    );
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.52,
      bevelEnabled: false,
    });
    geometry.rotateX(-Math.PI / 2);
    mesh(geometry, terrainMaterials[layer], 0, 0.1 + layer * 0.52, 0);
    const edgePoints = vertices.map(
      ([x, z]) => new THREE.Vector3(x, 0.105 + (layer + 1) * 0.52, z),
    );
    edgePoints.push(edgePoints[0]);
    scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(edgePoints),
        terrainEdgeMaterial,
      ),
    );
    tiers.push({ vertices, top: 0.1 + (layer + 1) * 0.52 });
  }
  // Additional carved ranges are decorative, not asserted geography.
  for (const [cx, cz, rx, rz] of [[-10, -6, 5, 4], [9, 6, 5, 3]]) {
    for (let tier = 0; tier < 7; tier++) {
      const scale = Math.pow(0.78, tier);
      const vertices = Array.from({ length: 48 }, (_, i) => {
        const angle = i / 48 * Math.PI * 2;
        const wave = 1 + 0.12 * Math.sin(angle * 5);
        return [cx + Math.cos(angle) * rx * scale * wave, cz + Math.sin(angle) * rz * scale * wave];
      });
      const shape = new THREE.Shape();
      vertices.forEach(([x, z], i) => i ? shape.lineTo(x, -z) : shape.moveTo(x, -z));
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.65, bevelEnabled: false });
      geometry.rotateX(-Math.PI / 2);
      mesh(geometry, terrainMaterials[tier + 1], 0, 0.1 + tier * 0.65, 0);
      tiers.push({ vertices, top: 0.1 + (tier + 1) * 0.65 });
    }
  }
  function elevation(x, z) {
    let h = 0.1;
    for (const tier of tiers) if (inPolygon(x, z, tier.vertices)) h = Math.max(h, tier.top ?? 0.1);
    // Ranges may overlap the main massif; take the highest carved surface.
    return h;
  }
  // Seeded decorative vegetation; these are not asserted story locations.
  let seed = 41;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 140; i++) {
    const x = -14 + random() * 28,
      z = -10 + random() * 20;
    if ((x < 1 && z > 0) || (x > 1 && x < 10 && z > -6 && z < 2)) continue;
    const y = elevation(x, z),
      s = 0.4 + random() * 0.5;
    mesh(
      new THREE.CylinderGeometry(0.055, 0.085, s * 0.6, 5),
      materials.trunk,
      x,
      y + s * 0.3,
      z,
    );
    const crown = mesh(
      new THREE.IcosahedronGeometry(s * 0.43, 0),
      i % 3 === 0 ? mat(0x667044) : materials.tree,
      x,
      y + s * 0.72,
      z,
    );
    crown.scale.y = 1.5;
  }
  for (let i = 0; i < 42; i++) {
    const x = -13 + random() * 26,
      z = -10 + random() * 19;
    if (x < 2 && z > 0) continue;
    const rock = mesh(
      new THREE.DodecahedronGeometry(0.12 + random() * 0.18, 0),
      materials.stone,
      x,
      elevation(x, z) + 0.08,
      z,
    );
    rock.scale.set(1.5, 0.7, 1);
    rock.rotation.y = random() * 6;
  }
  // The floor catches a soft diorama shadow; the canvas stays transparent.
  const floor = mesh(
    new THREE.PlaneGeometry(250, 250),
    new THREE.ShadowMaterial({ opacity: 0.18 }),
    0,
    -1.67,
    0,
  );
  floor.rotation.x = -Math.PI / 2;
  floor.castShadow = false;
  const landmarks = new THREE.Group();
  scene.add(landmarks);
  const journey = new THREE.Group();
  scene.add(journey);
  const pawnRoot = new THREE.Group();
  scene.add(pawnRoot);
  pawnRoot.visible = false;
  const pawnTemplate = new THREE.Group();
  const brass = mat(palette.gold, { metalness: 0.65, roughness: 0.28 });
  // Immediate lightweight fallback also survives an unavailable asset.
  mesh(
    new THREE.CylinderGeometry(0.33, 0.45, 0.16, 32),
    brass,
    0,
    0.08,
    0,
    pawnTemplate,
  );
  mesh(new THREE.ConeGeometry(0.28, 0.8, 24), brass, 0, 0.52, 0, pawnTemplate);
  mesh(new THREE.SphereGeometry(0.23, 24, 16), brass, 0, 1.0, 0, pawnTemplate);
  new GLTFLoader().load(
    `${import.meta.env.BASE_URL}models/kalin-pawn.glb`,
    (gltf) => {
      clearGroup(pawnTemplate);
      pawnTemplate.add(gltf.scene);
      gltf.scene.traverse((object) => {
        if (object.isMesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      container.dataset.asset = "loaded";
      if (currentView) update(currentView, currentShowCharacter, currentOverview);
      requestRender();
    },
    undefined,
    () => {
      container.dataset.asset = "fallback";
    },
  );
  const markerMaterial = mat(0xead6a1, { metalness: 0.2 });
  function clearGroup(group) {
    while (group.children.length) {
      const object = group.children[0];
      group.remove(object);
      object.traverse((child) => {
        child.geometry?.dispose();
      });
    }
  }
  function building(x, z) {
    const y = elevation(x, z);
    box(x, y + 0.38, z, 0.95, 0.76, 0.85, materials.house, landmarks);
    const roof = mesh(
      new THREE.ConeGeometry(0.78, 0.45, 4),
      materials.roof,
      x,
      y + 0.96,
      z,
      landmarks,
    );
    roof.rotation.y = Math.PI / 4;
    roof.scale.z = 0.9;
    box(x, y + 0.32, z + 0.432, 0.18, 0.36, 0.02, materials.wood, landmarks);
  }
  function paddock(x, z) {
    const y = elevation(x, z);
    for (let side of [-1, 1])
      for (let i = 0; i < 5; i++) {
        box(
          x - 1 + i * 0.5,
          y + 0.21,
          z + side * 0.65,
          0.055,
          0.42,
          0.055,
          materials.house,
          landmarks,
        );
      }
    for (let side of [-1, 1]) {
      box(
        x,
        y + 0.25,
        z + side * 0.65,
        2.1,
        0.06,
        0.05,
        materials.house,
        landmarks,
      );
      box(x + side, y + 0.25, z, 0.05, 0.06, 1.3, materials.house, landmarks);
    }
  }
  let labelItems = [],
    currentView = null;
  let currentOverview = null, currentShowCharacter = true;
  let focusMarker = null;
  const routePaths = {
    "leaving-home": [
      [-10, 5],
      [-8.7, 4.7],
      [-6.5, 3],
      [-4.5, 3.8],
      [-2.6, 4.6],
    ],
    paddock: [
      [-2.6, 4.6],
      [-1.6, 3.9],
      [-1.2, 1.8],
      [-0.4, 2.8],
      [-1.2, 4],
      [-2.6, 4.6],
    ],
    foothills: [
      [-2.6, 4.6],
      [0.2, 3.5],
      [1.7, 1.1],
      [3.3, -0.4],
      [5, -1.3],
      [3.8, -2.2],
      [6.5, -2.8],
      [8, -4.5],
    ],
  };
  const identityMaterials = new Map();
  const ghostMaterials = new Map();
  function identityMaterial(id, characters) {
    if (!identityMaterials.has(id)) identityMaterials.set(id, mat(pieceStyle(id, characters).color, { metalness: 0.35, roughness: 0.4, emissive: pieceStyle(id, characters).color, emissiveIntensity: 0.15 }));
    return identityMaterials.get(id);
  }
  function addPiece(entry, characters, offset, labeled, ghost = false) {
    const place = entry.locations.find(place => place.id === entry.position && Number.isFinite(place.x) && Number.isFinite(place.z));
    if (!place) return false;
    const identity = pieceStyle(entry.selected.id, characters);
    let material = identityMaterial(entry.selected.id, characters);
    if (ghost) {
      if (!ghostMaterials.has(entry.selected.id)) {
        const translucent = material.clone();
        translucent.transparent = true;
        translucent.opacity = 0.42;
        translucent.depthWrite = false;
        ghostMaterials.set(entry.selected.id, translucent);
      }
      material = ghostMaterials.get(entry.selected.id);
    }
    const root = new THREE.Group();
    root.userData = { index: entry.index, characterId: entry.selected.id };
    pawnRoot.add(root);
    const x = place.x + offset[0], z = place.z + offset[1];
    root.position.set(x, elevation(x, z) + 0.12, z);
    if (identity.shape === "orb") {
      const model = pawnTemplate.clone(true);
      model.traverse(object => {
        if (object.isMesh) { object.geometry = object.geometry.clone(); object.material = material; }
      });
      root.add(model);
    } else {
      mesh(new THREE.CylinderGeometry(0.3, 0.44, 0.18, 24), material, 0, 0.09, 0, root);
      mesh(new THREE.ConeGeometry(0.25, 0.8, 16), material, 0, 0.55, 0, root);
      const head = identity.shape === "diamond" ? new THREE.OctahedronGeometry(0.31) :
        identity.shape === "spire" ? new THREE.ConeGeometry(0.24, 0.5, 5) :
        identity.shape === "cube" ? new THREE.BoxGeometry(0.4, 0.4, 0.4) : new THREE.TorusGeometry(0.23, 0.085, 8, 20);
      mesh(head, material, 0, 1.03, 0, root);
    }
    if (ghost) root.traverse(object => { if (object.isMesh) object.castShadow = false; });
    if (!labeled) return true;
    const button = document.createElement("button");
    button.className = "map-label piece-label";
    button.dataset.character = entry.selected.id;
    button.dataset.position = place.id;
    button.style.setProperty("--piece-color", identity.color);
    button.setAttribute("aria-label", `${entry.selected.name}, piece ${identity.number}, show last located entry`);
    button.onclick = () => onSelect(entry.index, entry.selected.id);
    labelRoot.append(button);
    labelItems.push({ element: button, name: String(identity.number), number: identity.number, point: new THREE.Vector3(x, root.position.y + 1.55, z) });
    return true;
  }
  function addJournalFocus(view, focus) {
    const { location: place, ghost } = focus;
    const identity = pieceStyle(view.selected.id, view.characters);
    if (ghost) addPiece(view, view.characters, [0, 0], false, true);
    const y = elevation(place.x, place.z);
    const marker = document.createElement("div");
    marker.className = "journal-focus-marker";
    marker.setAttribute("aria-hidden", "true");
    marker.style.setProperty("--piece-color", identity.color);
    labelRoot.append(marker);
    focusMarker = { element: marker, point: new THREE.Vector3(place.x, y + 0.3, place.z) };
    const label = document.createElement("button");
    label.className = "map-label piece-label journal-focus-label";
    label.dataset.character = view.selected.id;
    label.dataset.event = view.current.id;
    label.dataset.position = place.id;
    label.style.setProperty("--piece-color", identity.color);
    label.setAttribute("aria-label", `${view.selected.name}, selected journal entry at ${place.name}`);
    label.onclick = () => onSelect(view.index, view.selected.id);
    labelRoot.append(label);
    labelItems.unshift({ element: label, name: `◎ ${identity.number} · Journal`, number: identity.number, point: new THREE.Vector3(place.x, y + 1.65, place.z) });
  }
  function update(view, showCharacter = true, overview = null) {
    highlight(null);
    requestRender();
    currentView = view; currentOverview = overview; currentShowCharacter = showCharacter;
    clearGroup(journey); clearGroup(landmarks); clearGroup(pawnRoot);
    labelRoot.replaceChildren(); labelItems = []; focusMarker = null;
    pawnRoot.visible = Boolean(overview) || showCharacter;
    const entries = overview ? overview.entries : showCharacter && view.current ? [view] : [];
    const locations = overview ? overview.locations : view.locations;
    container.dataset.mode = overview ? "chapter" : "entry";
    container.dataset.event = view.current?.id || "";
    container.dataset.route = entries.flatMap(entry => entry.drawnRoute).join(",");
    container.dataset.kind = overview ? "comparison" : view.current?.kind || "";
    container.dataset.position = overview ? "" : view.position || "";
    const focus = overview ? getChapterJournalFocus(view) : null;
    container.dataset.focusPosition = focus?.location.id || "";
    container.dataset.focusCharacter = focus ? view.selected.id : "";
    container.dataset.focusGhost = String(Boolean(focus?.ghost));
    for (const place of locations) {
      if (!Number.isFinite(place.x) || !Number.isFinite(place.z)) continue;
      const y = elevation(place.x, place.z);
      mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.09, 28), markerMaterial, place.x, y + 0.055, place.z, landmarks);
      if (place.id === "HOME-A") building(place.x - 0.55, place.z - 0.65);
      if (place.id === "PAD-B") paddock(place.x, place.z);
      if (overview && !overview.showLocations) continue;
      const button = document.createElement("button");
      button.className = "map-label";
      button.textContent = place.name;
      button.setAttribute("aria-label", `${place.name}, show movement`);
      button.onclick = () => onSelect(place.reveal, place.characterId);
      if (!overview && place.id === view.position) button.classList.add("active");
      labelRoot.append(button);
      labelItems.push({ element: button, name: place.name, number: labelItems.length + 1, point: new THREE.Vector3(place.x, y + 1.1, place.z) });
    }
    // Separate entries never imply a continuous connection between observations.
    entries.forEach((entry, lane) => {
      if (entry.drawnRoute.length < 2) return;
      const event = entry.current;
      // Artistic bends are only valid for the original actor's full route.
      const points = event.actors.includes(entry.selected.id) && entry.drawnRoute.join() === event.route.join() && routePaths[event.id] || entry.drawnRoute.map(id => {
        const place = entry.locations.find(place => place.id === id);
        return [place.x, place.z];
      });
      const sampled = [];
      for (let i = 1; i < points.length; i++) {
        const [ax, az] = points[i - 1], [bx, bz] = points[i];
        const segments = Math.max(14, Math.ceil(Math.hypot(bx - ax, bz - az) * 8));
        for (let j = 0; j < segments; j++) {
          const t = j / segments, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
          sampled.push(new THREE.Vector3(x, elevation(x, z) + 0.25 + (overview ? lane % 8 * 0.06 : 0), z));
        }
      }
      const [x, z] = points.at(-1);
      sampled.push(new THREE.Vector3(x, elevation(x, z) + 0.25 + (overview ? lane % 8 * 0.06 : 0), z));
      const curve = new THREE.CatmullRomCurve3(sampled, false, "centripetal");
      mesh(new THREE.TubeGeometry(curve, sampled.length * 2, overview ? 0.07 : 0.06, 6, false), identityMaterial(entry.selected.id, view.characters), 0, 0, 0, journey);
    });
    const lastLocated = new Map();
    for (const entry of entries) if (entry.locations.some(place => place.id === entry.position && Number.isFinite(place.x) && Number.isFinite(place.z))) lastLocated.set(entry.selected.id, entry);
    const groups = new Map();
    for (const entry of lastLocated.values()) {
      if (!groups.has(entry.position)) groups.set(entry.position, []);
      groups.get(entry.position).push(entry);
    }
    let pieces = 0;
    for (const group of groups.values()) group.forEach((entry, index) => {
      const angle = index / group.length * Math.PI * 2;
      const radius = group.length > 1 ? 0.6 + group.length * 0.06 : 0;
      if (addPiece(entry, view.characters, [Math.cos(angle) * radius, Math.sin(angle) * radius], Boolean(overview))) pieces++;
    });
    container.dataset.pieces = String(pieces);
    if (focus) addJournalFocus(view, focus);
  }
  function highlight(characterId) {
    for (const [id, material] of identityMaterials) {
      const faded = Boolean(characterId && id !== characterId);
      material.opacity = faded ? 0.18 : 1;
      if (material.transparent !== faded) { material.transparent = faded; material.needsUpdate = true; }
    }
    for (const label of labelRoot.querySelectorAll("[data-character]")) label.style.opacity = characterId && label.dataset.character !== characterId ? "0.25" : "1";
    requestRender();
  }
  const raycaster = new THREE.Raycaster();
  let pointerStart = null;
  renderer.domElement.addEventListener("pointerdown", (event) => {
    pointerStart = [event.clientX, event.clientY];
  });
  renderer.domElement.addEventListener("pointerup", (event) => {
    if (
      !pointerStart ||
      Math.hypot(
        event.clientX - pointerStart[0],
        event.clientY - pointerStart[1],
      ) > 5 ||
      !pawnRoot.visible
    )
      return;
    const rect = container.getBoundingClientRect();
    raycaster.setFromCamera(
      new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        (-(event.clientY - rect.top) / rect.height) * 2 + 1,
      ),
      camera,
    );
    const hit = raycaster.intersectObject(pawnRoot, true)[0];
    if (hit) {
      let piece = hit.object;
      while (piece.parent && piece.parent !== pawnRoot) piece = piece.parent;
      onSelect(piece.userData.index, piece.userData.characterId);
    }
  });
  function zoom(factor) {
    camera.zoom = THREE.MathUtils.clamp(camera.zoom * factor, 0.65, 3);
    camera.updateProjectionMatrix();
    requestRender();
  }
  function toggleTop() {
    overhead = !overhead;
    camera.position
      .copy(controls.target)
      .add(
        overhead
          ? new THREE.Vector3(0, 48, 0.01)
          : new THREE.Vector3(24, 32, 36),
      );
    controls.update();
    requestRender();
    return overhead;
  }
  container.addEventListener("keydown", (event) => {
    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "+",
        "=",
        "-",
        "Home",
      ].includes(event.key)
    )
      event.preventDefault();
    if (event.key === "+" || event.key === "=") zoom(1.15);
    if (event.key === "-") zoom(1 / 1.15);
    if (event.key === "Home") reset();
    if (event.key.startsWith("Arrow")) {
      if (event.shiftKey) {
        const delta = new THREE.Vector3(
          event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0,
          0,
          event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0,
        );
        camera.position.add(delta);
        controls.target.add(delta);
      } else {
        const offset = camera.position.clone().sub(controls.target),
          spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.theta +=
          event.key === "ArrowLeft"
            ? -0.12
            : event.key === "ArrowRight"
              ? 0.12
              : 0;
        spherical.phi = THREE.MathUtils.clamp(
          spherical.phi +
            (event.key === "ArrowUp"
              ? -0.1
              : event.key === "ArrowDown"
                ? 0.1
                : 0),
          0.12,
          Math.PI / 2.35,
        );
        camera.position
          .copy(controls.target)
          .add(new THREE.Vector3().setFromSpherical(spherical));
      }
      controls.update();
    }
  });
  const resize = new ResizeObserver(() => {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height);
    const aspect = width / height,
      halfWidth = window.innerWidth < 721 ? 21 : 21.5;
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfWidth / aspect;
    camera.bottom = -halfWidth / aspect;
    camera.updateProjectionMatrix();
    requestRender();
  });
  resize.observe(container);
  function render() {
    renderPending = false;
    controls.update();
    const occupied = [];
    const bounds = container.getBoundingClientRect();
    if (focusMarker) {
      const p = focusMarker.point.clone().project(camera);
      focusMarker.element.style.left = `${(p.x * 0.5 + 0.5) * container.clientWidth}px`;
      focusMarker.element.style.top = `${(-p.y * 0.5 + 0.5) * container.clientHeight}px`;
      focusMarker.element.hidden = p.z > 1 || p.z < -1;
    }
    const toolbar = container.parentElement.querySelector(".map-toolbar")?.getBoundingClientRect();
    if (toolbar?.width && toolbar.height) occupied.push({ left: toolbar.left - bounds.left - 6, right: toolbar.right - bounds.left + 6, top: toolbar.top - bounds.top - 6, bottom: toolbar.bottom - bounds.top + 6 });
    for (const { element, point, name, number } of labelItems) {
      const p = point.clone().project(camera);
      const compact =
        container.clientWidth < 500 && !element.classList.contains("active") && !element.classList.contains("piece-label");
      element.textContent = compact ? String(number) : name;
      element.classList.toggle("compact", compact);
      const width = element.offsetWidth,
        height = element.offsetHeight;
      let x = THREE.MathUtils.clamp(
        (p.x * 0.5 + 0.5) * container.clientWidth,
        width / 2 + 8,
        container.clientWidth - width / 2 - 8,
      );
      const anchorY = (-p.y * 0.5 + 0.5) * container.clientHeight;
      let y = anchorY;
      const piece = element.classList.contains("piece-label");
      const anchorX = x;
      const collides = (cx, cy) => occupied.some(r => cx + width / 2 + 5 > r.left && cx - width / 2 - 5 < r.right && cy + 5 > r.top && cy - height - 5 < r.bottom);
      if (piece) {
        const minY = height + 150, maxY = container.clientHeight - 180;
        const baseY = THREE.MathUtils.clamp(y, minY, maxY);
        const candidates = [[0, 0]];
        for (let radius = 1; radius <= 7; radius++) for (let row = -radius; row <= radius; row++) for (let col = -radius; col <= radius; col++) {
          if (Math.max(Math.abs(col), Math.abs(row)) === radius) candidates.push([col, row]);
        }
        let placed = false;
        for (const [col, row] of candidates) {
          const cx = THREE.MathUtils.clamp(anchorX + col * (width + 7), width / 2 + 8, container.clientWidth - width / 2 - 8);
          const cy = THREE.MathUtils.clamp(baseY + row * (height + 8), minY, maxY);
          if (!collides(cx, cy)) { x = cx; y = cy; placed = true; break; }
        }
        // A wide Journal badge can fill the nearby slots in a dense comparison.
        // Search the entire label area before accepting an overlapping position.
        if (!placed) {
          const slots = [];
          for (let cy = minY; cy <= maxY; cy += 7) for (let cx = width / 2 + 8; cx <= container.clientWidth - width / 2 - 8; cx += 7) {
            if (!collides(cx, cy)) slots.push([cx, cy]);
          }
          slots.sort((a, b) => Math.hypot(a[0] - anchorX, a[1] - baseY) - Math.hypot(b[0] - anchorX, b[1] - baseY));
          if (slots.length) [x, y] = slots[0];
        }
      } else {
        for (let attempts = 0; attempts < 12; attempts++) {
          const collision = occupied.find(r => x + width / 2 + 5 > r.left && x - width / 2 - 5 < r.right && y + 5 > r.top && y - height - 5 < r.bottom);
          if (!collision) break;
          y = collision.top - 7;
        }
      }
      occupied.push({
        left: x - width / 2,
        right: x + width / 2,
        top: y - height,
        bottom: y,
      });
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.style.setProperty(
        "--leader-height",
        `${piece ? Math.hypot(anchorX - x, anchorY - y + 12) : Math.max(12, anchorY - y + 12)}px`,
      );
      element.style.setProperty("--leader-angle", `${piece ? -Math.atan2(anchorX - x, anchorY - y + 12) : 0}rad`);
      element.hidden = p.z > 1 || p.z < -1;
    }
    renderer.render(scene, camera);
  }
  // Keep damping smooth while the camera moves, then stop spending GPU/CPU
  // time on an unchanged board. Resize, story, and asset changes also redraw.
  function requestRender() {
    if (renderPending) return;
    renderPending = true;
    requestAnimationFrame(render);
  }
  controls.addEventListener("change", () => { requestRender(); onViewChange?.(); });
  requestRender();
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    document.querySelector("#map-fallback").hidden = false;
  });
  renderer.domElement.addEventListener("webglcontextrestored", () => {
    document.querySelector("#map-fallback").hidden = true;
    requestRender();
  });
  function setTheme(theme) {
    const light = theme === "light";
    ambient.color.setHex(light ? 0xf6f0da : 0xc7dffa);
    ambient.groundColor.setHex(light ? 0x546846 : 0x384450);
    ambient.intensity = light ? 2.6 : 2.4;
    sun.color.setHex(light ? 0xffedca : 0xd4e5fa);
    sun.intensity = light ? 3.7 : 3.4;
    materials.ground.color.setHex(light ? 0x7f8b63 : palette.ground);
    materials.wood.color.setHex(light ? 0x463a28 : palette.wood);
    materials.tree.color.setHex(light ? 0x465b38 : 0x334e49);
    const colors = light ? [0x87926a, 0x929973, 0x9ba07c, 0xa8aa84, 0xb2b08d, 0xbcb795, 0xc8c0a1, 0xd3c8ac, 0xdfd3b9] : terrainColors;
    terrainMaterials.forEach((material, index) => material.color.setHex(colors[index]));
    terrainEdgeMaterial.color.setHex(light ? 0x646c49 : 0x283b4b);
    requestRender();
  }
  function getCamera() {
    return { position: camera.position.toArray(), target: controls.target.toArray(), zoom: camera.zoom, overhead };
  }
  function restoreCamera(state) {
    camera.position.fromArray(state.position);
    controls.target.fromArray(state.target);
    camera.zoom = state.zoom;
    overhead = state.overhead;
    camera.updateProjectionMatrix();
    controls.update();
    requestRender();
  }
  return { update, zoom, reset, toggleTop, highlight, setTheme, getCamera, restoreCamera };
}
