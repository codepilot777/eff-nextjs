// 🌟 地面海岸線參考——用 world-atlas 嘅 land-110m（already-simplified 全球陸地
// TopoJSON，~56KB）轉成 GeoJSON 多邊形,咁就唔使自己揼座標、亦唔受地區限制
// （舊版 weather-nd 嗰個 COAST array 淨係 covers 台灣海峽/南海，唔夠通用）。
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import landTopo from "world-atlas/land-110m.json";

export type LatLon = [lat: number, lon: number];

let cachedRings: LatLon[][] | null = null;

/** 將 land topology 拆成一條條 ring（每條 [lat, lon] 數組），lazy + cache。 */
function getAllCoastlineRings(): LatLon[][] {
  if (cachedRings) return cachedRings;

  const topology = landTopo as unknown as Topology;
  const landObject = topology.objects.land as GeometryCollection;
  const geo = feature(topology, landObject) as unknown as FeatureCollection<Polygon | MultiPolygon>;

  const rings: LatLon[][] = [];
  for (const f of geo.features) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) {
      for (const ring of poly) {
        // GeoJSON 座標係 [lon, lat]，呢度轉做呢個 app 慣用嘅 [lat, lon]
        rings.push(ring.map(([lon, lat]) => [lat, lon] as LatLon));
      }
    }
  }
  cachedRings = rings;
  return rings;
}

/**
 * 揾返同視窗 bbox 有重疊嘅 coastline rings——世界地圖有成千上萬條 ring，
 * 唔篩走好遠嘅大陸就會嘥晒 CPU/SVG 去畫睇都睇唔到嘅嘢。
 */
export function getCoastlineRingsInView(
  latMin: number,
  latMax: number,
  lonMin: number,
  lonMax: number
): LatLon[][] {
  const rings = getAllCoastlineRings();
  const out: LatLon[][] = [];
  for (const ring of rings) {
    let ringLatMin = Infinity, ringLatMax = -Infinity, ringLonMin = Infinity, ringLonMax = -Infinity;
    for (const [lat, lon] of ring) {
      if (lat < ringLatMin) ringLatMin = lat;
      if (lat > ringLatMax) ringLatMax = lat;
      if (lon < ringLonMin) ringLonMin = lon;
      if (lon > ringLonMax) ringLonMax = lon;
    }
    const overlaps = ringLatMin <= latMax && ringLatMax >= latMin && ringLonMin <= lonMax && ringLonMax >= lonMin;
    if (overlaps) out.push(ring);
  }
  return out;
}
