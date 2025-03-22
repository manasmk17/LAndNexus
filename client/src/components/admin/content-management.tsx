
import { useState, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { apiRequest } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ContentSection {
  id: string;
  title: string;
  content: string;
}

export default function ContentManagement() {
  const [editMode, setEditMode] = useState(false);
  const [sections, setSections] = useState<ContentSection[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/content-sections');
      setSections(response);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load content sections",
        variant: "destructive"
      });
    }
  };

  const handleSave = async (id: string, content: string) => {
    try {
      await apiRequest('PUT', `/api/admin/content-sections/${id}`, { content });
      toast({
        title: "Success",
        description: "Content saved successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save content",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center gap-4 mb-8">
        <Label htmlFor="edit-mode">Edit Mode</Label>
        <Switch
          id="edit-mode"
          checked={editMode}
          onCheckedChange={setEditMode}
        />
      </div>

      <div className="space-y-8">
        {sections.map((section) => (
          <Card key={section.id} className="p-6">
            <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
            {editMode ? (
              <div className="space-y-4">
                <Editor
                  apiKey="your-tinymce-api-key"
                  initialValue={section.content}
                  init={{
                    height: 400,
                    menubar: true,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                      'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
                      'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | bold italic | alignleft aligncenter alignright | bullist numlist | link image | preview'
                  }}
                />
                <Button 
                  onClick={() => handleSave(section.id, section.content)}
                  className="mt-4"
                >
                  Save Changes
                </Button>
              </div>
            ) : (
              <div 
                className="prose max-w-none" 
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
