
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ContentManagement() {
  const { toast } = useToast();
  const [sections, setSections] = useState({
    header: { content: '', isEditing: false },
    footer: { content: '', isEditing: false },
    hero: { content: '', isEditing: false }
  });

  const handleSave = async (section: string) => {
    try {
      await apiRequest('PUT', `/api/admin/content/${section}`, {
        content: sections[section].content
      });
      
      setSections(prev => ({
        ...prev,
        [section]: { ...prev[section], isEditing: false }
      }));
      
      toast({
        title: "Success",
        description: "Content updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update content",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Content Management</h2>
      
      {Object.entries(sections).map(([section, data]) => (
        <div key={section} className="border p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl capitalize">{section}</h3>
            <Button 
              onClick={() => setSections(prev => ({
                ...prev,
                [section]: { ...data, isEditing: !data.isEditing }
              }))}
            >
              {data.isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
          
          {data.isEditing ? (
            <div className="space-y-4">
              <Textarea
                value={data.content}
                onChange={(e) => setSections(prev => ({
                  ...prev,
                  [section]: { ...data, content: e.target.value }
                }))}
                className="min-h-[200px]"
              />
              <Button onClick={() => handleSave(section)}>Save Changes</Button>
            </div>
          ) : (
            <div className="prose max-w-none" 
              dangerouslySetInnerHTML={{ __html: data.content || 'No content yet' }} 
            />
          )}
        </div>
      ))}
    </div>
  );
}
