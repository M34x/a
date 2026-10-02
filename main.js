import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const dist2 = 200;
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, dist2);
const fog = new THREE.FogExp2(0x111111, 0.01)
scene.fog = fog
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.sortObjects = false;
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.top = '0';
renderer.domElement.style.left = '0';
renderer.domElement.style.zIndex = '0';
renderer.domElement.style.display = 'block';
function resizeRenderer() {
	const width2 = window.innerWidth;
	const height = window.innerHeight;
	camera.aspect = width2 / height;
	camera.updateProjectionMatrix();
	renderer.setSize(width2, height);
}
resizeRenderer();
document.body.appendChild(renderer.domElement);
scene.background = new THREE.Color(0X111111);
const spotlight = new THREE.SpotLight(0xffffff, 1, 25, Math.PI / 6, 0.45, 1);
spotlight.position.set(0, 5, 0);
spotlight.target.position.set(0, 0, 0);
scene.add(spotlight.target);

const lights = [new THREE.AmbientLight(0x404040), new THREE.DirectionalLight(0xffffff, 0.5)];
lights[1].position.set(5, 10, 7.5);
lights[1].target.position.set(0, 0, 0);
lights.forEach(element => {
	scene.add(element)
});
const potLights = [];
const objects = [];
const ghosts = [];
let width = 2;
let colour2 = 0x00ff00;
let obj = 'wall';
const mat2 = new THREE.Material({})
const hitbox = new THREE.Mesh(new THREE.BoxGeometry(.7, 1.8, .7), mat2)
const stairHitbox = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.2, 0.7), mat2)
function moveHitbox() {
	hitbox.position.set(camera.position.x, camera.position.y - 0.8, camera.position.z);
	stairHitbox.position.copy(hitbox.position);
	stairHitbox.position.y -= 0.8 + 0.19;
}
function getWallGeometry() {
	const length = width + 0.5;
	const geometry = rot
		? new THREE.BoxGeometry(0.5, 3, 1)
		: new THREE.BoxGeometry(1, 3, 0.5);

	if (rot) {
		geometry.scale(1, 1, length);
	} else {
		geometry.scale(length, 1, 1);
	}
	return geometry;
}
function getFloorGeometry() {
	const geometry = new THREE.BoxGeometry(1, 0.5, 1);
	geometry.scale(width + 0.5, 1, width + 0.5);
	return geometry;
}
function getCeilingGeometry() {
	const geometry = new THREE.BoxGeometry(1, 0.5, 1);
	geometry.scale(width + 0.5, 1, width + 0.5);
	return geometry;
}
	function createDoorMesh(material, objectWidth = width, objectRotation = rot) {
	const door = new THREE.Group();
	const sideDepth = (objectWidth - 0.5) / 2;
	const sideY = camera.position.y - 1.6;
	const topY = camera.position.y - 0.6;
	const frameGeo = new THREE.Mesh(objectRotation ? new THREE.BoxGeometry(0.5, 3, sideDepth) : new THREE.BoxGeometry(sideDepth, 3, 0.5), material);
	const leftFrame = frameGeo.clone();
	leftFrame.position.set(objectRotation ? 0 : -(objectWidth + 1.5) / 4, sideY, objectRotation ? -(objectWidth + 1.5) / 4 : 0);

	const rightFrame = frameGeo.clone();
	rightFrame.position.set(objectRotation ? 0 : (objectWidth + 1.5) / 4, sideY, objectRotation ? (objectWidth + 1.5) / 4 : 0);

	const topBeam = new THREE.Mesh(new THREE.BoxGeometry(!objectRotation ? 1 : 0.5, 1, !objectRotation ? 0.5 : 1), material);
	topBeam.position.set(0, topY, 0);
	if (objectWidth > 1) {
		door.add(leftFrame, rightFrame);
	}
	door.add(topBeam);
	door.userData.deletePreview = false;
	door.userData.baseColor = material && material.color ? material.color.getHex() : colour2;
	return door;
}
	function createWindowMesh(material, objectWidth = width, objectRotation = rot) {
	const window = new THREE.Group();
	const sideDepth = (objectWidth - 0.5) / 2;
	const sideY = camera.position.y - 1.6;
	const topY = camera.position.y - 0.6;
	const bottomY = camera.position.y - 2.6;
	const frameGeo = new THREE.Mesh(objectRotation ? new THREE.BoxGeometry(0.5, 3, sideDepth) : new THREE.BoxGeometry(sideDepth, 3, 0.5), material);
	const leftFrame = frameGeo.clone();
	leftFrame.position.set(objectRotation ? 0 : -(objectWidth + 1.5) / 4, sideY, objectRotation ? -(objectWidth + 1.5) / 4 : 0);

	const rightFrame = frameGeo.clone();
	rightFrame.position.set(objectRotation ? 0 : (objectWidth + 1.5) / 4, sideY, objectRotation ? (objectWidth + 1.5) / 4 : 0);

	const topBeam = new THREE.Mesh(new THREE.BoxGeometry(!objectRotation ? 1 : 0.5, 1, !objectRotation ? 0.5 : 1), material);
	topBeam.position.set(0, topY, 0);

	const botBeam = new THREE.Mesh(new THREE.BoxGeometry(!objectRotation ? 1 : 0.5, 1, !objectRotation ? 0.5 : 1), material);
	botBeam.position.set(0, bottomY, 0);
	if (objectWidth > 1) {
		window.add(leftFrame, rightFrame);
	}
	window.add(topBeam, botBeam);
	window.userData.deletePreview = false;
	window.userData.baseColor = material && material.color ? material.color.getHex() : colour2;
	return window;
}
function getPlacementPosition(targetObj = obj) {
	const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
	forward.y = 0;
	forward.normalize();

	const distance = 3 * Math.cos(camera.rotation.x);
	const position = camera.position.clone().addScaledVector(forward, distance);
	const y = targetObj === 'light' ? camera.position.y + 1.29 : targetObj === 'floor' ? camera.position.y - 1.75 : targetObj === 'ceiling' ? camera.position.y + 1.6 : targetObj === 'door' ? camera.position.y - 0.1 : targetObj === 'window' ? camera.position.y - 0.1 : targetObj === 'statics' ? camera.position.y - 1.1 : targetObj === 'motion' ? (camera.position.y - 1.1/*needs to be dependent on the statics and motions */) : camera.position.y - 0.1;

	return new THREE.Vector3(
		Math.round(position.x * 2) / 2,
		y,
		Math.round(position.z * 2) / 2
	);
}

