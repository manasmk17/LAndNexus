import { useState, useCallback } from 'react';
import { DraggableItem } from './draggable-item';
import { reorderItems } from './utils';

export interface ReorderableListProps<T> {
  items: T[];
  itemType: string;
  onReorder?: (newOrder: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemId: (item: T) => string | number;
  className?: string;
  itemClassName?: string;
}

export function ReorderableList<T>({
  items,
  itemType,
  onReorder,
  renderItem,
  getItemId,
  className,
  itemClassName
}: ReorderableListProps<T>) {
  const [localItems, setLocalItems] = useState<T[]>(items);

  // Update local items when props change
  if (JSON.stringify(items) !== JSON.stringify(localItems)) {
    setLocalItems(items);
  }

  const handleMoveItem = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const newItems = reorderItems(localItems, dragIndex, hoverIndex);
      setLocalItems(newItems);
      
      if (onReorder) {
        onReorder(newItems);
      }
    },
    [localItems, onReorder]
  );

  return (
    <div className={className}>
      {localItems.map((item, index) => (
        <DraggableItem
          key={getItemId(item)}
          id={getItemId(item)}
          index={index}
          type={itemType}
          onMoveItem={handleMoveItem}
          className={itemClassName}
        >
          {renderItem(item, index)}
        </DraggableItem>
      ))}
    </div>
  );
}