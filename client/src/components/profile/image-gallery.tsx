import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ExpandIcon, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";

interface GalleryImage {
  path: string;
  caption?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  title?: string;
}

export default function ImageGallery({ images, title = "Portfolio Gallery" }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);
  
  if (!images || images.length === 0) {
    return (
      <Card className="border-dashed border-gray-300">
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No gallery images available.</p>
        </CardContent>
      </Card>
    );
  }
  
  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
  };
  
  const closeLightbox = () => {
    setCurrentImageIndex(null);
  };
  
  const goToPrevious = () => {
    if (currentImageIndex === null) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };
  
  const goToNext = () => {
    if (currentImageIndex === null) return;
    setCurrentImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };
  
  const currentImage = currentImageIndex !== null ? images[currentImageIndex] : null;
  
  return (
    <>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div 
              key={index} 
              className="relative aspect-square rounded-md overflow-hidden cursor-pointer group"
              onClick={() => openLightbox(index)}
            >
              <img 
                src={`/${image.path}`} 
                alt={image.caption || `Gallery image ${index + 1}`} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://via.placeholder.com/300x300?text=Image+Error";
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300">
                <ExpandIcon className="text-white opacity-0 group-hover:opacity-100 w-8 h-8" />
              </div>
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {image.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <Dialog open={currentImageIndex !== null} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none">
          <div className="relative h-[80vh] flex items-center justify-center">
            {currentImage && (
              <img 
                src={`/${currentImage.path}`} 
                alt={currentImage.caption || `Gallery image ${currentImageIndex ? currentImageIndex + 1 : 1}`} 
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://via.placeholder.com/800x600?text=Image+Error";
                }}
              />
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full"
              onClick={closeLightbox}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute left-2 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full"
              onClick={goToNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
            
            {currentImage?.caption && (
              <div className="absolute bottom-4 left-4 right-4 p-3 bg-black bg-opacity-70 text-white rounded">
                {currentImage.caption}
              </div>
            )}
            
            <div className="absolute bottom-4 right-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full"
                onClick={() => {
                  if (currentImage) {
                    const link = document.createElement('a');
                    link.href = `/${currentImage.path}`;
                    link.download = currentImage.path.split('/').pop() || 'image';
                    link.click();
                  }
                }}
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="bg-gray-900 p-4 overflow-x-auto">
            <div className="flex space-x-2">
              {images.map((image, index) => (
                <div 
                  key={index} 
                  className={`w-16 h-16 flex-shrink-0 cursor-pointer rounded overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex ? 'border-blue-500' : 'border-transparent'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img 
                    src={`/${image.path}`} 
                    alt={`Thumbnail ${index + 1}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "https://via.placeholder.com/100x100?text=Error";
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}