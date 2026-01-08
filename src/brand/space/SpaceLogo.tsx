import * as React from "react";
import { colors } from "./tokens";

type Variant = "wordmark" | "mark" | "lockup";

interface SpaceLogoProps extends React.HTMLAttributes<SVGElement | HTMLDivElement> {
  variant?: Variant;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

const wordmarkSvg = (size: number, className?: string, ariaLabel?: string) => (
  <svg
    role="img"
    aria-label={ariaLabel || "SPACE wordmark"}
    width={size * 3}
    height={size}
    viewBox="0 0 210 36"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <text
      x="0"
      y="26"
      fontFamily='"Inter","Segoe UI",system-ui,-apple-system,sans-serif'
      fontSize="26"
      letterSpacing="0.35em"
      fill={colors.ink}
    >
      SPACE
    </text>
  </svg>
);

const markSvg = (size: number, className?: string, ariaLabel?: string) => (
  <svg
    role="img"
    aria-label={ariaLabel || "SPACE mark"}
    width={size}
    height={size}
    viewBox="0 0 64 64"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M32 8l8 16 16 8-16 8-8 16-8-16-16-8 16-8z"
      fill={colors.spaceBlue}
    />
  </svg>
);

export function SpaceLogo({
  variant = "lockup",
  size = 48,
  className,
  ariaLabel,
  ...rest
}: SpaceLogoProps) {
  if (variant === "mark") {
    return React.cloneElement(markSvg(size, className, ariaLabel), rest);
  }

  if (variant === "wordmark") {
    return React.cloneElement(wordmarkSvg(size, className, ariaLabel), rest);
  }

  const gap = Math.max(8, Math.round(size * 0.2));

  return (
    <div
      role="img"
      aria-label={ariaLabel || "SPACE logo"}
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap }}
      {...rest}
    >
      {markSvg(size, undefined, ariaLabel)}
      {wordmarkSvg(size, undefined, ariaLabel)}
    </div>
  );
}
