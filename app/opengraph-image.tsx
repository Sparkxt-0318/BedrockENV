import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Bedrock — Environmental Exposure Intelligence';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAF8',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          {/* Logo mark */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#2D6A4F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              B
            </div>
            <span
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: '#1a1a1a',
                letterSpacing: '-0.02em',
              }}
            >
              Bedrock
            </span>
          </div>

          {/* Tagline */}
          <p
            style={{
              fontSize: 24,
              color: '#666666',
              textAlign: 'center',
              maxWidth: 700,
              lineHeight: 1.4,
            }}
          >
            Discover what is contaminating your water and soil.
            Powered by 10+ federal databases.
          </p>

          {/* Data source badges */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginTop: 16,
            }}
          >
            {['EPA', 'USDA', 'NASA', 'FEMA', 'USGS', 'Census'].map((agency) => (
              <div
                key={agency}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: '#2D6A4F15',
                  color: '#2D6A4F',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {agency}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
