import { useState, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { cn } from '@/lib/utils';
import { UploadCloud, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  acceptedFileTypes?: string[];
  maxSize?: number; // in bytes
  className?: string;
  label?: string;
  value?: File | null;
}

const NativeFileUploadZone = ({ 
  onFileSelect, 
  acceptedFileTypes = ['image/*', 'application/pdf'], 
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
  label = 'Drag & drop a file here, or click to select a file',
  value
}: FileUploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileSelection(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    handleFileSelection(file);
  };

  const handleFileSelection = (file?: File) => {
    if (!file) return;
    
    setError(null);
    
    // Check file type
    const fileType = file.type;
    const isValidType = acceptedFileTypes.some(type => {
      if (type.includes('*')) {
        const category = type.split('/')[0];
        return fileType.startsWith(category + '/');
      }
      return type === fileType;
    });
    
    if (!isValidType) {
      setError(`Invalid file type. Accepted types: ${acceptedFileTypes.join(', ')}`);
      return;
    }
    
    // Check file size
    if (file.size > maxSize) {
      setError(`File too large. Maximum size: ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }
    
    onFileSelect(file);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null as any);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
          isDragging ? 'border-primary bg-primary/10' : 'border-muted',
          value ? 'bg-primary/5' : '',
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={acceptedFileTypes.join(',')}
          ref={inputRef}
        />
        
        {value ? (
          <div className="flex items-center justify-center space-x-3">
            <File className="h-6 w-6 text-primary" />
            <span className="font-medium text-sm truncate max-w-[200px]">{value.name}</span>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 p-0 rounded-full" 
              onClick={clearFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-destructive text-sm mt-2">{error}</p>
      )}
    </div>
  );
};

// DnD Compatible File Upload Zone
export function FileUploadZone(props: FileUploadZoneProps) {
  const [{ canDrop, isOver }, drop] = useDrop({
    accept: 'file',
    drop: (item: any) => {
      // This handles files from React DnD file dragging
      if (item.files && item.files.length > 0) {
        props.onFileSelect(item.files[0]);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = canDrop && isOver;

  return (
    <div 
      ref={drop}
      className={cn(
        isActive ? 'border-primary bg-primary/10' : '',
        'transition-colors'
      )}
    >
      <NativeFileUploadZone {...props} />
    </div>
  );
}