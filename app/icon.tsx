import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "linear-gradient(135deg, #10b981, #047857)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="white" />
          <path
            d="M12 6.5l3.5 2.5-1.3 4h-4.4l-1.3-4L12 6.5z"
            fill="#047857"
          />
        </svg>
      </div>
    ),
    size,
  );
}
