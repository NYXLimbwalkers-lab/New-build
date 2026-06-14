import { useEffect, useState } from "react";
import type { RendererProps } from "./types";
import { SvgLayerRenderer } from "./SvgLayerRenderer";
import { PhotoLayerRenderer } from "./PhotoLayerRenderer";
import {
  loadLayerManifest,
  manifestCovers,
  type LayerManifest,
} from "./layerManifest";

/*
  The active preview engine — a thin selector over the swappable renderers:
    • PhotoLayerRenderer  — REAL transparent-PNG photo layers (preferred)
    • SvgLayerRenderer    — vector placeholder, used until the layer library
                            exists or for builds the library doesn't yet cover.
  This is the ONLY place the choice is made; the step flow never changes.
  A future three.js/WebGL renderer slots in here the same way.
*/
let cached: LayerManifest | null | undefined;

export function CandleRenderer(props: RendererProps) {
  const [manifest, setManifest] = useState<LayerManifest | null | undefined>(cached);

  useEffect(() => {
    if (cached !== undefined) return;
    let alive = true;
    loadLayerManifest().then((m) => {
      cached = m;
      if (alive) setManifest(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (manifest && manifestCovers(manifest, props.config)) {
    return <PhotoLayerRenderer {...props} manifest={manifest} />;
  }
  return <SvgLayerRenderer {...props} />;
}

export type { RendererProps } from "./types";
