import { CompositeScore } from '@/types/exposure';
import { getExposureColor, getExposureLabel } from '@/lib/utils';

interface ExposureScoreGaugeProps {
  compositeScore: CompositeScore;
}

export function ExposureScoreGauge({ compositeScore }: ExposureScoreGaugeProps) {
  const { score, confidence, layersIncluded, sufficient } = compositeScore;
  const isInsufficient = confidence === 'insufficient' || sufficient === false;
  const color = isInsufficient ? 'var(--text-tertiary)' : getExposureColor(score);
  const label = isInsufficient ? 'Insufficient Data' : getExposureLabel(score);

  // SVG circular gauge
  const size = 200;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = isInsufficient ? 0 : (score / 100) * circumference;

  const confidenceLabel =
    confidence === 'insufficient'
      ? 'Insufficient'
      : confidence === 'high'
        ? 'High'
        : confidence === 'moderate'
          ? 'Moderate'
          : 'Low';

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isInsufficient ? (
            <span className="text-2xl text-text-tertiary">—</span>
          ) : (
            <span
              className="font-[family-name:var(--font-instrument-serif)] text-5xl"
              style={{ color }}
            >
              {score}
            </span>
          )}
          <span className="text-sm text-text-secondary mt-1">
            {isInsufficient ? 'insufficient data' : 'out of 100'}
          </span>
        </div>
      </div>

      {/* Label and confidence */}
      <div className="mt-4 text-center">
        <p className="text-lg font-semibold" style={{ color }}>
          {label}{isInsufficient ? '' : ' Exposure'}
        </p>
        <p className="text-sm text-text-tertiary mt-1">
          {confidenceLabel} confidence — based on {layersIncluded.length} of 5 data layers
        </p>
      </div>
    </div>
  );
}
