import React from "react";

export default function AuthorCard({ name, title, image, url }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        marginTop: "2.5rem",
        padding: "1rem 1.25rem",
        borderTop: "1px solid var(--ifm-toc-border-color)",
        backgroundColor: "var(--ifm-background-surface-color)",
        borderRadius: "12px",
      }}
    >
      {/* "By:" label */}
      <div
        style={{
          fontSize: "0.95rem",
          color: "var(--ifm-color-text-muted)",
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        By:
      </div>

      {/* Author image */}
      <img
        src={image}
        alt={name}
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          objectFit: "cover",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        }}
      />

      {/* Author text */}
      <div style={{ lineHeight: 1.5 }}>
        <p
          style={{
            fontWeight: 600,
            fontSize: "1.1rem",
            margin: "0 0 4px 0",
            color: "var(--ifm-heading-color)",
          }}
        >
          {name}
        </p>
        <p
          style={{
            margin: 0,
            color: "var(--ifm-color-text-muted)",
            fontSize: "0.95rem",
            fontStyle: "italic",
          }}
        >
          {title}
        </p>

        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              marginTop: 6,
              fontSize: "0.9rem",
              color: "var(--ifm-link-color)",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.color = "var(--ifm-link-hover-color)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.color = "var(--ifm-link-color)")
            }
          >
            LinkedIn →
          </a>
        )}
      </div>
    </div>
  );
}