function getObjectPlacementPoint(object) {
	if (object && object.userData && object.userData.placementPos) {
		return object.userData.placementPos;
	}
	return object.position;
}

function objectExistsAt(position, yTolerance = 0.001) {
	const hits = objects.filter((object) => {
		const objectPos = getObjectPlacementPoint(object);
		return (
			Math.abs(objectPos.x - position.x) < 0.001 &&
			Math.abs(objectPos.y - position.y) < yTolerance &&
			Math.abs(objectPos.z - position.z) < 0.001
		);
	});

	return hits.length > 0;
}

function findObjectAt(position, yTolerance = 0.5) {
	const match = objects.find((object) => {
		const objectPos = getObjectPlacementPoint(object);
		return (
			Math.abs(objectPos.x - position.x) < 0.001 &&
			Math.abs(objectPos.y - position.y) < yTolerance &&
			Math.abs(objectPos.z - position.z) < 0.001
		);
	});

	return match;
}

function getDeleteTargetFromCrosshair() {
	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2(0, 0);
	raycaster.setFromCamera(pointer, camera);
	const hits = raycaster.intersectObjects(objects, true);

	if (!hits.length) return null;

	let target = hits[0].object;
	while (target && target !== scene && !objects.includes(target)) {
		target = target.parent;
	}

	return target && objects.includes(target) ? target : null;
}

function setWallColour(object, hex) {
	if (!object) return;

	if (object.isGroup) {
		object.children.forEach((child) => setWallColour(child, hex));
		return;
	}

	if (Array.isArray(object.material)) {
		object.material.forEach((material) => {
			if (material && material.color) material.color.setHex(hex);
		});
		return;
	}

	if (object.material && object.material.color) {
		object.material.color.setHex(hex);
	}
}

const staticsLibrary = {};

function createFallbackstaticsMesh(material, size = 0.8) {
	const group = new THREE.Group();
	const body = new THREE.Mesh(
		new THREE.BoxGeometry(size, size, size),
		material || new THREE.MeshPhongMaterial({ color: 0xffffff })
	);
	body.position.y = size / 2;
	group.add(body);
	return group;
}

function applyGhostMaterial(object, color) {
	object.traverse((child) => {
		if (!child.isMesh) return;

		const meshMaterial = child.material;
		const material = Array.isArray(meshMaterial)
			? meshMaterial.map((entry) => {
				if (!entry || !entry.color) return entry;
				return new THREE.MeshPhongMaterial({
					color,
					emissive: color,
					emissiveIntensity: 0.15,
					transparent: true,
					opacity: 0.6,
					shininess: 25,
					depthWrite: false,
				});
			})
			: new THREE.MeshPhongMaterial({
				color,
				emissive: color,
				emissiveIntensity: 0.15,
				transparent: true,
				opacity: 0.6,
				shininess: 25,
				depthWrite: false,
			});

		child.material = material;
	});
}

function normalizestaticsScale(scale) {
	if (typeof scale === 'number') {
		return { x: scale, y: scale, z: scale };
	}

	return {
		x: scale?.x ?? 1,
		y: scale?.y ?? 1,
		z: scale?.z ?? 1,
	};
}

function preloadstaticsModel(type, url, scale = 1) {
	if (staticsLibrary[type]) return;

	const normalizedScale = normalizestaticsScale(scale);

	const loader = new GLTFLoader();
	loader.load(
		url,
		(gltf) => {
			const model = gltf.scene;

			model.userData.scale = normalizedScale;
			model.scale.set(normalizedScale.x, normalizedScale.y, normalizedScale.z);
			staticsLibrary[type] = model;
		},
		undefined,
		(error) => {
			console.warn(`could not preload ${type}:`, error);
			const fallback = createFallbackstaticsMesh(new THREE.MeshPhongMaterial({ color: 0xffffff }), 0.8);
			fallback.userData.scale = normalizedScale;
			staticsLibrary[type] = fallback;
		}
	);
}

function applystaticsMaterial(object, color, ghost = false) {
	object.traverse((child) => {
		if (!child.isMesh) return;

		const nextMaterial = new THREE.MeshPhongMaterial({
			color,
			emissive: ghost ? color : 0x000000,
			emissiveIntensity: ghost ? 0.2 : 0,
			transparent: ghost,
			opacity: ghost ? 0.55 : 1,
			shininess: 45,
			depthWrite: !ghost,
		});

		child.material = nextMaterial;
	});
}

function clonestaticsModel(type, color, ghost = false, rotation = staticsRot) {
	const template = staticsLibrary[type];
	if (!template) return null;

	const model = template.clone(true);
	const scale = normalizestaticsScale(model.userData.scale ?? 1);
	model.scale.set(scale.x, scale.y, scale.z);
	applystaticsMaterial(model, color, ghost);
	model.rotation.y = rotation * (Math.PI / 2);
	return model;
}

function createstaticsGhost(type, color, position) {
	const ghost = clonestaticsModel(type, color, true);
	if (!ghost) {
		return createFallbackstaticsMesh(new THREE.MeshPhongMaterial({ color }), 0.8);
	}

	ghost.position.copy(position);
	ghost.userData.placementPos = position.clone();
	ghost.userData.deletePreview = false;
	ghost.userData.baseColor = color;
	return ghost;
}

