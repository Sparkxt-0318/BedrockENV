type LayerVisibility = {
  brownfields: boolean;
  floodZone: boolean;
  waterSystem: boolean;
  superfund: boolean;
  echoFacilities: boolean;
};

interface MapLegendProps {
  layers: LayerVisibility;
  showWaterSystem: boolean;
  waterPfasExceedsMcl?: boolean;
  waterHasPfas?: boolean;
  hasBrownfields: boolean;
  floodZone?: { zone: string } | null;
  hasSuperfund: boolean;
  hasEchoFacilities: boolean;
}

export function MapLegend({
  layers,
  showWaterSystem,
  waterPfasExceedsMcl,
  waterHasPfas,
  hasBrownfields,
  floodZone,
  hasSuperfund,
  hasEchoFacilities,
}: MapLegendProps) {
  const waterColor = waterPfasExceedsMcl ? '#E76F51'
    : waterHasPfas ? '#F4A261'
    : '#40916C';

  return (
    <div className="px-4 py-2 border-t border-border flex flex-wrap gap-4 text-xs text-text-secondary">
      <span className="flex items-center gap-1">
        <span className="w-3 h-3 rounded-full bg-accent inline-block" /> Your property
      </span>
      {layers.waterSystem && showWaterSystem && (
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full inline-block" style={{ background: waterColor }} />
          Water system
        </span>
      )}
      {layers.brownfields && hasBrownfields && (
        <>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-exposure-high inline-block" /> &lt;0.5 mi
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-exposure-elevated inline-block" /> 0.5–1 mi
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-exposure-moderate inline-block" /> 1–2 mi
          </span>
        </>
      )}
      {layers.floodZone && floodZone && (
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block border border-blue-400" style={{ background: 'rgba(59,130,246,0.15)' }} />
          Flood Zone {floodZone.zone}
        </span>
      )}
      {layers.superfund && hasSuperfund && (
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#C23B22' }} />
          Superfund NPL
        </span>
      )}
      {layers.echoFacilities && hasEchoFacilities && (
        <>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#F4A261' }} />
            TRI facility
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: '#86807A' }} />
            Regulated
          </span>
        </>
      )}
    </div>
  );
}
