/**
 * LaunchName mark: a domain (center node) wired out to the network it
 * connects — the web, DNS, and agents — with the amber node marking the
 * new connection LaunchName creates. Pure SVG so it works in server and
 * client components alike; the tile gradient lives in CSS to avoid
 * duplicate SVG gradient ids when the mark renders more than once.
 */
export function LogoMark({ size = 24, title = "LaunchName" }: { size?: number; title?: string }) {
  return (
    <span
      role="img"
      aria-label={title}
      style={{
        display: "inline-flex",
        flexShrink: 0,
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "linear-gradient(140deg, #8f74ff 0%, #7c5cff 45%, #5d3fd5 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), 0 4px 14px -4px rgba(124,92,255,0.6)",
      }}
    >
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
        <g stroke="rgba(255,255,255,0.72)" strokeWidth="1.3" strokeLinecap="round">
          <line x1="12" y1="12.6" x2="12" y2="5.6" />
          <line x1="12" y1="12.6" x2="6.2" y2="16.2" />
          <line x1="12" y1="12.6" x2="17.8" y2="16.2" />
        </g>
        <circle cx="12" cy="5.6" r="1.9" fill="#fff" />
        <circle cx="6.2" cy="16.2" r="1.9" fill="#fff" />
        <circle cx="17.8" cy="16.2" r="2.1" fill="#ffa247" />
        <circle cx="12" cy="12.6" r="3" fill="#fff" />
        <circle cx="12" cy="12.6" r="1.2" fill="#7c5cff" />
      </svg>
    </span>
  );
}