function createPlacedstatics(type, color, rotation = staticsRot) {
	const model = clonestaticsModel(type, color, false, rotation);
	if (model) return model;
	return createFallbackstaticsMesh(new THREE.MeshPhongMaterial({ color }), type === 'table' ? 1.1 : 0.8);
}
function makemotionMesh(type, mat, rotation = staticsRot) {
	const deco = new THREE.Group();
	deco.rotation.y = rotation * (Math.PI / 2);
	return deco;
}
const staticObjectYOffsets = Object.freeze({
	chair: 0,
	table: 0.2,
	stair: -0.1,
	bench: 0,
	stool: 0,
	rug: 0,
	lamp: 0,
	sofa: 0,
	bed: 0,
	cabinet: 0,
	shelf: 0,
	desk: 0,
	piano: 0,
	wardrobe: 0,
	bookshelf: 0,
});

function getStaticObjectPosition(type, basePos) {
	const pos = basePos.clone();
	pos.y += staticObjectYOffsets[type] ?? 0;
	return pos;
}

function ghostObject() {
	if (obj === 'wall') {
		const pos = getPlacementPosition('wall');
		if (objectExistsAt(pos)) return;

		const ghostMaterial = new THREE.MeshPhongMaterial({ color: colour2, shininess: 35, transparent: true, opacity: 0.8, emissive: colour2, emissiveIntensity: 0.02 });
		ghostMaterial.depthWrite = false;
		const ghost = new THREE.Mesh(getWallGeometry(), ghostMaterial);
		ghost.position.copy(pos);
		ghosts.push(ghost);
		
		scene.add(ghost);
	}
	if (obj === 'light') {
		const pos = getPlacementPosition('light');
		if (objectExistsAt(pos)) return;

		const ghostMaterial = new THREE.MeshPhongMaterial({ color: colour3, shininess: 90, emissive: colour3, emissiveIntensity: 1, transparent: true, opacity: 0.5, depthTest: true });
		ghostMaterial.depthWrite = false;
		const ghost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 32), ghostMaterial);
		ghost.position.copy(pos);
		ghost.userData.lightGhost = true;
		ghosts.push(ghost);
		scene.add(ghost);
	}
	if(obj === 'floor') {
		const pos = getPlacementPosition('floor');
		if (objectExistsAt(pos)) return;

		const ghostMaterial = new THREE.MeshPhongMaterial({ color: colour2, shininess: 35, transparent: true, opacity: 0.8, emissive: colour2, emissiveIntensity: 0.02 });
		ghostMaterial.depthWrite = false;
		const ghost = new THREE.Mesh(getFloorGeometry(), ghostMaterial);
		ghost.position.copy(pos);
		ghosts.push(ghost);
		
		scene.add(ghost);
	}
	if (obj === 'ceiling') {
		const pos = getPlacementPosition('ceiling');
		if (objectExistsAt(pos)) return;

		const ghostMaterial = new THREE.MeshPhongMaterial({ color: colour2, shininess: 35, transparent: true, opacity: 0.8, emissive: colour2, emissiveIntensity: 0.02 });
		ghostMaterial.depthWrite = false;
		const ghost = new THREE.Mesh(getCeilingGeometry(), ghostMaterial);
		ghost.position.copy(pos);
		ghosts.push(ghost);
		
		scene.add(ghost);
	}
	if (obj === 'door') {
		const pos = getPlacementPosition('door');
		if (objectExistsAt(pos)) return;

		const ghostMaterial = new THREE.MeshPhongMaterial({ color: colour2, shininess: 35, transparent: true, opacity: 0.8, emissive: colour2, emissiveIntensity: 0.02 });
		ghostMaterial.depthWrite = false;
		const ghost = createDoorMesh(ghostMaterial);
		ghost.position.copy(pos);
		ghosts.push(ghost);
		
		scene.add(ghost);
	}
	if (obj === 'window') {
		const pos = getPlacementPosition('window');
		if (objectExistsAt(pos)) return;

		const ghostMaterial = new THREE.MeshPhongMaterial({ color: colour2, shininess: 35, transparent: true, opacity: 0.8, emissive: colour2, emissiveIntensity: 0.02 });
		ghostMaterial.depthWrite = false;
		const ghost = createWindowMesh(ghostMaterial);
		ghost.position.copy(pos);
		ghosts.push(ghost);
		
		scene.add(ghost);
	}
	if (obj === 'statics') {
		const type = statics[staticst];
		const pos = getPlacementPosition('statics');
		const adjustedPos = getStaticObjectPosition(type, pos);
		if (objectExistsAt(adjustedPos)) return;

		const ghost = createstaticsGhost(type, colour2, pos);
		ghost.position.copy(adjustedPos);
		ghost.userData.placementPos = adjustedPos.clone();
		ghost.position.y += poss[type] ?? 0;
		ghosts.push(ghost);
		scene.add(ghost);
	} else if (obj === 'motion') {
		const pos = getPlacementPosition('motion');
		if (objectExistsAt(pos)) return;
		const ghostMaterial = new THREE.MeshPhongMaterial({ color: colour2, shininess: 35, transparent: true, opacity: 0.8, emissive: colour2, emissiveIntensity: 0.02 });
		const ghost = makemotionMesh(motion[motiont], ghostMaterial);
		ghost.position.copy(pos);
		ghosts.push(ghost);
		
		scene.add(ghost);
	}

}
//stack overflow my beloved
function hexToHsl(hex) {
	let r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
	r /= 255; g /= 255; b /= 255;
	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, l * 100];
	const d = max - min;
	const s = l > 0.5? d / (2 - max - min) : d / (max + min);
	let h;
	if (max === r) h = (g - b) / d + (g < b? 6 : 0);
	else if (max === g) h = (b - r) / d + 2;
	else h = (r - g) / d + 4;
	return [h * 60, s * 100, l * 100];
}
function hslToHex(h, s, l) {
s /= 100; l /= 100;
	const k = n => (n + h / 30) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	return (Math.round(f(0) * 255) << 16) | (Math.round(f(8) * 255) << 8) | Math.round(f(4) * 255);
}

