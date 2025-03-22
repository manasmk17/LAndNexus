import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';

interface DropContainerProps {
  children: React.ReactNode;
  type: string;
  onDrop?: (item: any) => void;
  className?: string;
  accept?: string[];
}

/**
 * A container that can accept dropped items
 */
export function DropContainer({
  children,
  type,
  onDrop,
  className,
  accept = [type],
}: DropContainerProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept,
    drop: (item, monitor) => {
      if (onDrop) {
        onDrop(item);
      }
      return { name: 'Container' };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = isOver && canDrop;

  return (
    <div
      ref={drop}
      className={cn(
        'transition-colors rounded min-h-[100px]',
        isActive ? 'bg-primary/10 border-2 border-dashed border-primary' : '',
        canDrop ? 'bg-primary/5' : '',
        className
      )}
    >
      {children}
    </div>
  );
}