export function DisclaimerBanner() {
  return (
    <div className="border-t border-border bg-bg-elevated px-4 py-4 text-center">
      <p className="text-xs text-text-tertiary leading-5 max-w-3xl mx-auto">
        Bedrock aggregates publicly available environmental data for informational purposes.
        This is not a substitute for professional environmental testing or medical advice.
        Water system data reflects utility-level testing, not tap-level conditions at individual
        properties. Soil survey data represents dominant soil types within map units and may not
        reflect exact conditions at a specific property.
      </p>
    </div>
  );
}