function lightColour(hex) {
	return new THREE.MeshPhongMaterial({ color: hex, shininess: 90, emissive: hex, emissiveIntensity: 1, depthTest: true, depthWrite: false });
}

function updatePotLightVisibility() {
	potLights.forEach((potLight) => {
		if (!potLight || !potLight.userData || !potLight.userData.light) {
			return;
		}

		const lightPos = potLight.position.clone();
		const cameraPos = camera.position.clone();
		const direction = lightPos.sub(cameraPos);
		const distance = direction.length();

		if (distance < 0.0001) {
			potLight.visible = true;
			return;
		}

		direction.normalize();
		const raycaster = new THREE.Raycaster(cameraPos, direction, 0, distance);
		const intersects = raycaster.intersectObjects(objects, true);
		const isBlocked = intersects.some((hit) => hit.object !== potLight && hit.distance < distance - 0.05);
		potLight.visible = !isBlocked;
	});
}

function updateGhostLightVisibility() {
	ghosts.forEach((ghost) => {
		if (!ghost || !ghost.userData || !ghost.userData.lightGhost) {
			return;
		}

		const lightPos = ghost.position.clone();
		const cameraPos = camera.position.clone();
		const direction = lightPos.sub(cameraPos);
		const distance = direction.length();

		if (distance < 0.0001) {
			ghost.visible = true;
			return;
		}

		direction.normalize();
		const raycaster = new THREE.Raycaster(cameraPos, direction, 0, distance);
		const intersects = raycaster.intersectObjects(objects, true);
		const isBlocked = intersects.some((hit) => hit.distance < distance - 0.05);
		ghost.visible = !isBlocked;
	});
}
lights.forEach(light => {
	if (light instanceof THREE.SpotLight) {
		const potLight = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 32), lightColour(0xffffff));
		potLight.position.copy(light.position);
		potLight.userData.light = light;
		scene.add(potLight);
		potLights.push(potLight);
	}
});
window.addEventListener('resize', resizeRenderer);
let keys = []
let rot = false;
let staticsRot = 0;
let toggle = false;
let hue = 1
let staticst = 0
let motiont = 0
let colour3 = 0xffffff;
function createSolid(x, y, z, xsize, ysize, zsize, hex, geometry = new THREE.BoxGeometry(xsize, ysize, zsize)) {
	const material = new THREE.MeshPhongMaterial({ color: hex, shininess: 0 });
	const object = new THREE.Mesh(geometry, material);
	object.position.set(x, y, z);
	object.userData.deletePreview = false;
	object.userData.baseColor = hex;
	objects.push(object);
	scene.add(object);
	return object;
}
const poss = {
	chair: 0,
	table: 0,
	stair: -0.3,
	stairs: -0.4,
	bench: 0,
	stool: 0,
	rug: 0,
	lamp: 0,
	sofa: 0,
	bed: 0,
	bookshelf: 0,
	poster: 0,
	vase: 0,
	curtain: 0,
};
let playerGeo = new THREE.BoxGeometry(0.7, 1.8, 0.7);
const remotePlayers = new Map();

function updateRemotePlayer(packet) {
	if (typeof packet.playerId !== 'string' || !packet.position) return;
	const { x, y, z } = packet.position;
	if (![x, y, z].every(Number.isFinite)) return;

	let player = remotePlayers.get(packet.playerId);
	if (!player) {
		player = new THREE.Mesh(playerGeo, new THREE.MeshPhongMaterial({ color: 0xff5555 }));
		remotePlayers.set(packet.playerId, player);
		scene.add(player);
	}

	player.position.set(x, y - 0.8, z);
	player.rotation.y = Number.isFinite(packet.rotation) ? packet.rotation : 0;
}

function removeRemotePlayer(playerId) {
	const player = remotePlayers.get(playerId);
	if (!player) return;
	scene.remove(player);
	player.material.dispose();
	remotePlayers.delete(playerId);
}
//|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
const serverOverride = new URLSearchParams(window.location.search).get('server');
const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) || window.location.protocol === 'file:';
const socketUrl = serverOverride || (isLocalHost
	? `ws://${window.location.hostname || 'localhost'}:3000`
	: 'wss://phantomful.onrender.com');
console.log(`Connecting to placement server: ${socketUrl}`);
const socket = new WebSocket(socketUrl);
const pendingPackets = [];
socket.addEventListener('open', () => {
	while (pendingPackets.length > 0) {
		socket.send(JSON.stringify(pendingPackets.shift()));
	}
	console.log(`Connected to placement server: ${socketUrl}`);
	sendPlayerPosition();
});

socket.addEventListener('close', (event) => {
	console.log(`Placement server disconnected (code ${event.code})`);
});

socket.addEventListener('error', (error) => {
	console.error(`Placement server connection failed: ${socketUrl}`, error);
});

function sendPacket(packet) {
	if (socket.readyState === WebSocket.CONNECTING) {
		pendingPackets.push(packet);
		return true;
	}
	if (socket.readyState !== WebSocket.OPEN) {
		console.error('Could not send packet; placement server is not connected:', packet.type);
		return false;
	}

	socket.send(JSON.stringify(packet));
	return true;
}

function sendPlayerPosition() {
	sendPacket({
		type: 'playerPosition',
		position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
		rotation: camera.rotation.y,
	});
}
//|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||

function removePlacedObject(object, notifyServer = false) {
	if (!object) return;
	if (notifyServer && object.userData.networkId) {
		sendPacket({ type: 'deleteObject', id: object.userData.networkId });
	}
	if (object.userData.light) {
		if (object.userData.light.userData.visual) scene.remove(object.userData.light.userData.visual);
		scene.remove(object.userData.light);
	}
	if (object.userData.visual) scene.remove(object.userData.visual);
	scene.remove(object);
	const objectIndex = objects.indexOf(object);
	if (objectIndex !== -1) objects.splice(objectIndex, 1);
	const lightIndex = potLights.indexOf(object);
	if (lightIndex !== -1) potLights.splice(lightIndex, 1);
}

