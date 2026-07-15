type LayerVisibility = {
  brownfields: boolean;
  floodZone: boolean;
  waterSystem: boolean;
  superfund: boolean;
  echoFacilities: boolean;
};

interface MapLayerControlsProps {
  layers: LayerVisibility;
  onToggle: (layer: keyof LayerVisibility) => void;
  showWaterSystem: boolean;
  showBrownfields: boolean;
  showFloodZone: boolean;
  showSuperfund: boolean;
  showEchoFacilities: boolean;
}

export function MapLayerControls({
  layers,
  onToggle,
  showWaterSystem,
  showBrownfields,
  showFloodZone,
  showSuperfund,
  showEchoFacilities,
}: MapLayerControlsProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {showWaterSystem && (
        <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={layers.waterSystem}
            onChange={() => onToggle('waterSystem')}
            className="rounded"
          />
          Water system
        </label>
      )}
      {showBrownfields && (
        <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={layers.brownfields}
            onChange={() => onToggle('brownfields')}
            className="rounded"
          />
          Brownfield sites
        </label>
      )}
      {showFloodZone && (
        <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={layers.floodZone}
            onChange={() => onToggle('floodZone')}
            className="rounded"
          />
          Flood zone
        </label>
      )}
      {showSuperfund && (
        <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={layers.superfund}
            onChange={() => onToggle('superfund')}
            className="rounded"
          />
          Superfund sites
        </label>
      )}
      {showEchoFacilities && (
        <label className="flex items-center gap-1.5 text-xs text-text-secondary cursor-pointer">
          <input
            type="checkbox"
            checked={layers.echoFacilities}
            onChange={() => onToggle('echoFacilities')}
            className="rounded"
          />
          Regulated facilities
        </label>
      )}
    </div>
  );
}
