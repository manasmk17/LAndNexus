import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "white" | "blue-flat" | "blue-gradient" | "symbol";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  clickable?: boolean;
  href?: string;
}

const sizeClasses = {
  sm: "h-8 w-auto",
  md: "h-10 w-auto", 
  lg: "h-16 w-auto",
  xl: "h-24 w-auto"
};

export function Logo({ 
  variant = "blue-flat", 
  size = "md", 
  className, 
  clickable = false,
  href = "/"
}: LogoProps) {
  const logoSrc = `/logos/logo-${variant}.png`;
  
  const logoElement = (
    <img
      src={logoSrc}
      alt="L&D Nexus"
      className={cn(sizeClasses[size], className)}
      loading="lazy"
    />
  );

  if (clickable) {
    return (
      <a href={href} className="inline-block">
        {logoElement}
      </a>
    );
  }

  return logoElement;
}