import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Play, n as VolumeX, o as Pause, r as Volume2, t as Zap } from "../_libs/lucide-react.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CdU13mIa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[opacity,transform,background-color,color] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakura/70 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-sakura text-ink hover:bg-sakura-deep",
			paper: "bg-paper text-ink hover:bg-paper-muted",
			outline: "border border-border-strong bg-ink-elevated/80 text-paper hover:bg-ink-soft",
			ghost: "text-paper-muted hover:bg-ink-soft hover:text-paper",
			danger: "bg-danger text-paper hover:opacity-90"
		},
		size: {
			default: "h-11 rounded-md px-4 text-sm",
			sm: "h-9 rounded-sm px-3 text-xs",
			lg: "h-12 rounded-lg px-6 text-base",
			icon: "size-11 rounded-md"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
var URLS = {
	map: "/map/shrine-base.jpg",
	title: "/game/title.jpg",
	yumi: "/sprites/yumi.png",
	ofuda: "/sprites/ofuda.png",
	kitsune: "/sprites/kitsune.png",
	taiko: "/sprites/taiko.png",
	imp: "/sprites/imp.png",
	tengu: "/sprites/tengu.png",
	oni: "/sprites/oni.png",
	yurei: "/sprites/yurei.png",
	boss: "/sprites/boss.png",
	arrow: "/sprites/arrow.png",
	ofudaShot: "/sprites/ofuda-shot.png",
	foxfire: "/sprites/foxfire.png",
	impact: "/sprites/impact.png",
	tree: "/props/tree.png",
	torii: "/props/torii.png",
	lantern: "/props/lantern.png",
	shrine: "/props/shrine.png"
};
function loadImage(src) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = () => reject(/* @__PURE__ */ new Error(`Failed to load ${src}`));
		img.src = src;
	});
}
async function loadAtlas() {
	const entries = await Promise.all(Object.keys(URLS).map(async (key) => {
		return [key, await loadImage(URLS[key])];
	}));
	return Object.fromEntries(entries);
}
var ctx = null;
var master = null;
var music = null;
var sfx = null;
var muted = false;
var musicStarted = false;
var oscillators = [];
function ac() {
	if (typeof window === "undefined") return null;
	if (!ctx) {
		ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
		master = ctx.createGain();
		music = ctx.createGain();
		sfx = ctx.createGain();
		master.gain.value = .7;
		music.gain.value = .22;
		sfx.gain.value = .55;
		music.connect(master);
		sfx.connect(master);
		master.connect(ctx.destination);
	}
	return ctx;
}
function unlockAudio() {
	const c = ac();
	if (!c) return;
	if (c.state === "suspended") c.resume();
	if (!musicStarted) {
		musicStarted = true;
		startBed();
	}
}
function setMuted(next) {
	muted = next;
	if (master && ctx) master.gain.setTargetAtTime(next ? 0 : .7, ctx.currentTime, .04);
}
function isMuted() {
	return muted;
}
function envGain(c, dest, peak, attack, release) {
	const g = c.createGain();
	g.gain.setValueAtTime(1e-4, c.currentTime);
	g.gain.exponentialRampToValueAtTime(peak, c.currentTime + attack);
	g.gain.exponentialRampToValueAtTime(1e-4, c.currentTime + attack + release);
	g.connect(dest);
	return g;
}
function tone(freq, dur, type, peak, dest) {
	const c = ac();
	if (!c || !dest) return;
	const o = c.createOscillator();
	o.type = type;
	o.frequency.value = freq;
	const g = envGain(c, dest, peak, .01, dur);
	o.connect(g);
	o.start();
	o.stop(c.currentTime + dur + .05);
}
function noise(dur, peak, dest, hp = 400) {
	const c = ac();
	if (!c || !dest) return;
	const n = c.createBufferSource();
	const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
	const data = buf.getChannelData(0);
	for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
	n.buffer = buf;
	const filter = c.createBiquadFilter();
	filter.type = "highpass";
	filter.frequency.value = hp;
	const g = envGain(c, dest, peak, .005, dur * .9);
	n.connect(filter);
	filter.connect(g);
	n.start();
}
function startBed() {
	if (!ac() || !music) return;
	makeDrone(73.4, 0, .09);
	makeDrone(110, 6, .045);
	const phrase = [
		146.83,
		174.61,
		196,
		220,
		196,
		164.81
	];
	let step = 0;
	const tick = () => {
		if (!ctx || !musicStarted) return;
		if (!muted && music) {
			const f = phrase[step % phrase.length];
			tone(f, 2.6, "sine", .03, music);
			if (step % 6 === 0) tone(f * .5, 3.4, "triangle", .032, music);
			if (step % 3 === 1) tone(f * 1.498, 1.8, "sine", .014, music);
		}
		step++;
		window.setTimeout(tick, 2800);
	};
	tick();
}
function makeDrone(freq, detune, gain) {
	const c = ac();
	if (!c || !music) return;
	const o = c.createOscillator();
	o.type = "sine";
	o.frequency.value = freq;
	o.detune.value = detune;
	const g = c.createGain();
	g.gain.value = gain;
	o.connect(g);
	g.connect(music);
	o.start();
	oscillators.push(o);
}
function playSfx(name) {
	const c = ac();
	if (!c || !sfx || muted) return;
	if (c.state === "suspended") c.resume();
	const rate = 1 + (Math.random() * .12 - .06);
	switch (name) {
		case "place":
			tone(330 * rate, .12, "triangle", .2, sfx);
			tone(495 * rate, .18, "sine", .12, sfx);
			break;
		case "deny":
			tone(140, .12, "square", .08, sfx);
			break;
		case "shoot":
			tone(740 * rate, .07, "triangle", .09, sfx);
			tone(980 * rate, .05, "sine", .05, sfx);
			break;
		case "seal":
			tone(520 * rate, .1, "sine", .1, sfx);
			tone(780 * rate, .14, "triangle", .06, sfx);
			break;
		case "fox":
			noise(.08, .05, sfx, 900);
			tone(310 * rate, .12, "sine", .07, sfx);
			break;
		case "drum":
			tone(90, .18, "sine", .28, sfx);
			noise(.12, .18, sfx, 200);
			tone(420, .08, "square", .06, sfx);
			break;
		case "hit":
			tone(210 * rate, .04, "triangle", .04, sfx);
			break;
		case "crit":
			tone(880 * rate, .08, "sine", .1, sfx);
			tone(1320 * rate, .1, "triangle", .07, sfx);
			break;
		case "enrage":
			tone(70, .4, "sawtooth", .12, sfx);
			noise(.3, .14, sfx, 80);
			break;
		case "death":
			tone(523, .12, "sine", .1, sfx);
			tone(392, .2, "triangle", .08, sfx);
			break;
		case "leak":
			tone(180, .25, "sawtooth", .1, sfx);
			tone(120, .35, "sine", .12, sfx);
			break;
		case "wave":
			tone(196, .18, "triangle", .14, sfx);
			tone(294, .22, "sine", .1, sfx);
			tone(392, .28, "triangle", .08, sfx);
			break;
		case "win":
			[
				392,
				494,
				587,
				784
			].forEach((f, i) => setTimeout(() => tone(f, .35, "triangle", .16, sfx), i * 140));
			break;
		case "lose":
			[
				330,
				247,
				196,
				147
			].forEach((f, i) => setTimeout(() => tone(f, .32, "sine", .14, sfx), i * 180));
			break;
		case "upgrade":
			tone(440, .1, "sine", .12, sfx);
			tone(660, .16, "triangle", .1, sfx);
			break;
		case "sell": tone(260, .1, "triangle", .1, sfx);
	}
}
function resumeIfNeeded() {
	if (ctx && ctx.state === "suspended") ctx.resume();
}
var WORLD_W = 1280;
WORLD_W / 20;
var SELL_RATE = .65;
var SAVE_KEY = "sakura-sentinel-v1";
/** Path through the shrine garden, in world pixels. Tuned to the painted map. */
var WAYPOINTS = [
	{
		x: 0,
		y: 292
	},
	{
		x: 118,
		y: 278
	},
	{
		x: 228,
		y: 286
	},
	{
		x: 312,
		y: 348
	},
	{
		x: 368,
		y: 456
	},
	{
		x: 452,
		y: 502
	},
	{
		x: 548,
		y: 430
	},
	{
		x: 610,
		y: 318
	},
	{
		x: 672,
		y: 256
	},
	{
		x: 768,
		y: 268
	},
	{
		x: 872,
		y: 332
	},
	{
		x: 980,
		y: 372
	},
	{
		x: 1104,
		y: 350
	},
	{
		x: 1220,
		y: 338
	},
	{
		x: 1280,
		y: 336
	}
];
var TOWERS = {
	yumi: {
		id: "yumi",
		name: "Yumi Nest",
		title: "Shrine archer",
		blurb: "Arrows. Consecrate for pierce and crits.",
		cost: 70,
		damage: 16,
		range: 168,
		fireRate: 1.15,
		projectileSpeed: 520,
		splash: 0,
		slow: 0,
		slowTime: 0,
		chain: 0,
		damageType: "physical",
		color: "#e85a8a"
	},
	ofuda: {
		id: "ofuda",
		name: "Ofuda Altar",
		title: "Talisman mage",
		blurb: "Splash seals. Rank III plants wards.",
		cost: 110,
		damage: 12,
		range: 150,
		fireRate: .9,
		projectileSpeed: 380,
		splash: 72,
		slow: 0,
		slowTime: 0,
		chain: 0,
		damageType: "magic",
		color: "#e8c9a0"
	},
	kitsune: {
		id: "kitsune",
		name: "Kitsune Beacon",
		title: "Foxfire slow",
		blurb: "Foxfire slow. Rank III is an aura.",
		cost: 130,
		damage: 5,
		range: 142,
		fireRate: 1.45,
		projectileSpeed: 340,
		splash: 0,
		slow: .45,
		slowTime: 1.8,
		chain: 0,
		damageType: "magic",
		color: "#4a8b74"
	},
	taiko: {
		id: "taiko",
		name: "Raijin Taiko",
		title: "Storm drum",
		blurb: "Chain lightning. Rank III stuns.",
		cost: 190,
		damage: 34,
		range: 186,
		fireRate: .72,
		projectileSpeed: 0,
		splash: 0,
		slow: 0,
		slowTime: 0,
		chain: 3,
		damageType: "magic",
		color: "#d45b5b"
	}
};
var ENEMIES = {
	imp: {
		id: "imp",
		name: "Oni Imp",
		hp: 38,
		speed: 58,
		gold: 7,
		armor: 0,
		resist: 0,
		radius: 14,
		scale: .72
	},
	tengu: {
		id: "tengu",
		name: "Karasu Tengu",
		hp: 26,
		speed: 102,
		gold: 9,
		armor: 0,
		resist: 0,
		radius: 15,
		scale: .78
	},
	oni: {
		id: "oni",
		name: "Oni Brute",
		hp: 150,
		speed: 38,
		gold: 16,
		armor: .42,
		resist: .08,
		radius: 20,
		scale: 1.05
	},
	yurei: {
		id: "yurei",
		name: "Yurei",
		hp: 58,
		speed: 74,
		gold: 12,
		armor: 0,
		resist: .38,
		radius: 16,
		scale: .9
	},
	boss: {
		id: "boss",
		name: "Oni Daimyo",
		hp: 1320,
		speed: 30,
		gold: 90,
		armor: .22,
		resist: .18,
		radius: 28,
		scale: 1.45
	}
};
var WAVES = [
	{
		id: 1,
		name: "First Footfalls",
		spawns: [{
			kind: "imp",
			count: 8,
			interval: .85,
			delay: 0
		}]
	},
	{
		id: 2,
		name: "Imp Tide",
		spawns: [{
			kind: "imp",
			count: 14,
			interval: .62,
			delay: 0
		}]
	},
	{
		id: 3,
		name: "Crow Scouts",
		spawns: [{
			kind: "imp",
			count: 8,
			interval: .7,
			delay: 0
		}, {
			kind: "tengu",
			count: 5,
			interval: .9,
			delay: 2.4
		}]
	},
	{
		id: 4,
		name: "Tengu Rush",
		spawns: [{
			kind: "tengu",
			count: 12,
			interval: .5,
			delay: 0
		}]
	},
	{
		id: 5,
		name: "Iron Horns",
		spawns: [{
			kind: "oni",
			count: 5,
			interval: 1.4,
			delay: 0
		}, {
			kind: "imp",
			count: 10,
			interval: .55,
			delay: 1
		}]
	},
	{
		id: 6,
		name: "Mixed Host",
		spawns: [{
			kind: "tengu",
			count: 8,
			interval: .55,
			delay: 0
		}, {
			kind: "oni",
			count: 5,
			interval: 1.2,
			delay: 2
		}]
	},
	{
		id: 7,
		name: "Pale Procession",
		spawns: [{
			kind: "yurei",
			count: 12,
			interval: .65,
			delay: 0
		}]
	},
	{
		id: 8,
		name: "Grave and Steel",
		spawns: [{
			kind: "oni",
			count: 6,
			interval: 1.1,
			delay: 0
		}, {
			kind: "yurei",
			count: 8,
			interval: .7,
			delay: 1.5
		}]
	},
	{
		id: 9,
		name: "The Gathering",
		spawns: [
			{
				kind: "imp",
				count: 8,
				interval: .45,
				delay: 0
			},
			{
				kind: "tengu",
				count: 8,
				interval: .5,
				delay: 1
			},
			{
				kind: "oni",
				count: 5,
				interval: 1,
				delay: 3
			},
			{
				kind: "yurei",
				count: 6,
				interval: .7,
				delay: 4
			}
		]
	},
	{
		id: 10,
		name: "Daimyo's March",
		spawns: [
			{
				kind: "oni",
				count: 6,
				interval: 1.1,
				delay: 0
			},
			{
				kind: "yurei",
				count: 8,
				interval: .65,
				delay: 2
			},
			{
				kind: "boss",
				count: 1,
				interval: 1,
				delay: 8
			}
		]
	}
];
var TOWER_ORDER = [
	"yumi",
	"ofuda",
	"kitsune",
	"taiko"
];
var WAVE_HINTS = [
	"Imps. Place Yumi on a pale pad.",
	"More imps. Consecrate if you can.",
	"Tengu run. Pierce or splash holds them.",
	"Tengu rush. Slow the file or they leak.",
	"Oni armor. Magic hurts; arrows tick.",
	"Mixed host. Keep physical and magic.",
	"Yurei resist magic. Keep a Yumi.",
	"Oni and ghosts. Split your rites.",
	"Everything at once. Cover both damage types.",
	"Daimyo. Mixed armor. Slow and stun him — he rages at half."
];
function earlyCallGold(prep) {
	return prep > 2 ? Math.floor(prep * 1.5) : 0;
}
function waveHint(wave, waveActive) {
	const i = waveActive ? wave - 1 : wave;
	return WAVE_HINTS[Math.max(0, Math.min(WAVE_HINTS.length - 1, i))] ?? "";
}
var PROP_PLACEMENTS = [
	{
		id: "shrine",
		x: 148,
		y: 168,
		scale: .72
	},
	{
		id: "tree",
		x: 250,
		y: 132,
		scale: .95
	},
	{
		id: "tree",
		x: 742,
		y: 118,
		scale: 1.05
	},
	{
		id: "tree",
		x: 1088,
		y: 168,
		scale: .88
	},
	{
		id: "lantern",
		x: 360,
		y: 248,
		scale: .55
	},
	{
		id: "lantern",
		x: 640,
		y: 210,
		scale: .52
	},
	{
		id: "lantern",
		x: 980,
		y: 268,
		scale: .55
	},
	{
		id: "lantern",
		x: 210,
		y: 430,
		scale: .5
	},
	{
		id: "torii",
		x: 1210,
		y: 372,
		scale: .82
	}
];
function cellCenter(col, row) {
	return {
		x: (col + .5) * 64,
		y: (row + .5) * 60
	};
}
function distToPath(x, y) {
	let best = Infinity;
	for (let i = 0; i < WAYPOINTS.length - 1; i++) {
		const a = WAYPOINTS[i];
		const b = WAYPOINTS[i + 1];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const len2 = dx * dx + dy * dy || 1;
		let t = ((x - a.x) * dx + (y - a.y) * dy) / len2;
		t = Math.max(0, Math.min(1, t));
		const px = a.x + dx * t;
		const py = a.y + dy * t;
		const d = Math.hypot(x - px, y - py);
		if (d < best) best = d;
	}
	return best;
}
function isWater(col, row) {
	return row >= 10;
}
function isBuildableCell(col, row) {
	if (col < 0 || row < 0 || col >= 20 || row >= 12) return false;
	if (isWater(col, row)) return false;
	const { x, y } = cellCenter(col, row);
	const d = distToPath(x, y);
	return d > 42 && d < 118;
}
function pathLength() {
	let len = 0;
	for (let i = 0; i < WAYPOINTS.length - 1; i++) len += Math.hypot(WAYPOINTS[i + 1].x - WAYPOINTS[i].x, WAYPOINTS[i + 1].y - WAYPOINTS[i].y);
	return len;
}
var PATH_LEN = pathLength();
var RANKS = {
	yumi: [
		{
			name: "Yumi Nest",
			cost: 0,
			blurb: "Fast single-target arrows.",
			damage: 16,
			range: 168,
			fireRate: 1.15,
			splash: 0,
			slow: 0,
			slowTime: 0,
			chain: 0,
			pierce: 0,
			crit: 0,
			aura: 0,
			stun: 0,
			aftershock: false
		},
		{
			name: "Blessed String",
			cost: 80,
			blurb: "Arrows pierce one yokai.",
			damage: 22,
			range: 186,
			fireRate: 1.35,
			splash: 0,
			slow: 0,
			slowTime: 0,
			chain: 0,
			pierce: 1,
			crit: 0,
			aura: 0,
			stun: 0,
			aftershock: false
		},
		{
			name: "Moonbow",
			cost: 150,
			blurb: "Pierce two. 25% moon crits.",
			damage: 30,
			range: 210,
			fireRate: 1.5,
			splash: 0,
			slow: 0,
			slowTime: 0,
			chain: 0,
			pierce: 2,
			crit: .25,
			aura: 0,
			stun: 0,
			aftershock: false
		}
	],
	ofuda: [
		{
			name: "Ofuda Altar",
			cost: 0,
			blurb: "Splash talismans.",
			damage: 12,
			range: 150,
			fireRate: .9,
			splash: 72,
			slow: 0,
			slowTime: 0,
			chain: 0,
			pierce: 0,
			crit: 0,
			aura: 0,
			stun: 0,
			aftershock: false
		},
		{
			name: "Seal Storm",
			cost: 95,
			blurb: "Wider burst. Stronger seals.",
			damage: 18,
			range: 162,
			fireRate: 1,
			splash: 96,
			slow: 0,
			slowTime: 0,
			chain: 0,
			pierce: 0,
			crit: 0,
			aura: 0,
			stun: 0,
			aftershock: false
		},
		{
			name: "Ward Array",
			cost: 170,
			blurb: "Impacts leave a burning ward.",
			damage: 24,
			range: 176,
			fireRate: 1.08,
			splash: 118,
			slow: .15,
			slowTime: 1.2,
			chain: 0,
			pierce: 0,
			crit: 0,
			aura: 0,
			stun: 0,
			aftershock: true
		}
	],
	kitsune: [
		{
			name: "Kitsune Beacon",
			cost: 0,
			blurb: "Foxfire slow on hit.",
			damage: 5,
			range: 142,
			fireRate: 1.45,
			splash: 0,
			slow: .45,
			slowTime: 1.8,
			chain: 0,
			pierce: 0,
			crit: 0,
			aura: 0,
			stun: 0,
			aftershock: false
		},
		{
			name: "Twin Tails",
			cost: 100,
			blurb: "Heavier slow. Hits splash chill.",
			damage: 8,
			range: 156,
			fireRate: 1.6,
			splash: 48,
			slow: .55,
			slowTime: 2.2,
			chain: 0,
			pierce: 0,
			crit: 0,
			aura: 0,
			stun: 0,
			aftershock: false
		},
		{
			name: "Foxfire Circle",
			cost: 180,
			blurb: "Always-on slow aura in range.",
			damage: 11,
			range: 170,
			fireRate: 1.75,
			splash: 56,
			slow: .62,
			slowTime: 2.4,
			chain: 0,
			pierce: 0,
			crit: 0,
			aura: .35,
			stun: 0,
			aftershock: false
		}
	],
	taiko: [
		{
			name: "Raijin Taiko",
			cost: 0,
			blurb: "Chain lightning. Three leaps.",
			damage: 34,
			range: 186,
			fireRate: .72,
			splash: 0,
			slow: 0,
			slowTime: 0,
			chain: 3,
			pierce: 0,
			crit: 0,
			aura: 0,
			stun: 0,
			aftershock: false
		},
		{
			name: "Thunder Roll",
			cost: 140,
			blurb: "Four leaps. Harder strikes.",
			damage: 46,
			range: 204,
			fireRate: .82,
			splash: 0,
			slow: 0,
			slowTime: 0,
			chain: 4,
			pierce: 0,
			crit: 0,
			aura: 0,
			stun: 0,
			aftershock: false
		},
		{
			name: "Raijin's Fury",
			cost: 220,
			blurb: "Five leaps. Primary target stuns.",
			damage: 60,
			range: 220,
			fireRate: .92,
			splash: 0,
			slow: 0,
			slowTime: 0,
			chain: 5,
			pierce: 0,
			crit: 0,
			aura: 0,
			stun: .55,
			aftershock: false
		}
	]
};
function rankOf(kind, level) {
	const list = RANKS[kind];
	return list[Math.max(0, Math.min(list.length - 1, level - 1))];
}
function nextRank(kind, level) {
	return RANKS[kind][level] ?? null;
}
function towerStats(kind, level) {
	return rankOf(kind, level);
}
var ROMAN = [
	"I",
	"II",
	"III"
];
function rankTags(r) {
	const tags = [];
	if (r.pierce > 0) tags.push(`Pierce ${r.pierce}`);
	if (r.crit > 0) tags.push(`${Math.round(r.crit * 100)}% crit`);
	if (r.splash > 0) tags.push(`Splash ${Math.round(r.splash)}`);
	if (r.slow > 0 && r.aura <= 0) tags.push(`${Math.round(r.slow * 100)}% slow`);
	if (r.chain > 0) tags.push(`Chain ${r.chain}`);
	if (r.aura > 0) tags.push(`${Math.round(r.aura * 100)}% aura`);
	if (r.stun > 0) tags.push(`Stun ${r.stun.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")}s`);
	if (r.aftershock) tags.push("Wards");
	return tags;
}
var initial = {
	gold: 240,
	lives: 12,
	wave: 0,
	waveName: "Prepare",
	waveActive: false,
	waveHint: "",
	prep: 12,
	callBonus: 0,
	speed: 1,
	targeting: "first",
	selectedKind: "yumi",
	selectedLevel: 0,
	selectedSpent: 0,
	selectedKindPlaced: null,
	selectedRankName: "",
	selectedPerk: "",
	nextRankName: "",
	nextPerk: "",
	upgradeCost: 0,
	remaining: 0,
	muted: false,
	paused: false,
	won: false,
	lost: false,
	kills: 0,
	score: 0,
	best: 0
};
var useHud = create(() => ({ ...initial }));
function patchHud(partial) {
	useHud.setState(partial);
}
function resetHud(best) {
	useHud.setState({
		...initial,
		best,
		selectedKind: "yumi"
	});
}
function sheetFrame(ctx, img, frame, cols, rows, dx, dy, dw, dh, flip) {
	const fw = img.width / cols;
	const fh = img.height / rows;
	const i = (frame % (cols * rows) + cols * rows) % (cols * rows);
	const sx = i % cols * fw;
	const sy = Math.floor(i / cols) * fh;
	ctx.save();
	ctx.translate(dx, dy);
	if (flip) ctx.scale(-1, 1);
	ctx.drawImage(img, sx, sy, fw, fh, -dw / 2, -dh, dw, dh);
	ctx.restore();
}
function drawImageFeet(ctx, img, x, y, h, recoil = 0) {
	const w = h * (img.width / img.height);
	const squash = 1 - recoil * .08;
	ctx.drawImage(img, x - w / 2, y - h * squash, w, h * squash);
}
function pathGlow(ctx) {
	ctx.save();
	ctx.lineJoin = "round";
	ctx.lineCap = "round";
	ctx.strokeStyle = "rgba(243, 236, 228, 0.16)";
	ctx.lineWidth = 46;
	ctx.beginPath();
	ctx.moveTo(WAYPOINTS[0].x, WAYPOINTS[0].y);
	for (let i = 1; i < WAYPOINTS.length; i++) ctx.lineTo(WAYPOINTS[i].x, WAYPOINTS[i].y);
	ctx.stroke();
	ctx.strokeStyle = "rgba(232, 90, 138, 0.12)";
	ctx.lineWidth = 22;
	ctx.stroke();
	ctx.restore();
}
function buildPads(ctx, sim) {
	if (!sim.selectedKind) return;
	for (let r = 0; r < 12; r++) for (let c = 0; c < 20; c++) {
		if (!isBuildableCell(c, r)) continue;
		const occupied = sim.towers.some((t) => t.col === c && t.row === r);
		const x = (c + .5) * 64;
		const y = (r + .5) * 60;
		const hover = sim.hoverCol === c && sim.hoverRow === r;
		ctx.beginPath();
		ctx.arc(x, y, 16, 0, Math.PI * 2);
		ctx.fillStyle = occupied ? "rgba(212, 91, 91, 0.18)" : hover ? "rgba(232, 90, 138, 0.35)" : "rgba(243, 236, 228, 0.12)";
		ctx.fill();
		ctx.strokeStyle = occupied ? "rgba(212, 91, 91, 0.5)" : "rgba(243, 236, 228, 0.28)";
		ctx.lineWidth = 1.5;
		ctx.stroke();
	}
}
function rangeRing(ctx, x, y, range, ok) {
	ctx.beginPath();
	ctx.arc(x, y, range, 0, Math.PI * 2);
	ctx.fillStyle = ok ? "rgba(232, 90, 138, 0.08)" : "rgba(212, 91, 91, 0.1)";
	ctx.fill();
	ctx.strokeStyle = ok ? "rgba(232, 90, 138, 0.55)" : "rgba(212, 91, 91, 0.55)";
	ctx.lineWidth = 2;
	ctx.setLineDash([6, 6]);
	ctx.stroke();
	ctx.setLineDash([]);
}
function hpBar(ctx, x, y, w, ratio, boss) {
	const h = boss ? 6 : 4;
	ctx.fillStyle = "rgba(12, 11, 16, 0.7)";
	ctx.fillRect(x - w / 2, y, w, h);
	ctx.fillStyle = ratio > .5 ? "#4a8b74" : ratio > .25 ? "#e8c9a0" : "#d45b5b";
	ctx.fillRect(x - w / 2, y, w * Math.max(0, ratio), h);
}
function ambientPetals(ctx, t) {
	for (let i = 0; i < 18; i++) {
		const seed = i * 17.13;
		const x = (seed * 90 + t * (12 + i % 5 * 6)) % (WORLD_W + 40) - 20;
		const y = (Math.sin(t * .4 + seed) * 40 + (i * 83 + t * 18) % 720 + 720) % 720;
		const rot = t * .6 + seed;
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(rot);
		ctx.fillStyle = i % 3 === 0 ? "rgba(232, 90, 138, 0.55)" : "rgba(243, 236, 228, 0.4)";
		ctx.beginPath();
		ctx.ellipse(0, 0, 4.5, 2.4, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
}
function rankOrnaments(ctx, kind, level, x, y, elapsed) {
	if (level < 2) return;
	const pulse = .5 + .5 * Math.sin(elapsed * 3);
	if (kind === "yumi") {
		ctx.save();
		ctx.strokeStyle = level >= 3 ? `rgba(232, 90, 138, ${.5 + pulse * .3})` : `rgba(232, 201, 160, ${.4 + pulse * .2})`;
		ctx.lineWidth = level >= 3 ? 2.2 : 1.6;
		ctx.beginPath();
		ctx.arc(x + 18, y - 52, 8, -.7, 2.3);
		ctx.stroke();
		if (level >= 3) for (let i = 0; i < 5; i++) {
			const a = elapsed * 1.5 + i * 1.256;
			ctx.fillStyle = "rgba(232, 90, 138, 0.75)";
			ctx.beginPath();
			ctx.ellipse(x + Math.cos(a) * 22, y - 38 + Math.sin(a) * 11, 3.2, 1.6, a, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();
	}
	if (kind === "ofuda" && level >= 3) for (let i = 0; i < 3; i++) {
		const a = elapsed * 1.7 + i * Math.PI * 2 / 3;
		ctx.fillStyle = "rgba(232, 201, 160, 0.88)";
		ctx.fillRect(x + Math.cos(a) * 16 - 3, y - 38 + Math.sin(a) * 11 - 6, 6, 11);
	}
	if (kind === "taiko") {
		ctx.strokeStyle = `rgba(212, 91, 91, ${.28 + pulse * .4})`;
		ctx.lineWidth = level >= 3 ? 2.2 : 1.4;
		ctx.beginPath();
		ctx.arc(x, y - 28, 12 + level * 5 + pulse * 3, 0, Math.PI * 2);
		ctx.stroke();
	}
}
function renderFrame(ctx, sim, atlas, reducedMotion) {
	const shake = reducedMotion ? 0 : sim.trauma * sim.trauma;
	const ox = (Math.sin(sim.elapsed * 37) * 10 + Math.sin(sim.elapsed * 53) * 6) * shake;
	const oy = (Math.cos(sim.elapsed * 41) * 8 + Math.sin(sim.elapsed * 29) * 5) * shake;
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	const scaleX = ctx.canvas.width / WORLD_W;
	const scaleY = ctx.canvas.height / 720;
	ctx.setTransform(scaleX, 0, 0, scaleY, ox * scaleX, oy * scaleY);
	ctx.drawImage(atlas.map, 0, 0, WORLD_W, 720);
	pathGlow(ctx);
	buildPads(ctx, sim);
	for (const z of sim.zones) {
		if (!z.alive) continue;
		const a = Math.max(0, z.life / z.max);
		ctx.beginPath();
		ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
		ctx.fillStyle = `rgba(232, 90, 138, ${.12 * a})`;
		ctx.fill();
		ctx.strokeStyle = `rgba(232, 90, 138, ${.45 * a})`;
		ctx.lineWidth = 2;
		ctx.stroke();
	}
	ambientPetals(ctx, sim.petalT);
	const items = [];
	for (const prop of PROP_PLACEMENTS) {
		const img = atlas[prop.id];
		const h = (prop.id === "tree" ? 210 : prop.id === "torii" ? 168 : prop.id === "shrine" ? 150 : 78) * prop.scale;
		items.push({
			y: prop.y,
			draw: () => drawImageFeet(ctx, img, prop.x, prop.y, h)
		});
	}
	for (const t of sim.towers) {
		const img = atlas[t.kind];
		const h = (t.kind === "taiko" ? 96 : t.kind === "kitsune" ? 88 : 92) * (1 + (t.level - 1) * .1);
		const stats = towerStats(t.kind, t.level);
		items.push({
			y: t.y + 8,
			draw: () => {
				if (sim.selectedTower === t.id) {
					rangeRing(ctx, t.x, t.y, stats.range, true);
					const nxt = nextRank(t.kind, t.level);
					if (nxt && nxt.range > stats.range + 1) {
						ctx.beginPath();
						ctx.arc(t.x, t.y, nxt.range, 0, Math.PI * 2);
						ctx.strokeStyle = "rgba(232, 201, 160, 0.38)";
						ctx.lineWidth = 1.5;
						ctx.setLineDash([3, 7]);
						ctx.stroke();
						ctx.setLineDash([]);
					}
				}
				if (t.level > 1) {
					ctx.beginPath();
					ctx.ellipse(t.x, t.y + 8, 20 + t.level * 2, 7, 0, 0, Math.PI * 2);
					ctx.strokeStyle = t.level >= 3 ? "rgba(232, 90, 138, 0.8)" : "rgba(232, 201, 160, 0.6)";
					ctx.lineWidth = t.level >= 3 ? 2.4 : 1.6;
					ctx.stroke();
				}
				rankOrnaments(ctx, t.kind, t.level, t.x, t.y, sim.elapsed);
				if (stats.aura > 0) {
					const pulse = .5 + .5 * Math.sin(sim.elapsed * 2.4);
					ctx.beginPath();
					ctx.arc(t.x, t.y, stats.range, 0, Math.PI * 2);
					ctx.fillStyle = `rgba(74, 139, 116, ${.07 + pulse * .06})`;
					ctx.fill();
					ctx.strokeStyle = `rgba(74, 139, 116, ${.3 + pulse * .25})`;
					ctx.setLineDash([4, 6]);
					ctx.lineWidth = 1.5;
					ctx.stroke();
					ctx.setLineDash([]);
				}
				if (t.flash > 0) {
					ctx.save();
					ctx.globalAlpha = .55 + t.flash;
					ctx.shadowColor = "#e8c9a0";
					ctx.shadowBlur = 18;
				}
				drawImageFeet(ctx, img, t.x, t.y + 10, h, t.recoil);
				if (t.flash > 0) ctx.restore();
				ctx.fillStyle = t.level >= 3 ? "#e85a8a" : "#e8c9a0";
				ctx.font = "700 11px 'DM Sans', sans-serif";
				ctx.textAlign = "center";
				ctx.fillText(ROMAN[t.level - 1] ?? "I", t.x, t.y + 20);
			}
		});
	}
	if (sim.selectedKind && sim.hoverCol >= 0) {
		const ok = isBuildableCell(sim.hoverCol, sim.hoverRow) && !sim.towers.some((t) => t.col === sim.hoverCol && t.row === sim.hoverRow);
		const x = (sim.hoverCol + .5) * 64;
		const y = (sim.hoverRow + .5) * 60;
		const stats = towerStats(sim.selectedKind, 1);
		items.push({
			y: y + 6,
			draw: () => {
				rangeRing(ctx, x, y, stats.range, ok);
				ctx.globalAlpha = .7;
				drawImageFeet(ctx, atlas[sim.selectedKind], x, y + 10, 88);
				ctx.globalAlpha = 1;
			}
		});
	}
	for (const e of sim.enemies) {
		if (!e.alive) continue;
		const def = ENEMIES[e.kind];
		const img = atlas[e.kind];
		const h = (e.kind === "boss" ? 110 : e.kind === "oni" ? 86 : 72) * def.scale;
		const frame = Math.floor(e.bob * .7) % 4;
		const bobY = e.kind === "yurei" ? Math.sin(e.bob) * 4 : 0;
		items.push({
			y: e.y,
			draw: () => {
				if (e.flash > 0) {
					ctx.save();
					ctx.filter = "brightness(2.4)";
				}
				sheetFrame(ctx, img, frame, 2, 2, e.x, e.y + bobY, h * .92, h, e.facing < 0);
				if (e.flash > 0) ctx.restore();
				if (e.slow > 0) {
					ctx.strokeStyle = "rgba(74, 139, 116, 0.7)";
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.arc(e.x, e.y - h * .45, 16, 0, Math.PI * 2);
					ctx.stroke();
				}
				if (e.stunT > 0) {
					ctx.strokeStyle = "rgba(232, 201, 160, 0.9)";
					ctx.lineWidth = 2;
					ctx.beginPath();
					ctx.arc(e.x, e.y - h * .55, 11, 0, Math.PI * 2);
					ctx.stroke();
				}
				if (e.enraged) {
					ctx.strokeStyle = "rgba(212, 91, 91, 0.85)";
					ctx.lineWidth = 3;
					ctx.beginPath();
					ctx.arc(e.x, e.y - h * .4, 24 + Math.sin(e.bob) * 2, 0, Math.PI * 2);
					ctx.stroke();
				}
				hpBar(ctx, e.x, e.y - h - 8, e.kind === "boss" ? 64 : 36, e.hp / e.maxHp, e.kind === "boss");
			}
		});
	}
	items.sort((a, b) => a.y - b.y);
	for (const it of items) it.draw();
	for (const p of sim.projectiles) {
		if (!p.alive) continue;
		const img = p.kind === "yumi" ? atlas.arrow : p.kind === "ofuda" ? atlas.ofudaShot : atlas.foxfire;
		const frame = Math.floor(sim.elapsed * 10) % 4;
		ctx.save();
		ctx.translate(p.x, p.y);
		ctx.rotate(p.rot);
		const s = (p.kind === "ofuda" ? 28 : 22) * (1 + Math.min(p.pierce, 2) * .14);
		const fw = img.width / 2;
		const fh = img.height / 2;
		const i = frame % 4;
		if (p.pierce > 0 || p.crit > 0) {
			ctx.shadowColor = "#e85a8a";
			ctx.shadowBlur = 10;
		}
		ctx.drawImage(img, i % 2 * fw, Math.floor(i / 2) * fh, fw, fh, -s / 2, -s / 2, s, s);
		ctx.restore();
	}
	for (const b of sim.beams) {
		ctx.save();
		ctx.strokeStyle = `rgba(232, 201, 160, ${Math.max(0, b.life * 5)})`;
		ctx.lineWidth = 3;
		ctx.shadowColor = "#e8c9a0";
		ctx.shadowBlur = 8;
		ctx.beginPath();
		ctx.moveTo(b.points[0].x, b.points[0].y);
		for (let i = 1; i < b.points.length; i++) {
			const a = b.points[i - 1];
			const c = b.points[i];
			const mx = (a.x + c.x) / 2 + (Math.random() - .5) * 10;
			const my = (a.y + c.y) / 2 + (Math.random() - .5) * 10;
			ctx.lineTo(mx, my);
			ctx.lineTo(c.x, c.y);
		}
		ctx.stroke();
		ctx.restore();
	}
	for (const p of sim.particles) {
		if (!p.alive) continue;
		ctx.globalAlpha = Math.max(0, p.life / p.max);
		ctx.fillStyle = p.color;
		if (p.kind === "petal") {
			ctx.save();
			ctx.translate(p.x, p.y);
			ctx.rotate(p.life * 8);
			ctx.beginPath();
			ctx.ellipse(0, 0, p.size, p.size * .45, 0, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		} else {
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
	}
	ctx.font = "600 13px 'DM Sans', sans-serif";
	ctx.textAlign = "center";
	for (const f of sim.floaters) {
		if (!f.alive) continue;
		ctx.globalAlpha = Math.max(0, f.life / .7);
		ctx.fillStyle = f.color;
		ctx.fillText(f.text, f.x, f.y);
		ctx.globalAlpha = 1;
	}
	ctx.setTransform(1, 0, 0, 1, 0, 0);
}
function resizeCanvas(canvas) {
	const parent = canvas.parentElement;
	if (!parent) return;
	const dpr = Math.min(window.devicePixelRatio || 1, 2);
	const w = parent.clientWidth;
	const h = parent.clientHeight;
	canvas.style.width = `${w}px`;
	canvas.style.height = `${h}px`;
	canvas.width = Math.max(1, Math.floor(w * dpr));
	canvas.height = Math.max(1, Math.floor(h * dpr));
}
function eventToWorld(canvas, clientX, clientY) {
	const rect = canvas.getBoundingClientRect();
	return {
		x: (clientX - rect.left) / rect.width * WORLD_W,
		y: (clientY - rect.top) / rect.height * 720
	};
}
function hypot2(ax, ay, bx, by) {
	const dx = ax - bx;
	const dy = ay - by;
	return dx * dx + dy * dy;
}
function allocEnemy(sim) {
	for (const e of sim.enemies) if (!e.alive) return e;
	const e = {
		id: 0,
		kind: "imp",
		x: 0,
		y: 0,
		hp: 1,
		maxHp: 1,
		speed: 1,
		wp: 0,
		progress: 0,
		slow: 0,
		slowT: 0,
		stunT: 0,
		flash: 0,
		alive: false,
		bob: 0,
		facing: 1,
		enraged: false
	};
	sim.enemies.push(e);
	return e;
}
function allocProj(sim) {
	for (const p of sim.projectiles) if (!p.alive) return p;
	const p = {
		id: 0,
		alive: false,
		kind: "yumi",
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		speed: 0,
		damage: 0,
		splash: 0,
		slow: 0,
		slowTime: 0,
		damageType: "physical",
		targetId: 0,
		ttl: 0,
		lastX: 0,
		lastY: 0,
		rot: 0,
		pierce: 0,
		crit: 0,
		aftershock: false,
		hitIds: []
	};
	sim.projectiles.push(p);
	return p;
}
function allocParticle(sim) {
	let oldest = sim.particles[0];
	for (const p of sim.particles) {
		if (!p.alive) return p;
		if (!oldest || p.life < oldest.life) oldest = p;
	}
	if (sim.particles.length < 220) {
		const p = {
			alive: false,
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			life: 0,
			max: 1,
			size: 2,
			color: "#fff",
			kind: "petal"
		};
		sim.particles.push(p);
		return p;
	}
	return oldest;
}
function allocFloater(sim) {
	for (const f of sim.floaters) if (!f.alive) return f;
	const f = {
		alive: false,
		x: 0,
		y: 0,
		vy: 0,
		life: 0,
		text: "",
		color: "#fff"
	};
	sim.floaters.push(f);
	return f;
}
function burst(sim, x, y, color, n, kind = "spark") {
	for (let i = 0; i < n; i++) {
		const p = allocParticle(sim);
		const a = Math.random() * Math.PI * 2;
		const s = 40 + Math.random() * 140;
		p.alive = true;
		p.x = x;
		p.y = y;
		p.vx = Math.cos(a) * s;
		p.vy = Math.sin(a) * s - 20;
		p.life = p.max = .25 + Math.random() * .45;
		p.size = kind === "petal" ? 4 + Math.random() * 5 : 2 + Math.random() * 3;
		p.color = color;
		p.kind = kind;
	}
}
function spawnEnemy(sim, kind) {
	const def = ENEMIES[kind];
	const e = allocEnemy(sim);
	const start = WAYPOINTS[0];
	e.id = ++sim.nextId;
	e.kind = kind;
	e.x = start.x;
	e.y = start.y;
	e.hp = def.hp;
	e.maxHp = def.hp;
	e.speed = def.speed;
	e.wp = 1;
	e.progress = 0;
	e.slow = 0;
	e.slowT = 0;
	e.stunT = 0;
	e.flash = 0;
	e.alive = true;
	e.bob = Math.random() * Math.PI * 2;
	e.facing = 1;
	e.enraged = false;
	return e;
}
function applyDamage(sim, e, amount, type, events, crit = false, noisy = true) {
	const def = ENEMIES[e.kind];
	let reduced = type === "physical" ? amount * (1 - def.armor) : amount * (1 - def.resist);
	if (crit) reduced *= 2;
	e.hp -= reduced;
	e.flash = crit ? .18 : .12;
	const f = allocFloater(sim);
	f.alive = true;
	f.x = e.x;
	f.y = e.y - 18;
	f.vy = -36;
	f.life = crit ? .85 : .7;
	f.text = crit ? `${Math.round(reduced)}!` : String(Math.round(reduced));
	f.color = crit ? "#e85a8a" : type === "magic" ? "#e8c9a0" : "#f3ece4";
	if (noisy) events.push(crit ? "crit" : "hit");
	sim.trauma = Math.min(1, sim.trauma + (e.kind === "boss" ? .22 : crit ? .14 : .08));
	if (e.hp <= 0) {
		e.alive = false;
		sim.gold += def.gold;
		sim.kills += 1;
		burst(sim, e.x, e.y, "#e85a8a", e.kind === "boss" ? 28 : 12, "petal");
		burst(sim, e.x, e.y, "#e8c9a0", 8, "spark");
		events.push("death");
		sim.hitstop = Math.max(sim.hitstop, e.kind === "boss" ? .12 : .04);
	}
}
function allocZone(sim) {
	for (const z of sim.zones) if (!z.alive) return z;
	const z = {
		alive: false,
		x: 0,
		y: 0,
		r: 40,
		life: 0,
		max: 1,
		dps: 0,
		slow: 0
	};
	sim.zones.push(z);
	return z;
}
function spawnWard(sim, x, y, r) {
	const z = allocZone(sim);
	z.alive = true;
	z.x = x;
	z.y = y;
	z.r = r;
	z.life = z.max = 1.35;
	z.dps = 14;
	z.slow = .2;
}
function findTarget(sim, x, y, range, policy) {
	const r2 = range * range;
	let best = null;
	let bestScore = -Infinity;
	for (const e of sim.enemies) {
		if (!e.alive) continue;
		if (hypot2(x, y, e.x, e.y) > r2) continue;
		let score = 0;
		if (policy === "first") score = e.progress;
		else if (policy === "last") score = -e.progress;
		else if (policy === "strong") score = e.hp;
		else score = -Math.hypot(x - e.x, y - e.y);
		if (score > bestScore) {
			bestScore = score;
			best = e;
		}
	}
	return best;
}
function fireTower(sim, t, target, events) {
	const def = TOWERS[t.kind];
	const stats = towerStats(t.kind, t.level);
	t.recoil = 1;
	t.targetId = target.id;
	if (t.kind === "taiko") {
		events.push("drum");
		const hit = [target];
		let current = target;
		for (let c = 1; c < stats.chain; c++) {
			let next = null;
			let best = 22500;
			for (const e of sim.enemies) {
				if (!e.alive || hit.includes(e)) continue;
				const d = hypot2(current.x, current.y, e.x, e.y);
				if (d < best) {
					best = d;
					next = e;
				}
			}
			if (!next) break;
			hit.push(next);
			current = next;
		}
		const pts = hit.map((e) => ({
			x: e.x,
			y: e.y - 10
		}));
		pts.unshift({
			x: t.x,
			y: t.y - 36
		});
		sim.beams.push({
			alive: true,
			points: pts,
			life: .18
		});
		hit.forEach((e, i) => {
			const crit = Math.random() < stats.crit;
			applyDamage(sim, e, stats.damage * Math.pow(.72, i), def.damageType, events, crit);
			if (i === 0 && stats.stun > 0) e.stunT = Math.max(e.stunT, stats.stun);
		});
		return;
	}
	events.push(t.kind === "ofuda" ? "seal" : t.kind === "kitsune" ? "fox" : "shoot");
	const p = allocProj(sim);
	p.id = ++sim.nextId;
	p.alive = true;
	p.kind = t.kind;
	p.x = t.x;
	p.y = t.y - 28;
	p.speed = def.projectileSpeed;
	p.damage = stats.damage;
	p.splash = stats.splash;
	p.slow = stats.slow;
	p.slowTime = stats.slowTime;
	p.damageType = def.damageType;
	p.targetId = target.id;
	p.ttl = 1.6;
	p.lastX = p.x;
	p.lastY = p.y;
	p.pierce = stats.pierce;
	p.crit = stats.crit;
	p.aftershock = stats.aftershock;
	p.hitIds.length = 0;
	const dx = target.x - p.x;
	const dy = target.y - 12 - p.y;
	const d = Math.hypot(dx, dy) || 1;
	p.vx = dx / d * p.speed;
	p.vy = dy / d * p.speed;
	p.rot = Math.atan2(p.vy, p.vx);
}
function updateEnemies(sim, dt, events) {
	for (const e of sim.enemies) {
		if (!e.alive) continue;
		e.flash = Math.max(0, e.flash - dt);
		e.bob += dt * (e.kind === "yurei" ? 4 : 8);
		if (e.kind === "boss" && !e.enraged && e.hp <= e.maxHp * .5) {
			e.enraged = true;
			e.speed *= 1.55;
			e.flash = .45;
			events.push("enrage");
			sim.hitstop = Math.max(sim.hitstop, .1);
			sim.trauma = 1;
			burst(sim, e.x, e.y, "#d45b5b", 22, "smoke");
			const rage = allocFloater(sim);
			rage.alive = true;
			rage.x = e.x;
			rage.y = e.y - 36;
			rage.vy = -28;
			rage.life = 1.1;
			rage.text = "RAGE";
			rage.color = "#d45b5b";
			for (let i = 0; i < 4; i++) {
				const add = spawnEnemy(sim, "imp");
				add.x = e.x + (i - 1.5) * 18;
				add.y = e.y + (i % 2 === 0 ? -8 : 8);
				add.wp = e.wp;
				add.progress = e.progress;
			}
		}
		if (e.stunT > 0) {
			e.stunT -= dt;
			continue;
		}
		if (e.slowT > 0) {
			e.slowT -= dt;
			if (e.slowT <= 0) e.slow = 0;
		}
		let remaining = e.speed * (1 - e.slow) * dt;
		while (remaining > 0 && e.alive) {
			if (e.wp >= WAYPOINTS.length) {
				e.alive = false;
				sim.lives -= 1;
				sim.leaks += 1;
				events.push("leak");
				sim.trauma = Math.min(1, sim.trauma + .35);
				burst(sim, e.x, e.y, "#d45b5b", 10, "smoke");
				if (sim.lives <= 0) {
					sim.lost = true;
					events.push("lose");
				}
				break;
			}
			const target = WAYPOINTS[e.wp];
			const dx = target.x - e.x;
			const dy = target.y - e.y;
			const dist = Math.hypot(dx, dy);
			if (dist <= remaining || dist < 1.5) {
				e.x = target.x;
				e.y = target.y;
				remaining -= dist;
				e.wp += 1;
			} else {
				e.x += dx / dist * remaining;
				e.y += dy / dist * remaining;
				e.facing = dx < -4 ? -1 : dx > 4 ? 1 : e.facing;
				remaining = 0;
			}
		}
		let traveled = 0;
		for (let i = 0; i < e.wp - 1 && i < WAYPOINTS.length - 1; i++) traveled += Math.hypot(WAYPOINTS[i + 1].x - WAYPOINTS[i].x, WAYPOINTS[i + 1].y - WAYPOINTS[i].y);
		if (e.wp > 0 && e.wp < WAYPOINTS.length) {
			const prev = WAYPOINTS[e.wp - 1];
			traveled += Math.hypot(e.x - prev.x, e.y - prev.y);
		}
		e.progress = traveled / PATH_LEN;
	}
}
function updateProjectiles(sim, dt, events) {
	for (const p of sim.projectiles) {
		if (!p.alive) continue;
		p.ttl -= dt;
		const target = sim.enemies.find((e) => e.alive && e.id === p.targetId && !p.hitIds.includes(e.id));
		if (target) {
			const dx = target.x - p.x;
			const dy = target.y - 10 - p.y;
			const d = Math.hypot(dx, dy) || 1;
			p.vx = dx / d * p.speed;
			p.vy = dy / d * p.speed;
			p.rot = Math.atan2(p.vy, p.vx);
			if (d < 16 + ENEMIES[target.kind].radius) {
				const crit = Math.random() < p.crit;
				applyDamage(sim, target, p.damage, p.damageType, events, crit);
				if (p.slow > 0) {
					target.slow = Math.max(target.slow, p.slow);
					target.slowT = Math.max(target.slowT, p.slowTime);
				}
				if (p.splash > 0) {
					const s2 = p.splash * p.splash;
					for (const e of sim.enemies) {
						if (!e.alive || e.id === target.id) continue;
						if (hypot2(p.x, p.y, e.x, e.y) <= s2) {
							applyDamage(sim, e, p.damage * .55, p.damageType, events, false, false);
							if (p.slow > 0) {
								e.slow = Math.max(e.slow, p.slow * .7);
								e.slowT = Math.max(e.slowT, p.slowTime * .7);
							}
						}
					}
					if (p.aftershock) spawnWard(sim, p.x, p.y, p.splash * .7);
				}
				burst(sim, p.x, p.y, p.kind === "kitsune" ? "#4a8b74" : "#e8c9a0", 6, "spark");
				p.hitIds.push(target.id);
				if (p.hitIds.length <= p.pierce) {
					let next = null;
					let best = 12100;
					for (const e of sim.enemies) {
						if (!e.alive || p.hitIds.includes(e.id)) continue;
						const d2 = hypot2(p.x, p.y, e.x, e.y);
						if (d2 < best) {
							best = d2;
							next = e;
						}
					}
					if (next) {
						p.targetId = next.id;
						p.ttl = Math.max(p.ttl, .55);
						continue;
					}
				}
				p.alive = false;
				continue;
			}
		} else if (p.ttl < .4) {
			p.alive = false;
			continue;
		}
		p.x += p.vx * dt;
		p.y += p.vy * dt;
		if (p.ttl <= 0 || p.x < -40 || p.y < -40 || p.x > 1320 || p.y > 760) p.alive = false;
	}
}
function updateTowers(sim, dt, events) {
	for (const t of sim.towers) {
		t.recoil = Math.max(0, t.recoil - dt * 4);
		t.flash = Math.max(0, t.flash - dt);
		t.cooldown -= dt;
		const stats = towerStats(t.kind, t.level);
		if (stats.aura > 0) {
			const r2 = stats.range * stats.range;
			for (const e of sim.enemies) {
				if (!e.alive) continue;
				if (hypot2(t.x, t.y, e.x, e.y) > r2) continue;
				e.slow = Math.max(e.slow, stats.aura);
				e.slowT = Math.max(e.slowT, .3);
			}
		}
		if (t.cooldown > 0) continue;
		const target = findTarget(sim, t.x, t.y, stats.range, t.targeting);
		if (!target) continue;
		t.cooldown = 1 / stats.fireRate;
		fireTower(sim, t, target, events);
	}
}
function updateFx(sim, dt) {
	sim.trauma = Math.max(0, sim.trauma - dt * 1.6);
	sim.petalT += dt;
	for (const p of sim.particles) {
		if (!p.alive) continue;
		p.life -= dt;
		p.x += p.vx * dt;
		p.y += p.vy * dt;
		p.vy += (p.kind === "petal" ? 30 : 80) * dt;
		if (p.life <= 0) p.alive = false;
	}
	for (const f of sim.floaters) {
		if (!f.alive) continue;
		f.life -= dt;
		f.y += f.vy * dt;
		if (f.life <= 0) f.alive = false;
	}
	for (const b of sim.beams) {
		b.life -= dt;
		if (b.life <= 0) b.alive = false;
	}
	sim.beams = sim.beams.filter((b) => b.alive);
	for (const z of sim.zones) {
		if (!z.alive) continue;
		z.life -= dt;
		if (z.life <= 0) {
			z.alive = false;
			continue;
		}
		const r2 = z.r * z.r;
		for (const e of sim.enemies) {
			if (!e.alive) continue;
			if (hypot2(z.x, z.y, e.x, e.y) > r2) continue;
			e.hp -= z.dps * dt;
			e.slow = Math.max(e.slow, z.slow);
			e.slowT = Math.max(e.slowT, .25);
			if (e.hp <= 0) {
				e.alive = false;
				sim.gold += ENEMIES[e.kind].gold;
				sim.kills += 1;
				burst(sim, e.x, e.y, "#e85a8a", 10, "petal");
			}
		}
	}
}
function tickSpawns(sim, dt, events) {
	if (!sim.waveActive) return;
	sim.waveTime += dt;
	const still = [];
	for (const s of sim.spawnQueue) {
		s.t -= dt;
		if (s.t <= 0) spawnEnemy(sim, s.kind);
		else still.push(s);
	}
	sim.spawnQueue = still;
	if (!sim.enemies.some((e) => e.alive) && sim.spawnQueue.length === 0 && sim.waveTime > .4) {
		sim.waveActive = false;
		if (sim.wave >= WAVES.length) {
			sim.won = true;
			events.push("win");
		} else sim.prep = 12;
	}
}
function createSim() {
	return {
		gold: 240,
		lives: 12,
		wave: 0,
		waveActive: false,
		waveTime: 0,
		prep: 12,
		speed: 1,
		targeting: "first",
		selectedKind: "yumi",
		selectedTower: null,
		hoverCol: -1,
		hoverRow: -1,
		towers: [],
		enemies: [],
		projectiles: [],
		particles: [],
		floaters: [],
		beams: [],
		zones: [],
		spawnQueue: [],
		nextId: 1,
		trauma: 0,
		hitstop: 0,
		elapsed: 0,
		kills: 0,
		leaks: 0,
		won: false,
		lost: false,
		petalT: 0
	};
}
function resetSim(sim) {
	Object.assign(sim, createSim());
}
function startWave(sim, events) {
	if (sim.waveActive || sim.won || sim.lost) return;
	if (sim.wave >= WAVES.length) return;
	if (sim.prep > 2) sim.gold += earlyCallGold(sim.prep);
	sim.wave += 1;
	const wave = WAVES[sim.wave - 1];
	sim.waveActive = true;
	sim.waveTime = 0;
	sim.prep = 0;
	sim.spawnQueue = [];
	for (const s of wave.spawns) for (let i = 0; i < s.count; i++) sim.spawnQueue.push({
		kind: s.kind,
		t: s.delay + i * s.interval
	});
	events.push("wave");
}
function occupied(sim, col, row) {
	return sim.towers.some((t) => t.col === col && t.row === row);
}
function tryPlace(sim, col, row, events) {
	if (!sim.selectedKind) return false;
	if (!isBuildableCell(col, row) || occupied(sim, col, row)) {
		events.push("deny");
		return false;
	}
	const def = TOWERS[sim.selectedKind];
	if (sim.gold < def.cost) {
		events.push("deny");
		return false;
	}
	sim.gold -= def.cost;
	const { x, y } = {
		x: (col + .5) * 64,
		y: (row + .5) * 60
	};
	const t = {
		id: ++sim.nextId,
		kind: sim.selectedKind,
		col,
		row,
		x,
		y,
		level: 1,
		cooldown: .2,
		spent: def.cost,
		recoil: 0,
		targetId: 0,
		flash: 0,
		targeting: sim.targeting
	};
	sim.towers.push(t);
	sim.selectedTower = t.id;
	sim.selectedKind = null;
	burst(sim, x, y, "#e8c9a0", 8, "spark");
	events.push("place");
	return true;
}
function tryUpgrade(sim, events) {
	const t = sim.towers.find((x) => x.id === sim.selectedTower);
	if (!t) return;
	const next = nextRank(t.kind, t.level);
	if (!next) return;
	if (sim.gold < next.cost) {
		events.push("deny");
		return;
	}
	sim.gold -= next.cost;
	t.spent += next.cost;
	t.level += 1;
	t.flash = .45;
	burst(sim, t.x, t.y, TOWERS[t.kind].color, 16, "spark");
	burst(sim, t.x, t.y, "#e8c9a0", 8, "petal");
	sim.hitstop = Math.max(sim.hitstop, .06);
	events.push("upgrade");
}
function trySell(sim, events) {
	const i = sim.towers.findIndex((x) => x.id === sim.selectedTower);
	if (i < 0) return;
	const t = sim.towers[i];
	sim.gold += Math.floor(t.spent * SELL_RATE);
	sim.towers.splice(i, 1);
	sim.selectedTower = null;
	events.push("sell");
}
function pointerCell(x, y) {
	return {
		col: Math.max(0, Math.min(19, Math.floor(x / 64))),
		row: Math.max(0, Math.min(11, Math.floor(y / 60)))
	};
}
function updateSim(sim, dt, events) {
	const capped = Math.min(dt, .1);
	sim.elapsed += capped;
	if (sim.won || sim.lost) {
		updateFx(sim, capped);
		return;
	}
	if (sim.hitstop > 0) {
		sim.hitstop -= capped;
		updateFx(sim, capped * .3);
		return;
	}
	const step = capped * sim.speed;
	if (!sim.waveActive && sim.prep > 0) {
		sim.prep -= step;
		if (sim.prep <= 0) startWave(sim, events);
	}
	tickSpawns(sim, step, events);
	updateTowers(sim, step, events);
	updateProjectiles(sim, step, events);
	updateEnemies(sim, step, events);
	updateFx(sim, step);
}
function scoreOf(sim) {
	return sim.wave * 120 + sim.kills * 8 + sim.lives * 25 + sim.gold;
}
function readBest() {
	try {
		const raw = localStorage.getItem(SAVE_KEY);
		if (!raw) return 0;
		return JSON.parse(raw).best ?? 0;
	} catch {
		return 0;
	}
}
function writeBest(score) {
	try {
		const best = Math.max(readBest(), score);
		localStorage.setItem(SAVE_KEY, JSON.stringify({
			version: 1,
			best
		}));
		return best;
	} catch {
		return score;
	}
}
function syncHud(sim, extra = {}) {
	const t = sim.towers.find((x) => x.id === sim.selectedTower);
	const wave = WAVES[Math.max(0, sim.wave - 1)];
	const rank = t ? rankOf(t.kind, t.level) : null;
	const nxt = t ? nextRank(t.kind, t.level) : null;
	patchHud({
		gold: Math.floor(sim.gold),
		lives: sim.lives,
		wave: sim.wave,
		waveName: sim.waveActive ? wave?.name ?? "Wave" : sim.won ? "Victory" : "Prepare",
		waveActive: sim.waveActive,
		waveHint: waveHint(sim.wave, sim.waveActive),
		prep: sim.prep,
		callBonus: earlyCallGold(sim.prep),
		speed: sim.speed,
		targeting: t?.targeting ?? sim.targeting,
		selectedKind: sim.selectedKind,
		selectedLevel: t?.level ?? 0,
		selectedSpent: t?.spent ?? 0,
		selectedKindPlaced: t?.kind ?? null,
		selectedRankName: rank?.name ?? "",
		selectedPerk: rank?.blurb ?? "",
		nextRankName: nxt?.name ?? "",
		nextPerk: nxt?.blurb ?? "",
		upgradeCost: nxt?.cost ?? 0,
		remaining: sim.spawnQueue.length + sim.enemies.filter((e) => e.alive).length,
		won: sim.won,
		lost: sim.lost,
		kills: sim.kills,
		score: scoreOf(sim),
		...extra
	});
}
function GameApp() {
	const [screen, setScreen] = (0, import_react.useState)("title");
	const [ready, setReady] = (0, import_react.useState)(false);
	const [err, setErr] = (0, import_react.useState)(null);
	const atlasRef = (0, import_react.useRef)(null);
	const simRef = (0, import_react.useRef)(null);
	const canvasRef = (0, import_react.useRef)(null);
	const pausedRef = (0, import_react.useRef)(false);
	const reducedRef = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		let alive = true;
		loadAtlas().then((atlas) => {
			if (!alive) return;
			atlasRef.current = atlas;
			simRef.current = createSim();
			resetHud(readBest());
			setReady(true);
		}).catch((e) => setErr(e instanceof Error ? e.message : "Could not load art"));
		return () => {
			alive = false;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	}, []);
	(0, import_react.useEffect)(() => {
		if (screen !== "play") return;
		const canvas = canvasRef.current;
		const sim = simRef.current;
		const atlas = atlasRef.current;
		if (!canvas || !sim || !atlas) return;
		resizeCanvas(canvas);
		const onResize = () => resizeCanvas(canvas);
		window.addEventListener("resize", onResize);
		let raf = 0;
		let last = performance.now();
		let hudAcc = 0;
		const loop = (now) => {
			raf = requestAnimationFrame(loop);
			let dt = (now - last) / 1e3;
			last = now;
			dt = Math.min(dt, .1);
			const events = [];
			if (!pausedRef.current) updateSim(sim, dt, events);
			for (const ev of events) playSfx(ev);
			if (events.includes("win") || events.includes("lose")) patchHud({
				best: writeBest(scoreOf(sim)),
				won: sim.won,
				lost: sim.lost,
				score: scoreOf(sim)
			});
			hudAcc += dt;
			if (hudAcc > .12 || events.length) {
				hudAcc = 0;
				syncHud(sim, { paused: pausedRef.current });
			}
			const ctx = canvas.getContext("2d");
			if (ctx) renderFrame(ctx, sim, atlas, reducedRef.current);
		};
		raf = requestAnimationFrame(loop);
		const onVis = () => {
			if (document.visibilityState === "visible") resumeIfNeeded();
		};
		document.addEventListener("visibilitychange", onVis);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", onResize);
			document.removeEventListener("visibilitychange", onVis);
		};
	}, [screen]);
	(0, import_react.useEffect)(() => {
		if (screen !== "play") return;
		const onKey = (e) => {
			const sim = simRef.current;
			if (!sim) return;
			const events = [];
			if (e.key === "Escape") {
				pausedRef.current = !pausedRef.current;
				patchHud({ paused: pausedRef.current });
			} else if (e.key === " ") {
				e.preventDefault();
				startWave(sim, events);
			} else if (e.key === "1") {
				sim.selectedKind = "yumi";
				sim.selectedTower = null;
			} else if (e.key === "2") {
				sim.selectedKind = "ofuda";
				sim.selectedTower = null;
			} else if (e.key === "3") {
				sim.selectedKind = "kitsune";
				sim.selectedTower = null;
			} else if (e.key === "4") {
				sim.selectedKind = "taiko";
				sim.selectedTower = null;
			} else if (e.key === "u" || e.key === "U") tryUpgrade(sim, events);
			else if (e.key === "s" || e.key === "S") trySell(sim, events);
			else if (e.key === "f" || e.key === "F") sim.speed = sim.speed === 1 ? 2 : 1;
			for (const ev of events) playSfx(ev);
			syncHud(sim);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [screen]);
	const callWave = () => {
		const sim = simRef.current;
		if (!sim) return;
		const events = [];
		startWave(sim, events);
		for (const ev of events) playSfx(ev);
		syncHud(sim);
	};
	const begin = () => {
		if (!ready || !atlasRef.current || !simRef.current) return;
		unlockAudio();
		const sim = simRef.current;
		resetSim(sim);
		pausedRef.current = false;
		resetHud(readBest());
		syncHud(sim);
		setScreen("play");
	};
	if (err) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "flex h-dvh items-center justify-center bg-ink px-6 text-center text-paper",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-lg",
			children: err
		})
	});
	if (screen === "title") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleScreen, {
		onPlay: begin,
		ready
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex h-dvh flex-col bg-ink text-paper",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopHud, {
				onPause: () => {
					pausedRef.current = !pausedRef.current;
					patchHud({ paused: pausedRef.current });
				},
				onMute: () => {
					const next = !isMuted();
					setMuted(next);
					patchHud({ muted: next });
				},
				onSpeed: () => {
					const sim = simRef.current;
					if (!sim) return;
					sim.speed = sim.speed === 1 ? 2 : 1;
					syncHud(sim);
				},
				onWave: callWave
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative min-h-0 flex-1 touch-none",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
						ref: canvasRef,
						className: "block h-full w-full",
						onPointerMove: (e) => {
							const sim = simRef.current;
							const canvas = canvasRef.current;
							if (!sim || !canvas) return;
							const w = eventToWorld(canvas, e.clientX, e.clientY);
							const cell = pointerCell(w.x, w.y);
							sim.hoverCol = cell.col;
							sim.hoverRow = cell.row;
						},
						onPointerLeave: () => {
							const sim = simRef.current;
							if (sim) {
								sim.hoverCol = -1;
								sim.hoverRow = -1;
							}
						},
						onPointerDown: (e) => {
							unlockAudio();
							const sim = simRef.current;
							const canvas = canvasRef.current;
							if (!sim || !canvas || pausedRef.current || sim.won || sim.lost) return;
							const w = eventToWorld(canvas, e.clientX, e.clientY);
							const cell = pointerCell(w.x, w.y);
							const events = [];
							if (occupied(sim, cell.col, cell.row)) {
								const t = sim.towers.find((x) => x.col === cell.col && x.row === cell.row);
								const inspecting = !sim.selectedKind;
								const already = t && t.id === sim.selectedTower;
								sim.selectedTower = t?.id ?? null;
								sim.selectedKind = null;
								if (inspecting && already && e.detail === 2) tryUpgrade(sim, events);
							} else if (sim.selectedKind) tryPlace(sim, cell.col, cell.row, events);
							else sim.selectedTower = null;
							for (const ev of events) playSfx(ev);
							syncHud(sim);
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PauseWinLose, {
						onResume: () => {
							pausedRef.current = false;
							patchHud({ paused: false });
						},
						onMenu: () => setScreen("title"),
						onRetry: begin
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CanvasChrome, {
						onUpgrade: () => {
							const sim = simRef.current;
							if (!sim) return;
							const events = [];
							tryUpgrade(sim, events);
							for (const ev of events) playSfx(ev);
							syncHud(sim);
						},
						onSell: () => {
							const sim = simRef.current;
							if (!sim) return;
							const events = [];
							trySell(sim, events);
							for (const ev of events) playSfx(ev);
							syncHud(sim);
						},
						onTarget: (policy) => {
							const sim = simRef.current;
							if (!sim) return;
							const t = sim.towers.find((x) => x.id === sim.selectedTower);
							if (t) t.targeting = policy;
							else sim.targeting = policy;
							syncHud(sim);
						}
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomBar, { onSelect: (kind) => {
				const sim = simRef.current;
				if (!sim) return;
				sim.selectedKind = sim.selectedKind === kind ? null : kind;
				sim.selectedTower = null;
				syncHud(sim);
			} })
		]
	});
}
function TitleScreen({ onPlay, ready }) {
	const best = useHud((s) => s.best);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh overflow-hidden bg-ink text-paper",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/game/title.jpg",
				alt: "",
				className: "absolute inset-0 h-full w-full object-cover"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/25" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex h-full max-w-xl flex-col justify-end gap-6 px-6 pb-10 pt-16 sm:justify-center sm:pb-0 sm:pl-12",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium uppercase tracking-[0.28em] text-paper-muted",
						children: "Shrine defense"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-5xl font-semibold leading-tight tracking-tight sm:text-6xl",
						children: "Sakura Sentinel"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-lg text-sakura",
						children: "桜の守護者"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "max-w-sm text-sm leading-relaxed text-paper-muted",
						children: "Place spirit towers along the pilgrimage road. Hold the torii through ten yokai waves."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "max-w-sm space-y-1 text-sm text-paper-muted",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Tap a tower, then a pale pad. Tap the card again to place more." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Select a placed tower to consecrate it and set its targeting." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Call waves early for extra tribute. Oni shrug arrows; yurei resist magic." })
						]
					}),
					best > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs tracking-wide text-crest",
						children: ["Best rite · ", best]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "lg",
							onClick: onPlay,
							disabled: !ready,
							children: ready ? "Defend the shrine" : "Gathering spirits…"
						})
					})
				]
			})
		]
	});
}
function TopHud({ onPause, onMute, onSpeed, onWave }) {
	const gold = useHud((s) => s.gold);
	const lives = useHud((s) => s.lives);
	const wave = useHud((s) => s.wave);
	const waveName = useHud((s) => s.waveName);
	const waveActive = useHud((s) => s.waveActive);
	const waveHint = useHud((s) => s.waveHint);
	const prep = useHud((s) => s.prep);
	const callBonus = useHud((s) => s.callBonus);
	const remaining = useHud((s) => s.remaining);
	const speed = useHud((s) => s.speed);
	const muted = useHud((s) => s.muted);
	const paused = useHud((s) => s.paused);
	const won = useHud((s) => s.won);
	const lost = useHud((s) => s.lost);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "z-10 flex shrink-0 items-center gap-2 border-b border-border bg-ink-elevated px-3 py-2 sm:gap-4 sm:px-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-display text-sm tracking-tight sm:text-base",
						children: [
							"Wave ",
							Math.min(wave || 1, 10),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "ml-2 text-paper-muted",
								children: "/ 10"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-xs text-paper-subtle",
						children: waveHint || waveName
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-[11px] text-paper-muted",
						children: waveActive ? `${waveName} · ${remaining} left` : `${Math.ceil(prep)}s to next`
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "Lives",
				value: lives,
				warn: lives <= 4
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stat, {
				label: "Tribute",
				value: gold
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "size-11",
						onClick: onMute,
						"aria-label": muted ? "Unmute" : "Mute",
						children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "size-11",
						onClick: onSpeed,
						"aria-label": "Toggle speed",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: cn("size-5", speed > 1 && "text-sakura") })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon",
						className: "size-11",
						onClick: onPause,
						"aria-label": "Pause",
						children: paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-5" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						className: "min-w-16 px-2",
						disabled: waveActive || won || lost,
						onClick: onWave,
						children: waveActive ? "Live" : callBonus > 0 ? `Call +${callBonus}` : "Call"
					})
				]
			})
		]
	});
}
function Stat({ label, value, warn }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-md border border-border bg-ink-soft px-2.5 py-1.5 text-right",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[10px] uppercase tracking-wider text-paper-subtle",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: cn("font-medium tabular-nums", warn ? "text-danger" : "text-paper"),
			children: value
		})]
	});
}
function BottomBar({ onSelect }) {
	const gold = useHud((s) => s.gold);
	const selectedKind = useHud((s) => s.selectedKind);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "z-10 shrink-0 border-t border-border bg-ink-elevated px-2 py-1.5 sm:px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex gap-2 overflow-x-auto",
			children: TOWER_ORDER.map((id, i) => {
				const def = TOWERS[id];
				const can = gold >= def.cost;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onSelect(id),
					className: cn("flex min-w-[132px] flex-1 items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors", selectedKind === id ? "border-sakura bg-ink-soft" : "border-border bg-ink", !can && "opacity-50"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: `/sprites/${id}.png`,
						alt: "",
						className: "size-10 object-contain"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "truncate text-sm font-medium",
							children: [
								i + 1,
								" ",
								def.name
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs tabular-nums text-crest",
							children: def.cost
						})]
					})]
				}, id);
			})
		})
	});
}
function CanvasChrome({ onUpgrade, onSell, onTarget }) {
	const selectedKind = useHud((s) => s.selectedKind);
	const selectedKindPlaced = useHud((s) => s.selectedKindPlaced);
	const selectedLevel = useHud((s) => s.selectedLevel);
	const selectedSpent = useHud((s) => s.selectedSpent);
	const selectedRankName = useHud((s) => s.selectedRankName);
	const selectedPerk = useHud((s) => s.selectedPerk);
	const nextRankName = useHud((s) => s.nextRankName);
	const nextPerk = useHud((s) => s.nextPerk);
	const upgradeCost = useHud((s) => s.upgradeCost);
	const gold = useHud((s) => s.gold);
	const targeting = useHud((s) => s.targeting);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [selectedKind && !selectedKindPlaced && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-x-2 bottom-2 z-[5] rounded-lg border border-border bg-ink/90 px-2 py-1.5 sm:inset-x-auto sm:left-2 sm:w-[min(420px,calc(100%-1rem))]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-[11px] text-paper-subtle",
			children: "Tap a pale pad. Tap the card again to place more."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankTree, {
			kind: selectedKind,
			highlight: 1
		})]
	}), selectedKindPlaced && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-x-2 bottom-2 z-[5] max-h-[46%] overflow-y-auto sm:inset-x-auto sm:left-2 sm:w-[min(400px,calc(100%-1rem))]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InspectPanel, {
			kind: selectedKindPlaced,
			level: selectedLevel,
			spent: selectedSpent,
			gold,
			rankName: selectedRankName,
			perk: selectedPerk,
			nextName: nextRankName,
			nextPerk,
			upgradeCost,
			targeting,
			onUpgrade,
			onSell,
			onTarget
		})
	})] });
}
function PerkTags({ rank }) {
	const tags = rankTags(rank);
	if (!tags.length) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-1 flex flex-wrap gap-1",
		children: tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-crest",
			children: tag
		}, tag))
	});
}
function StatDelta({ label, now, next }) {
	const bump = next != null && next !== now;
	const fmt = (n) => Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "text-xs tabular-nums",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "mr-1 text-paper-subtle",
				children: label
			}),
			fmt(now),
			bump && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-crest",
				children: [" → ", fmt(next)]
			})
		]
	});
}
function RankTree({ kind, highlight }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-2 grid grid-cols-3 gap-1 rounded-lg border border-border bg-ink px-2 py-2",
		children: RANKS[kind].map((rank, i) => {
			const on = highlight >= i + 1;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("min-w-0 rounded-md px-1.5 py-1", on ? "bg-ink-soft" : "opacity-70"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: cn("truncate text-xs font-medium", on ? "text-sakura" : "text-paper"),
						children: [
							ROMAN[i],
							" ",
							rank.name
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "truncate text-[11px] text-paper-subtle",
						children: rank.blurb
					}),
					rank.cost > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] tabular-nums text-crest",
						children: rank.cost
					})
				]
			}, rank.name);
		})
	});
}
function InspectPanel({ kind, level, spent, gold, rankName, perk, nextName, nextPerk, upgradeCost, targeting, onUpgrade, onSell, onTarget }) {
	const cur = rankOf(kind, level);
	const nxt = nextRank(kind, level);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-ink/95 px-3 py-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-start gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: `/sprites/${kind}.png`,
						alt: "",
						className: "size-10 object-contain"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm font-medium",
								children: [rankName, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-2 text-xs text-sakura",
									children: ROMAN[level - 1]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-paper-subtle",
								children: perk
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PerkTags, { rank: cur }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatDelta, {
										label: "Dmg",
										now: cur.damage,
										next: nxt?.damage ?? null
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatDelta, {
										label: "Range",
										now: cur.range,
										next: nxt?.range ?? null
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatDelta, {
										label: "Rate",
										now: cur.fireRate,
										next: nxt?.fireRate ?? null
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							disabled: !upgradeCost || gold < upgradeCost,
							onClick: onUpgrade,
							children: upgradeCost ? `Consecrate ${nextName} · ${upgradeCost}` : "Rite complete"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "ghost",
							onClick: onSell,
							children: ["Sell ", Math.floor(spent * SELL_RATE)]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex flex-wrap items-center gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "mr-1 text-[11px] text-paper-subtle",
					children: "Aim"
				}), [
					"first",
					"last",
					"strong",
					"close"
				].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onTarget(t),
					className: cn("h-9 min-w-11 rounded-sm px-2 text-[11px] uppercase tracking-wide", targeting === t ? "bg-paper text-ink" : "text-paper-subtle hover:text-paper"),
					children: t
				}, t))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 grid grid-cols-3 gap-1",
				children: RANKS[kind].map((rank, i) => {
					const lvl = i + 1;
					const on = level >= lvl;
					const isNext = nxt != null && lvl === level + 1;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("min-w-0 rounded-md border px-1.5 py-1", on ? "border-sakura/50 bg-ink-soft" : isNext ? "border-crest/40 bg-ink-elevated" : "border-border"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: cn("truncate text-xs font-medium", on ? "text-sakura" : isNext ? "text-crest" : "text-paper-subtle"),
							children: [
								ROMAN[i],
								" ",
								rank.name
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-[11px] text-paper-subtle",
							children: rank.blurb
						})]
					}, rank.name);
				})
			}),
			nxt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "sr-only",
				children: nextPerk
			})
		]
	});
}
function PauseWinLose({ onResume, onMenu, onRetry }) {
	const paused = useHud((s) => s.paused);
	const won = useHud((s) => s.won);
	const lost = useHud((s) => s.lost);
	const score = useHud((s) => s.score);
	const best = useHud((s) => s.best);
	const kills = useHud((s) => s.kills);
	if (!paused && !won && !lost) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-10 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-[2px]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl border border-border bg-ink-elevated p-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl tracking-tight",
					children: won ? "The shrine holds" : lost ? "The torii fell" : "Rite paused"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-paper-muted",
					children: won ? "Ten waves broken. Petals settle on quiet stone." : lost ? "Yokai reached the gate. Gather tribute and try the road again." : "The pilgrimage waits."
				}),
				(won || lost) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-sm tabular-nums text-crest",
					children: [
						"Score ",
						score,
						" · Best ",
						best,
						" · ",
						kills,
						" felled"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex flex-wrap gap-2",
					children: [
						paused && !won && !lost && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: onResume,
							children: "Resume"
						}),
						(won || lost) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: onRetry,
							children: "Play again"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: onMenu,
							children: "Title"
						})
					]
				})
			]
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameApp, {});
}
//#endregion
export { Home as component };
