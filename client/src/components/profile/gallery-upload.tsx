import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Trash2, UploadCloud, Plus, Loader2, X, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { secureFileUpload, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GalleryImage {
  path: string;
  caption?: string;
}

interface GalleryUploadProps {
  professionalId: number;
  existingImages?: GalleryImage[];
  onImagesUpdated: (images: GalleryImage[]) => void;
}

export default function GalleryUpload({ 
  professionalId, 
  existingImages = [], 
  onImagesUpdated 
}: GalleryUploadProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<GalleryImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(null);
  const [captionInput, setCaptionInput] = useState("");
  
  // Upload image mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "gallery");
      formData.append("professionalId", professionalId.toString());
      
      const response = await secureFileUpload(
        `/api/professional-profiles/${professionalId}/gallery-upload`,
        formData
      );
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setImages(prev => [...prev, { path: data.filePath }]);
      onImagesUpdated([...images, { path: data.filePath }]);
      
      toast({
        title: "Image uploaded",
        description: "Your gallery image was uploaded successfully.",
      });
      
      // Invalidate professional profile cache to reflect the new image
      queryClient.invalidateQueries({
        queryKey: [`/api/professional-profiles/${professionalId}`]
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUploading(false);
    }
  });
  
  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: async (imagePath: string) => {
      const response = await fetch(`/api/professional-profiles/${professionalId}/gallery-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imagePath }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete image");
      }
      
      return imagePath;
    },
    onSuccess: (imagePath) => {
      setImages(prev => prev.filter(img => img.path !== imagePath));
      onImagesUpdated(images.filter(img => img.path !== imagePath));
      
      toast({
        title: "Image deleted",
        description: "Your gallery image was deleted successfully.",
      });
      
      // Invalidate professional profile cache to reflect the removed image
      queryClient.invalidateQueries({
        queryKey: [`/api/professional-profiles/${professionalId}`]
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check if file is an image
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      uploadMutation.mutate(file);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleDeleteImage = (imagePath: string) => {
    deleteMutation.mutate(imagePath);
  };
  
  const openEditDialog = (index: number) => {
    setCurrentImageIndex(index);
    setCaptionInput(images[index].caption || "");
    setEditDialogOpen(true);
  };
  
  const saveCaption = () => {
    if (currentImageIndex !== null) {
      const updatedImages = [...images];
      updatedImages[currentImageIndex] = {
        ...updatedImages[currentImageIndex],
        caption: captionInput
      };
      
      setImages(updatedImages);
      onImagesUpdated(updatedImages);
      setEditDialogOpen(false);
      
      toast({
        title: "Caption updated",
        description: "Image caption was updated successfully.",
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Portfolio Gallery</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4 mr-2" />
                )}
                Add Image
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload an image to your gallery (Max 5MB)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </div>
      
      {images.length === 0 ? (
        <Card className="border-dashed border-gray-300">
          <CardContent className="flex flex-col items-center justify-center p-6 space-y-2">
            <div 
              className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-8 w-8 text-gray-500" />
            </div>
            <p className="text-gray-500 text-center">
              No gallery images yet. Click to upload your first image.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="group relative aspect-square rounded-md overflow-hidden">
              <img 
                src={`/${image.path}`} 
                alt={image.caption || `Gallery image ${index + 1}`} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://via.placeholder.com/300x300?text=Image+Error";
                }}
              />
              
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70"
                    onClick={() => openEditDialog(index)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 hover:text-red-400"
                    onClick={() => handleDeleteImage(image.path)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black bg-opacity-50 text-white text-sm">
                  {image.caption}
                </div>
              )}
            </div>
          ))}
          
          {/* Add new image button */}
          <div 
            className="aspect-square rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <Plus className="h-8 w-8 text-gray-400 mb-1" />
            <span className="text-sm text-gray-500">Add Image</span>
          </div>
        </div>
      )}
      
      {/* Caption edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Image Caption</DialogTitle>
            <DialogDescription>
              Add a caption to describe this image
            </DialogDescription>
          </DialogHeader>
          
          {currentImageIndex !== null && (
            <div className="space-y-4">
              <div className="aspect-video rounded-md overflow-hidden bg-gray-100">
                <img 
                  src={`/${images[currentImageIndex].path}`} 
                  alt="Preview" 
                  className="w-full h-full object-contain"
                />
              </div>
              
              <Input
                placeholder="Add a caption (optional)"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={saveCaption}>
              Save Caption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}