function place() {
	if (toggle) {
		if (obj === modes[1]) {
			const pos = getPlacementPosition('light');
			const existing = findObjectAt(pos);

			if (existing) {
				if (existing.userData.deletePreview) {
					removePlacedObject(existing, true);
					return;
				}

				setWallColour(existing, 0xff0000);
				existing.userData.deletePreview = true;
				return;
			}

			const light = new THREE.PointLight(colour3, 1.5, 20);
			light.position.copy(pos);
			scene.add(light);

			const potLightMaterial = lightColour(colour3);
			potLightMaterial.depthWrite = false;
			potLightMaterial.depthTest = true;
			const potLight = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 32), potLightMaterial);
			potLight.position.copy(pos);
			potLight.userData.baseColor = colour3;
			potLight.userData.networkId = sendObjToServer('light', pos, colour3);
			scene.add(potLight);
			potLight.userData.light = light;
			light.userData.visual = potLight;
			objects.push(potLight);
			potLights.push(potLight);
		} else if (obj === modes[0]) {
			const pos = getPlacementPosition('wall');
			const existing = findObjectAt(pos);

			if (existing) {
				if (existing.userData.deletePreview) {
					removePlacedObject(existing, true);
					return;
				}

				setWallColour(existing, 0xff0000);
				existing.userData.deletePreview = true;
				return;
			}

			const wallGeometry = rot
				? new THREE.BoxGeometry(0.5, 3, width + 0.5)
				: new THREE.BoxGeometry(width + 0.5, 3, 0.5);
			const wall = createSolid(pos.x, pos.y, pos.z, wallGeometry.parameters.width, wallGeometry.parameters.height, wallGeometry.parameters.depth, colour2, wallGeometry);
			wall.userData.baseColor = colour2;
			wall.userData.type = 'wall';
			wall.userData.networkId = sendObjToServer('wall', pos, colour2, { width, rotation: rot });
		} else if (obj === modes[2]/* floor */) {
			const pos = getPlacementPosition('floor');
			const existing = findObjectAt(pos);

			if (existing) {
				if (existing.userData.deletePreview) {
					removePlacedObject(existing, true);
					return;
				}

				setWallColour(existing, 0xff0000);
				existing.userData.deletePreview = true;
				return;
			}

			const floorGeometry = new THREE.BoxGeometry(width + 0.5, 0.5, width + 0.5);
			const floor = createSolid(pos.x, pos.y, pos.z, floorGeometry.parameters.width, floorGeometry.parameters.height, floorGeometry.parameters.depth, colour2, floorGeometry);
			floor.userData.baseColor = colour2;
			floor.userData.type = 'floor';
			floor.userData.networkId = sendObjToServer('floor', pos, colour2, { width });
		} else if (obj === modes[3]/* ceiling */) {
			const pos = getPlacementPosition('ceiling');
			const existing = findObjectAt(pos);

			if (existing) {
				if (existing.userData.deletePreview) {
					removePlacedObject(existing, true);
					return;
				}

				setWallColour(existing, 0xff0000);
				existing.userData.deletePreview = true;
				return;
			}

			const ceilingGeometry = new THREE.BoxGeometry(width + 0.5, 0.5, width + 0.5);
			const ceiling = createSolid(pos.x, pos.y, pos.z, ceilingGeometry.parameters.width, ceilingGeometry.parameters.height, ceilingGeometry.parameters.depth, colour2, ceilingGeometry);
			ceiling.userData.baseColor = colour2;
			ceiling.userData.type = 'ceiling';
			ceiling.userData.networkId = sendObjToServer('ceiling', pos, colour2, { width });
		} else if (obj === modes[4]/* door */) {
			const pos = getPlacementPosition('door');
			const existing = findObjectAt(pos);

			if (existing) {
				if (existing.userData.deletePreview) {
					removePlacedObject(existing, true);
					return;
				}

				setWallColour(existing, 0xff0000);
				existing.userData.deletePreview = true;
				return;
			}

			const door = createDoorMesh(new THREE.MeshPhongMaterial({ color: colour2, shininess: 60 }));
			door.position.copy(pos);
			door.userData.baseColor = colour2;
			door.userData.type = 'door';
			door.userData.networkId = sendObjToServer('door', pos, colour2, { width, rotation: rot });
			objects.push(door);
			scene.add(door);
		} else if (obj === modes[5]/* window */) {
			const pos = getPlacementPosition('window');
			const existing = findObjectAt(pos);

			if (existing) {
				if (existing.userData.deletePreview) {
					removePlacedObject(existing, true);
					return;
				}

				setWallColour(existing, 0xff0000);
				existing.userData.deletePreview = true;
				return;
			}

			const windowMesh = createWindowMesh(new THREE.MeshPhongMaterial({ color: colour2, shininess: 60 }));
			windowMesh.position.copy(pos);
			windowMesh.userData.baseColor = colour2;
			windowMesh.userData.type = 'window';
			windowMesh.userData.networkId = sendObjToServer('window', pos, colour2, { width, rotation: rot });
			objects.push(windowMesh);
			scene.add(windowMesh);
		} else if (obj === modes[6]/* statics */) {
			const type = statics[staticst] || 'chair';
			const pos = getPlacementPosition('statics');
			const adjustedPos = getStaticObjectPosition(type, pos);
			const existing = findObjectAt(adjustedPos);

			if (existing) {
				if (existing.userData.deletePreview) {
					removePlacedObject(existing, true);
					return;
				}

				setWallColour(existing, 0xff0000);
				existing.userData.deletePreview = true;
				return;
			}

			const mesh = createPlacedstatics(type, colour2);
			if (!mesh) return;
			mesh.position.copy(adjustedPos);
			mesh.userData.type = type;
			mesh.userData.placementPos = adjustedPos.clone();
			mesh.userData.baseColor = colour2;
			mesh.userData.deletePreview = false;
			mesh.position.y += poss[type] ?? 0;
			mesh.userData.networkId = sendObjToServer('statics', adjustedPos, colour2, { variant: type, rotation: staticsRot });
			objects.push(mesh);
			scene.add(mesh);
		} else if (obj === modes[7]/* motion */) {
			const pos = getPlacementPosition('motion');
			const existing = findObjectAt(pos);

			if (existing) {
				if (existing.userData.deletePreview) {
					removePlacedObject(existing, true);
					return;
				}

				setWallColour(existing, 0xff0000);
				existing.userData.deletePreview = true;
				return;
			}

			const material = new THREE.MeshPhongMaterial({ color: colour2, shininess: 45, transparent: false});
			const deco = makemotionMesh(motion[motiont], material);
			deco.position.copy(pos);
			deco.userData.baseColor = colour2;
			deco.userData.deletePreview = false;
			deco.userData.networkId = sendObjToServer('motion', pos, colour2, { variant: motion[motiont], rotation: staticsRot });
			objects.push(deco);
			scene.add(deco);
		} else if (obj === modes[8]/* delete */) {
			const existing = getDeleteTargetFromCrosshair();
			if (!existing) return;
			removePlacedObject(existing, true);
		} else if (obj === modes[9]/* colourpicker */) {
			const pos = getPlacementPosition(obj);
			const existing = findObjectAt(pos);
			if (existing && existing.material && existing.material.color) {
				colour2 = existing.material.color.getHex();
			}
		}
	}
}
function sendObjToServer(objectType, position, color, details = {}) {
	const id = crypto.randomUUID();
	sendPacket({
		type: 'placeObject',
		objectType,
		position: { x: position.x, y: position.y, z: position.z },
		color,
		...details,
		id,
	});
	return id;
}

