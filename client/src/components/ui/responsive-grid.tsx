
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
  {/* Grid items */}
</div>

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, sm: 2, lg: 3, xl: 4 }, 
  gap = 'md',
  className = "" 
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-2 sm:gap-3',
    md: 'gap-4 sm:gap-6', 
    lg: 'gap-6 sm:gap-8',
    xl: 'gap-8 sm:gap-10'
  };

  const getGridCols = () => {
    const colClasses = [];
    
    if (cols.default) colClasses.push(`grid-cols-${cols.default}`);
    if (cols.sm) colClasses.push(`sm:grid-cols-${cols.sm}`);
    if (cols.md) colClasses.push(`md:grid-cols-${cols.md}`);
    if (cols.lg) colClasses.push(`lg:grid-cols-${cols.lg}`);
    if (cols.xl) colClasses.push(`xl:grid-cols-${cols.xl}`);
    if (cols['2xl']) colClasses.push(`2xl:grid-cols-${cols['2xl']}`);
    
    return colClasses.join(' ');
  };

  return (
    <div className={`grid ${getGridCols()} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveStackProps {
  children: React.ReactNode;
  direction?: 'column' | 'row';
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

export function ResponsiveStack({
  children,
  direction = 'column',
  breakpoint = 'md',
  gap = 'md',
  align = 'start',
  className = ""
}: ResponsiveStackProps) {
  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4', 
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const directionClass = direction === 'column' 
    ? `flex-col ${breakpoint}:flex-row` 
    : `flex-row ${breakpoint}:flex-col`;

  return (
    <div className={`flex ${directionClass} ${alignClasses[align]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveColumnsProps {
  children: React.ReactNode;
  leftColumn: React.ReactNode;
  rightColumn?: React.ReactNode;
  leftWidth?: 'narrow' | 'medium' | 'wide';
  breakpoint?: 'md' | 'lg' | 'xl';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ResponsiveColumns({
  children,
  leftColumn,
  rightColumn,
  leftWidth = 'medium',
  breakpoint = 'lg',
  gap = 'lg',
  className = ""
}: ResponsiveColumnsProps) {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6', 
    lg: 'gap-8',
    xl: 'gap-12'
  };

  const widthClasses = {
    narrow: `${breakpoint}:grid-cols-[250px_1fr]`,
    medium: `${breakpoint}:grid-cols-[300px_1fr]`,
    wide: `${breakpoint}:grid-cols-[350px_1fr]`
  };

  return (
    <div className={`grid grid-cols-1 ${widthClasses[leftWidth]} ${gapClasses[gap]} ${className}`}>
      <div className="order-2 lg:order-1">
        {leftColumn}
      </div>
      <div className="order-1 lg:order-2">
        {rightColumn || children}
      </div>
    </div>
  );
}
