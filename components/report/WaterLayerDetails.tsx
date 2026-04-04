import { WaterLayerData } from '@/types/exposure';
import { RiskBadge } from '@/components/ui';

interface WaterLayerDetailsProps {
  data: WaterLayerData;
}

export function WaterLayerDetails({ data }: WaterLayerDetailsProps) {
  return (
    <div className="space-y-5 text-sm">
      {/* PFAS Section */}
      <div>
        <h4 className="font-medium text-text-primary mb-2">PFAS Testing (EPA UCMR 5)</h4>
        {data.pfas ? (
          <>
            {data.pfas.analytes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-text-secondary">
                  Water system <strong>{data.pfas.systemName}</strong> reported{' '}
                  {data.pfas.analytes.length} PFAS analyte(s) detected in testing.
                  {data.pfas.exceedsMcl && (
                    <span className="text-exposure-high font-medium">
                      {' '}One or more exceed EPA Maximum Contaminant Levels.
                    </span>
                  )}
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 pr-3 font-medium text-text-secondary">Analyte</th>
                      <th className="text-right py-1.5 pr-3 font-medium text-text-secondary">Detected (ppt)</th>
                      <th className="text-right py-1.5 pr-3 font-medium text-text-secondary">EPA MCL (ppt)</th>
                      <th className="text-right py-1.5 font-medium text-text-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pfas.analytes.slice(0, 10).map((a) => (
                      <tr key={a.name} className="border-b border-border/50">
                        <td className="py-1.5 pr-3 text-text-primary">{a.name}</td>
                        <td className="py-1.5 pr-3 text-right text-text-primary">{a.concentration.toFixed(1)}</td>
                        <td className="py-1.5 pr-3 text-right text-text-secondary">{a.mcl > 0 ? a.mcl : '—'}</td>
                        <td className="py-1.5 text-right">
                          {a.exceedsMcl ? (
                            <span className="text-exposure-high font-medium">Exceeds MCL</span>
                          ) : (
                            <span className="text-exposure-low">Below MCL</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-text-tertiary mt-1">
                  Source: EPA UCMR 5 testing data. Testing period: {data.pfas.testingPeriod}
                </p>
              </div>
            ) : (
              <p className="text-text-secondary">
                No PFAS detections reported for water system {data.pfas.systemName}.
              </p>
            )}
          </>
        ) : (
          <p className="text-text-tertiary">
            No UCMR 5 PFAS testing data available for water system {data.systemName}.
            This water system may not have been included in EPA&apos;s UCMR 5 monitoring program.
          </p>
        )}
      </div>

      {/* Lead Risk Section */}
      <div>
        <h4 className="font-medium text-text-primary mb-2">Lead Risk Assessment</h4>
        {data.leadRisk ? (
          <div className="flex items-start gap-3">
            <RiskBadge tier={data.leadRisk.riskTier} />
            <div>
              <p className="text-text-secondary">
                Neighborhood-level census data indicates <strong>{data.leadRisk.pctPre1986}%</strong> of
                housing in your census block group was built before 1986 (when lead solder was commonly
                used in plumbing), and <strong>{data.leadRisk.pctPreA1950}%</strong> was built before 1950
                (higher probability of lead service lines).
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Source: U.S. Census ACS 2022, Table B25034.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-text-tertiary">Housing age data not available for this block group.</p>
        )}
      </div>

      {/* Violations Section */}
      <div>
        <h4 className="font-medium text-text-primary mb-2">Water System Violations (EPA SDWIS)</h4>
        {data.violations.length > 0 ? (
          <div>
            <p className="text-text-secondary mb-2">
              Water system <strong>{data.systemName}</strong> has{' '}
              <strong>{data.violations.length}</strong> violation(s) on record.
            </p>
            <div className="space-y-1.5">
              {data.violations.slice(0, 5).map((v, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs px-3 py-1.5 rounded bg-bg-elevated"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${v.isHealthBased ? 'bg-exposure-high' : 'bg-exposure-moderate'}`} />
                  <span className="text-text-primary font-medium">{v.type}</span>
                  <span className="text-text-secondary">— {v.contaminant}</span>
                  <span className="text-text-tertiary ml-auto">{v.beginDate ? new Date(v.beginDate).getFullYear() : '—'}</span>
                </div>
              ))}
              {data.violations.length > 5 && (
                <p className="text-xs text-text-tertiary">
                  + {data.violations.length - 5} more violation(s)
                </p>
              )}
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              Source: EPA Safe Drinking Water Information System (SDWIS).
            </p>
          </div>
        ) : (
          <p className="text-exposure-low">
            No violations on record for water system {data.systemName}.
          </p>
        )}
      </div>
    </div>
  );
}
