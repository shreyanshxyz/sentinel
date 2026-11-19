import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function iconProps(props: IconProps) {
  return {
    width: 14,
    height: 14,
    viewBox: "0 0 16 16",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="7" cy="7" r="4.25" />
      <path d="M10.2 10.2 13.5 13.5" />
    </svg>
  );
}

export function PulseIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M1.5 8.5h3l1.75-4 3 8 1.75-4h3.5" />
    </svg>
  );
}

export function BarsIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M3 13V7.5M8 13V3M13 13V9.5" />
    </svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="8" cy="8" r="2.25" />
      <path d="M8 1.75v1.4M8 12.85v1.4M13.3 4.7l-1.2.7M3.9 10.6l-1.2.7M13.3 11.3l-1.2-.7M3.9 5.4l-1.2-.7" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1.25v1.5M8 13.25v1.5M14.75 8h-1.5M2.75 8h-1.5M12.77 3.23l-1.06 1.06M4.29 11.71l-1.06 1.06M12.77 12.77l-1.06-1.06M4.29 4.29 3.23 3.23" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M13.5 9.4A5.75 5.75 0 0 1 6.6 2.5a5.75 5.75 0 1 0 6.9 6.9Z" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m4 6.5 4 4 4-4" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="m3.5 8.5 3 3 6-6.5" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12.5 8h-9M7 3.5 2.5 8 7 12.5" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <rect x="5.5" y="5.5" width="7.5" height="7.5" rx="1.2" />
      <path d="M10.5 3.5a1.2 1.2 0 0 0-1.2-1.2H4.2A1.2 1.2 0 0 0 3 3.5v5.1a1.2 1.2 0 0 0 1.2 1.2" />
    </svg>
  );
}

export function RetryIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2.5V5.6h-3.1" />
    </svg>
  );
}