function addObjAtPosition(position, objectType, color, details = {}) {
	if (!position || !['wall', 'light', 'floor', 'ceiling', 'door', 'window', 'statics', 'motion'].includes(objectType)) return;
	const pos = new THREE.Vector3(position.x, position.y, position.z);
	const objectWidth = details.width ?? width;
	const objectRotation = details.rotation ?? false;
	if (objectType === 'wall') {
		const wallGeometry = objectRotation
			? new THREE.BoxGeometry(0.5, 3, objectWidth + 0.5)
			: new THREE.BoxGeometry(objectWidth + 0.5, 3, 0.5);
		const wall = createSolid(pos.x, pos.y, pos.z, wallGeometry.parameters.width, wallGeometry.parameters.height, wallGeometry.parameters.depth, color, wallGeometry);
		wall.userData.type = objectType;
		wall.userData.networkId = details.id;
	} else if (objectType === 'light') {
		const light = new THREE.PointLight(color, 1.5, 20);
		light.position.copy(pos);
		scene.add(light);
		const potLightMaterial = lightColour(color);
		potLightMaterial.depthWrite = false;
		potLightMaterial.depthTest = true;
		const potLight = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 32), potLightMaterial);
		potLight.position.copy(pos);
		potLight.userData.baseColor = color;
		potLight.userData.type = objectType;
		potLight.userData.networkId = details.id;
		scene.add(potLight);
		potLight.userData.light = light;
		light.userData.visual = potLight;
		objects.push(potLight);
		potLights.push(potLight);
	} else if (objectType === 'floor') {
		const floorGeometry = new THREE.BoxGeometry(objectWidth + 0.5, 0.5, objectWidth + 0.5);
		const floor = createSolid(pos.x, pos.y, pos.z, floorGeometry.parameters.width, floorGeometry.parameters.height, floorGeometry.parameters.depth, color, floorGeometry);
		floor.userData.baseColor = color;
		floor.userData.type = objectType;
		floor.userData.networkId = details.id;
	} else if (objectType === 'ceiling') {
		const ceilingGeometry = new THREE.BoxGeometry(objectWidth + 0.5, 0.5, objectWidth + 0.5);
		const ceiling = createSolid(pos.x, pos.y, pos.z, ceilingGeometry.parameters.width, ceilingGeometry.parameters.height, ceilingGeometry.parameters.depth, color, ceilingGeometry);
		ceiling.userData.baseColor = color;
		ceiling.userData.type = objectType;
		ceiling.userData.networkId = details.id;
	} else if (objectType === 'door') {
		const door = createDoorMesh(new THREE.MeshPhongMaterial({ color, shininess: 60 }), objectWidth, objectRotation);
		door.position.copy(pos);
		door.userData.baseColor = color;
		door.userData.type = objectType;
		door.userData.networkId = details.id;
		objects.push(door);
		scene.add(door);
	} else if (objectType === 'window') {
		const windowMesh = createWindowMesh(new THREE.MeshPhongMaterial({ color, shininess: 60 }), objectWidth, objectRotation);
		windowMesh.position.copy(pos);
		windowMesh.userData.baseColor = color;
		windowMesh.userData.type = objectType;
		windowMesh.userData.networkId = details.id;
		objects.push(windowMesh);
		scene.add(windowMesh);
	} else if (objectType === 'statics') {
		const variant = details.variant;
		if (!statics.includes(variant)) return;
		const mesh = createPlacedstatics(variant, color, details.rotation ?? 0);
		if (!mesh) return;
		mesh.position.copy(pos);
		mesh.userData.type = variant;
		mesh.userData.placementPos = pos.clone();
		mesh.userData.baseColor = color;
		mesh.userData.deletePreview = false;
		mesh.userData.networkId = details.id;
		mesh.position.y += poss[variant] ?? 0;
		objects.push(mesh);
		scene.add(mesh);
	} else if (objectType === 'motion') {
		const variant = details.variant;
		if (!motion.includes(variant)) return;
		const material = new THREE.MeshPhongMaterial({ color: color, shininess: 45, transparent: false });
		const deco = makemotionMesh(variant, material, details.rotation ?? 0);
		deco.position.copy(pos);
		deco.userData.baseColor = color;
		deco.userData.type = objectType;
		deco.userData.deletePreview = false;
		deco.userData.networkId = details.id;
		objects.push(deco);
		scene.add(deco);
	}
}

