export type SpriteName =
  | "map"
  | "title"
  | "yumi"
  | "ofuda"
  | "kitsune"
  | "taiko"
  | "imp"
  | "tengu"
  | "oni"
  | "yurei"
  | "boss"
  | "arrow"
  | "ofudaShot"
  | "foxfire"
  | "impact"
  | "tree"
  | "torii"
  | "lantern"
  | "shrine";

const URLS: Record<SpriteName, string> = {
  map: "/map/shrine-base.jpg?v=pathv7",
  title: "/game/title.jpg?v=pathv7",
  yumi: "/sprites/yumi.png?v=cut4",
  ofuda: "/sprites/ofuda.png?v=cut4",
  kitsune: "/sprites/kitsune.png?v=cut4",
  taiko: "/sprites/taiko.png?v=cut4",
  imp: "/sprites/imp.png?v=cut4",
  tengu: "/sprites/tengu.png?v=cut4",
  oni: "/sprites/oni.png?v=cut4",
  yurei: "/sprites/yurei.png?v=cut4",
  boss: "/sprites/boss.png?v=cut4",
  arrow: "/sprites/arrow.png?v=cut4",
  ofudaShot: "/sprites/ofuda-shot.png?v=cut4",
  foxfire: "/sprites/foxfire.png?v=cut4",
  impact: "/sprites/impact.png?v=cut4",
  tree: "/props/tree.png?v=cut4",
  torii: "/props/torii.png?v=cut4",
  lantern: "/props/lantern.png?v=cut4",
  shrine: "/props/shrine.png?v=cut4",
};

const SHEETS = new Set<SpriteName>(["imp", "tengu", "oni", "yurei", "boss"]);

export type Atlas = Record<SpriteName, HTMLCanvasElement | HTMLImageElement>;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function isPlate(r: number, g: number, b: number, a: number) {
  if (a < 24) return true;
  const mag = r > 170 && b > 170 && g < 120 && r - g > 40 && b - g > 40;
  const hot = r > 180 && g < 70 && b > 60 && r - g > 90;
  const neon = r > 220 && b > 90 && g < 40;
  return mag || hot || neon;
}

function stripPlate(img: HTMLImageElement, sheet: boolean): HTMLCanvasElement {
  const src = document.createElement("canvas");
  src.width = Math.max(1, img.width);
  src.height = Math.max(1, img.height);
  const sctx = src.getContext("2d");
  if (!sctx) return src;
  try {
    sctx.drawImage(img, 0, 0);
    const data = sctx.getImageData(0, 0, src.width, src.height);
    const d = data.data;
    for (let i = 0; i < d.length; i += 4) {
      if (isPlate(d[i], d[i + 1], d[i + 2], d[i + 3])) {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
        d[i + 3] = 0;
      }
    }
    sctx.putImageData(data, 0, 0);
    if (sheet) return src;

    let minX = src.width;
    let minY = src.height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        if (d[(y * src.width + x) * 4 + 3] > 24) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX <= minX || maxY <= minY) return src;
    const pad = 6;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(src.width - 1, maxX + pad);
    maxY = Math.min(src.height - 1, maxY + pad);
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    out.getContext("2d")!.drawImage(src, minX, minY, w, h, 0, 0, w, h);
    return out;
  } catch {
    return src;
  }
}

export async function loadAtlas(): Promise<Atlas> {
  const entries = await Promise.all(
    (Object.keys(URLS) as SpriteName[]).map(async (key) => {
      try {
        const img = await loadImage(URLS[key]);
        if (key === "map" || key === "title") return [key, img] as const;
        return [key, stripPlate(img, SHEETS.has(key))] as const;
      } catch {
        const blank = document.createElement("canvas");
        blank.width = 8;
        blank.height = 8;
        return [key, blank] as const;
      }
    }),
  );
  return Object.fromEntries(entries) as Atlas;
}
