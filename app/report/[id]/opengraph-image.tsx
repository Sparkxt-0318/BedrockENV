import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Bedrock Exposure Report';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function ReportOGImage({ params }: { params: { id: string } }) {
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
            gap: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#2D6A4F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              B
            </div>
            <span
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: '#1a1a1a',
              }}
            >
              Bedrock
            </span>
          </div>

          <p
            style={{
              fontSize: 20,
              color: '#666',
              marginTop: 0,
            }}
          >
            Environmental Exposure Report
          </p>

          <p
            style={{
              fontSize: 16,
              color: '#999',
            }}
          >
            Report ID: {params.id}
          </p>

          {/* Score gauge illustration */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: '6px solid #2D6A4F',
              marginTop: 12,
            }}
          >
            <span
              style={{
                fontSize: 14,
                color: '#2D6A4F',
                fontWeight: 600,
              }}
            >
              View Report
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 16,
            }}
          >
            {['Water', 'Soil', 'PFAS', 'Lead', 'Flood'].map((tag) => (
              <div
                key={tag}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  backgroundColor: '#f0f0ee',
                  color: '#555',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
