
import React, { useState } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface EditableContentProps {
  isEditing: boolean;
  content: Array<{
    id: string;
    content: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
  onSave: (content: any) => void;
}

export function EditableContent({ isEditing, content, onSave }: EditableContentProps) {
  const [items, setItems] = useState(content);

  const handleContentChange = (id: string, newContent: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, content: newContent } : item
    ));
  };

  const handleLayoutChange = (layout: any) => {
    const newItems = items.map(item => {
      const layoutItem = layout.find((l: any) => l.i === item.id);
      return {
        ...item,
        x: layoutItem.x,
        y: layoutItem.y,
        w: layoutItem.w,
        h: layoutItem.h
      };
    });
    setItems(newItems);
  };

  return (
    <div className="relative">
      {isEditing && (
        <button
          className="absolute top-2 right-2 bg-primary text-white px-4 py-2 rounded"
          onClick={() => onSave(items)}
        >
          Save Changes
        </button>
      )}
      <GridLayout
        className="layout"
        layout={items.map(({ id, x, y, w, h }) => ({ i: id, x, y, w, h }))}
        cols={12}
        rowHeight={30}
        width={1200}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={handleLayoutChange}
      >
        {items.map(({ id, content }) => (
          <div key={id} className="border p-4 bg-white rounded shadow">
            {isEditing ? (
              <textarea
                className="w-full h-full border-none resize-none focus:outline-none"
                value={content}
                onChange={(e) => handleContentChange(id, e.target.value)}
              />
            ) : (
              <div>{content}</div>
            )}
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
