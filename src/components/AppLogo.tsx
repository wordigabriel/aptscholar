import { HTMLAttributes } from "react";

interface AppLogoProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "icon" | "full";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export default function AppLogo({
  variant = "full",
  size = "md",
  showText = true,
  className = "",
  ...props
}: AppLogoProps) {
  // Size classes for the icon container
  const iconSizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-20 h-20",
    xl: "w-32 h-32",
  };

  // Text size classes
  const titleSizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const subtitleSizeClasses = {
    xs: "text-[6px]",
    sm: "text-[8px]",
    md: "text-[10px]",
    lg: "text-xs",
    xl: "text-sm",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${className}`}
      {...props}
    >
      {/* Dynamic Emblem SVG */}
      <div className={`${iconSizeClasses[size]} relative flex-shrink-0`}>
        <svg
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
        >
          {/* Main Rounded Square Container - Ocean Blue background */}
          <rect
            width="512"
            height="512"
            rx="124"
            fill="#004680"
          />
          
          {/* White stylized book + 'A' emblem */}
          <g>
            {/* Left page backing shadow line or border */}
            <path
              d="M 218 108 L 191 108 C 184 108 179 113 179 120 L 179 402 C 179 411 187 417 196 415 C 223 408 249 418 256 422"
              stroke="#002a4d"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.3"
            />
            
            {/* Outer Left Frame line */}
            <path
              d="M 185 125 L 185 396 C 185 401 189 405 194 404 C 218 398 242 406 256 411 C 256 411 240 280 256 210"
              stroke="white"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.2"
            />

            {/* Left Page Wing */}
            <path
              d="M 256 420 C 240 410 210 401 185 405 C 185 405 185 240 185 220 L 185 125 C 210 120 240 128 256 138 Z"
              fill="white"
            />

            {/* Right Page Wing */}
            <path
              d="M 256 420 C 272 410 302 401 327 405 C 327 405 327 240 327 220 L 327 125 C 302 120 272 128 256 138 Z"
              fill="white"
            />
            
            {/* The Stylized 'A' Crease Cutout inside book */}
            {/* Left leg cutout / divider */}
            <path
              d="M 256 138 L 205 396 L 243 405 L 256 312 L 256 138"
              fill="#004680"
            />
            
            {/* Right leg cutout / divider */}
            <path
              d="M 256 138 L 307 396 L 269 405 L 256 312 L 256 138"
              fill="#003561"
            />
            
            {/* Outer book flaps (Side curves) */}
            {/* Left flap outline */}
            <path
              d="M 179 130 C 145 130 145 390 179 390"
              stroke="white"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.9"
            />
            {/* Right flap outline */}
            <path
              d="M 333 130 C 367 130 367 390 333 390"
              stroke="white"
              strokeWidth="20"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* Inner A crossbar and central triangle gap */}
            {/* The inner capital A triangle window */}
            <polygon
              points="256,175 238,276 274,276"
              fill="white"
            />
            
            {/* Center line detail inside Inner A triangle */}
            <line
              x1="256" y1="175" x2="256" y2="276"
              stroke="#004680"
              strokeWidth="4"
            />
            
            {/* Book pages bottoms curve effect */}
            <path
              d="M 179 385 C 215 385 245 422 256 422 C 267 422 297 385 333 385"
              stroke="#004680"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 179 390 C 215 390 245 425 256 425 C 267 425 297 390 333 390"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      {/* Brand Text Labels - custom context adaptive */}
      {showText && variant === "full" && (
        <div className="mt-3 text-center md:mt-4 font-sans">
          <div
            className={`font-display font-black tracking-tight text-white uppercase ${titleSizeClasses[size]}`}
          >
            APT<span className="text-neon-green">Scholar</span>
          </div>
          <div
            className={`font-mono font-medium tracking-widest text-gray-400 uppercase mt-0.5 ${subtitleSizeClasses[size]}`}
          >
            Study Smart
          </div>
        </div>
      )}
    </div>
  );
}