socket.addEventListener('message', (event) => {
	try {
		const packet = JSON.parse(event.data);
		if (packet.type === 'placeObject') {
			addObjAtPosition(packet.position, packet.objectType, packet.color, packet);
		} else if (packet.type === 'worldState' && Array.isArray(packet.objects)) {
			console.log(`Received world snapshot with ${packet.objects.length} object(s)`);
			packet.objects.forEach((placedObject) => {
				addObjAtPosition(placedObject.position, placedObject.objectType, placedObject.color, placedObject);
			});
		} else if (packet.type === 'deleteObject') {
			const object = objects.find((entry) => entry.userData.networkId === packet.id);
			if (object) removePlacedObject(object);
		} else if (packet.type === 'playerState' && Array.isArray(packet.players)) {
			packet.players.forEach(updateRemotePlayer);
		} else if (packet.type === 'playerPosition') {
			updateRemotePlayer(packet);
		} else if (packet.type === 'playerJoined') {
			console.log(`Another player joined (${packet.playerCount} connected)`);
		} else if (packet.type === 'playerLeft') {
			removeRemotePlayer(packet.playerId);
			console.log(`Another player left (${packet.playerCount} connected)`);
		}
	}
	catch (error) {
		console.error('Error handling placement packet:', error);
	}
});

document.addEventListener('keydown', (e) => {
	if (idleTime >= 3000) {
		console.log("You are no longer idle")
	}
	idleTime = 0
	const key = e.key.toLowerCase();
	keys[key] = true;
	if(key === 'r') {
		if (obj === 'statics' || obj === 'motion') {
			staticsRot = (staticsRot + 1) % 4;
		} else {
			rot = !rot;
		}
	}
	if(key === ' ') {
		toggle = !toggle;
	}
	if(e.key === '1') {
		obj = 'wall';
	}
	if(e.key === '2') {
		obj = 'light';
	}
	if (e.key === '3') {
		obj = 'floor';
	}
	if (e.key === '4') {
		obj = 'ceiling';
	}
	if (e.key === '5') {
		obj = 'door';
	}
	if (e.key === '6') {
		obj = 'window';
	}
	if (e.key === '7') {
		obj = 'statics';
	}
	if (e.key === '8') {
		obj = 'motion';
	}
	if (e.key === '9') {
		obj = 'delete';
	}
	if (e.key == '0') {
		obj = 'colourpicker'
	}
	if(e.key === ']') {
		if(obj == 'statics') {
			staticst = (staticst + 1) % statics.length;
		}
		if(obj == 'motion') {
			motiont = (motiont + 1) % motion.length;
		}
	}
	if(e.key == '[') {
		if(obj == 'statics') {
			staticst = (staticst - 1 + statics.length) % statics.length;
		}
		if(obj == 'motion') {
			motiont = (motiont - 1 + motion.length) % motion.length;
		}
	}
	if(key === 'e') {
		width += 0.5;
	}
	if(key === 'q') {
		if(width > 0.5) {
			width -= 0.5;
		}
	}
	if(key === 'l') {
		if (hue == 1) {
			const [h, s, v] = hexToHsl(colour2);
			hue = 0;
			colour2 = hslToHex(h, 0, v);
		} else {
			const [h,s,v] = hexToHsl(colour2)
			hue = 1
			colour2 = hslToHex(h, 100, v)
		}
	}
	if(key === 'm') {
		let [h, s, v] = hexToHsl(colour2)
		if(hue == 1) {
			console.log('hue')
			return;
		} else {
			v = v == 100 ? 0 : v == 0 ? 50 : 100
			console.log(h, s, v)
			colour2 = hslToHex(h, s, v)
		}
	}
	if(key === ',') {
		camera.position.y += 3
	}
	if(key === '.') {
		camera.position.y -= 3
	}
	if (key === 'z') {
		camera.position.y += 0.1875
	}
	if (key === 'x') {
		camera.position.y -= 0.1875
	}
	if (key === 'c') {
		sens -= 1
	}
	if (key === 'v') {
		sens += 1
	}
	if (key === 'k') {
		place()
	}
	sendPlayerPosition();
});
document.addEventListener('keyup', (e) => {
	const key = e.key.toLowerCase();
	keys[key] = false;
	idleTime = 0
});
document.addEventListener('click', () => {
	if (mouseX > 50 || mouseY > 390) {
		document.body.requestPointerLock();
	}
	place()
});
let modes = ['wall', 'light', 'floor', 'ceiling', 'door', 'window', 'statics', 'motion', 'delete', 'colourpicker'];
let statics = ['chair', 'table', 'stair', 'stairs', 'bench', 'stool', 'rug', 'lamp', 'sofa', 'bed', 'bookshelf', 'poster', 'vase', 'curtain'];
let motion = ['cabinet', 'shelf', 'desk', 'piano', 'wardrobe', 'clock', 'candle', ];
preloadstaticsModel('stair', './models/stair.glb',   { x: 1, y: 0.75, z: 1});
preloadstaticsModel('chair', './models/chair.glb',   { x: 0.7, y: 0.7, z: 0.7 });
preloadstaticsModel('table', './models/table.glb',   { x: 1, y: 0.6, z: 1 });
preloadstaticsModel('stairs', './models/stairs.glb', { x: 1, y: 0.75, z: 1})
let time = Date.now();
document.addEventListener('contextmenu', (e) => {
	e.preventDefault();
	state = (state + 1) % modes.length;
	obj = modes[state];
});
let mouseX, mouseY;
//50, 390
document.addEventListener('mousemove', (e) => {
	mouseX = e.clientX;
	mouseY = e.clientY;
	if (document.pointerLockElement === document.body) {
		camera.rotation.order = 'YXZ';
		camera.rotation.y -= e.movementX * 0.002 * sens;
		camera.rotation.x -= e.movementY * 0.002 * sens;
		camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
		idleTime = 0
	}
	sendPlayerPosition();
});
let state = 1
document.addEventListener('wheel', (e) => {
	const [h, s, l] = hexToHsl(colour2);
	if (hue == 1) {
		const step = 3;
		const newHue = (h + (e.deltaY < 0 ? step : -step) + 360) % 360;
		colour2 = hslToHex(newHue, s, l);
	} else {
		const step = 3;
		const newLevel = (l + (e.deltaY < 0 ? step : -step) + 100) % 100;
		colour2 = hslToHex(h, 0, newLevel);
	}
	console.log(colour2)
	document.getElementById('crosshair').style.backgroundColor = `#${(colour2 & 0xFFFFFF).toString(16).padStart(6, '0')}`;
});
document.getElementById('crosshair').style.backgroundColor = `#${(colour2 & 0xFFFFFF).toString(16).padStart(6, '0')}`;
let sens = 1;
let moveSpeed = 1;
let idleTime = 0
let sprint = true
camera.position.y = 1.6
keys['shift'] = false
function animate() {
	requestAnimationFrame(animate);
	updatePotLightVisibility();
	updateGhostLightVisibility();

	while (ghosts.length > 0) {
		const ghost = ghosts.pop();
		scene.remove(ghost);
	}

	if (!toggle) {
		objects.forEach((object) => {
			if (object.userData.baseColor !== undefined) {
				setWallColour(object, object.userData.baseColor);
			}
			object.userData.deletePreview = false;
		});
	} else {
		let targetObject = null;
		if (obj === 'delete') {
			targetObject = getDeleteTargetFromCrosshair();
		} else {
			const targetPosition = getPlacementPosition(obj);
			targetObject = findObjectAt(targetPosition);
		}

		objects.forEach((object) => {
			if (object.userData.deletePreview && (!targetObject || object !== targetObject)) {
				setWallColour(object, object.userData.baseColor ?? colour2);
				object.userData.deletePreview = false;
			}
		});

		if (targetObject) {
			setWallColour(targetObject, 0xff0000);
			targetObject.userData.deletePreview = true;
		}
	}
	sprint = false
	if(keys['shift']) moveSpeed = 3; else moveSpeed = 1;
	let diag = (.0707 / 2) * moveSpeed
	if(keys['w']) {
		const direction = new THREE.Vector3(0, 0, sprint ? -3 : -1).applyQuaternion(camera.quaternion);
		direction.y = 0;
		direction.normalize();
		camera.position.add(((keys['a'] && !keys['d']) || keys['d'] && !keys['a'] ? direction.multiplyScalar(diag) : direction.multiplyScalar(0.05 * moveSpeed)));
		sendPlayerPosition();
	}
	if(keys['s']) {
		const direction = new THREE.Vector3(0, 0, sprint ? 3 : 1).applyQuaternion(camera.quaternion);
		direction.y = 0;
		direction.normalize();
		camera.position.add(((keys['a'] && !keys['d']) || keys['d'] && !keys['a'] ? direction.multiplyScalar(diag) : direction.multiplyScalar(0.05 * moveSpeed)));
		sendPlayerPosition();
	}
	if(keys['a']) {
		camera.position.add((keys['w'] && !keys['s'] || keys['s'] && !keys['w'] ? new THREE.Vector3(-diag, 0, 0) : new THREE.Vector3(-0.05 * moveSpeed, 0, 0)).applyQuaternion(camera.quaternion));
		sendPlayerPosition();
	}
	if(keys['d']) {
		camera.position.add((keys['w'] && !keys['s'] || keys['s'] && !keys['w'] ? new THREE.Vector3(diag, 0, 0) : new THREE.Vector3(0.05 * moveSpeed, 0, 0)).applyQuaternion(camera.quaternion));
		sendPlayerPosition();
	}
	moveHitbox()
	if(toggle) {
		ghostObject();
	}
	const gamnam = 'phantomful'
	if (idleTime == 3000) console.log('You are now Idle');
	let action = toggle ? 'building' : 'wandering'
	document.title = idleTime >= 3000 ? `${gamnam} - Idle` : `${gamnam} - ${obj == 'delete' ? 'deleting' : action} ${
		action == 'wandering' ? '' : modes.indexOf(obj) < 6 ? `a ${obj}` : obj == 'delete' ? '' : obj
	}`
	document.getElementById("placement").innerHTML = obj == modes[0] ? "Placing Walls" : obj == modes[1] ? "Placing Lights" : obj == modes[2] ? "Placing Floors" : obj == modes[3] ? "Placing Ceilings" : obj == modes[4] ? "Placing Doors" : obj == modes[5] ? "Placing Windows" : obj == modes[6] && statics[staticst] == 'chair' ? "Placing Chairs" : obj == modes[6] && statics[staticst] == 'table' ? "Placing Tables" : obj == modes[6] && (statics[staticst] == 'stair' || statics[staticst] == 'stairs') ? "Placing Stairs" : obj == modes[6] ? "i didnt maek these yet awawa" : obj == modes[7] ? "these just straight up dont work sry" : obj == modes[8] ? "Deleting" : obj == modes[9] ? "yea nah im too lazy for ts" : "this text shouldnt even be showing rn whaaaaa"
	if (!toggle) document.getElementById("placement-type").style.display = 'none'; else document.getElementById("placement-type").style.display = 'block';
	idleTime++
	document.getElementById("coordinates").innerHTML = `
		X: ${camera.position.x.toFixed(2)},<br> Y: ${camera.position.y.toFixed(2)},<br> Z: ${camera.position.z.toFixed(2)} <br>
		Total Objects: ${objects.length} <br>
		Players: ${remotePlayers.size + 1} <br>
		Lights: ${lights.length} <br>
	`;
	renderer.render(scene, camera);
}
animate();