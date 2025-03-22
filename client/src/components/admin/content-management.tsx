import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContentManagement() {
  const { toast } = useToast();
  const [sections, setSections] = useState({
    header: { content: '', isEditing: false },
    footer: { content: '', isEditing: false },
    hero: { content: '', isEditing: false },
    about: { content: '', isEditing: false },
    services: { content: '', isEditing: false },
    testimonials: { content: '', isEditing: false },
    contact: { content: '', isEditing: false },
    privacyPolicy: { content: '', isEditing: false },
    termsOfService: { content: '', isEditing: false }
  });

  useEffect(() => {
    // Load initial content for all sections
    Object.keys(sections).forEach(async (section) => {
      try {
        const response = await apiRequest('GET', `/api/admin/content/${section}`);
        if (response?.content) {
          setSections(prev => ({
            ...prev,
            [section]: { ...prev[section], content: response.content }
          }));
        }
      } catch (error) {
        console.error(`Error loading ${section} content:`, error);
      }
    });
  }, []);

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

      <Tabs defaultValue="main">
        <TabsList>
          <TabsTrigger value="main">Main Sections</TabsTrigger>
          <TabsTrigger value="legal">Legal</TabsTrigger>
          <TabsTrigger value="other">Other Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          {['header', 'hero', 'about', 'services'].map(section => (
            <ContentSection 
              key={section}
              id={section}
              sectionLabel={section.replace(/([A-Z])/g, ' $1').trim()}
              description="" // Add a description if needed
              data={sections[section]}
              onEdit={() => setSections(prev => ({
                ...prev,
                [section]: { ...prev[section], isEditing: !prev[section].isEditing }
              }))}
              onChange={(content) => setSections(prev => ({
                ...prev,
                [section]: { ...prev[section], content }
              }))}
              onSave={() => handleSave(section)}
            />
          ))}
        </TabsContent>

        <TabsContent value="legal">
          {['privacyPolicy', 'termsOfService'].map(section => (
            <ContentSection 
              key={section}
              id={section}
              sectionLabel={section.replace(/([A-Z])/g, ' $1').trim()}
              description="" // Add a description if needed
              data={sections[section]}
              onEdit={() => setSections(prev => ({
                ...prev,
                [section]: { ...prev[section], isEditing: !prev[section].isEditing }
              }))}
              onChange={(content) => setSections(prev => ({
                ...prev,
                [section]: { ...prev[section], content }
              }))}
              onSave={() => handleSave(section)}
            />
          ))}
        </TabsContent>

        <TabsContent value="other">
          {['footer', 'testimonials', 'contact'].map(section => (
            <ContentSection 
              key={section}
              id={section}
              sectionLabel={section.replace(/([A-Z])/g, ' $1').trim()}
              description="" // Add a description if needed
              data={sections[section]}
              onEdit={() => setSections(prev => ({
                ...prev,
                [section]: { ...prev[section], isEditing: !prev[section].isEditing }
              }))}
              onChange={(content) => setSections(prev => ({
                ...prev,
                [section]: { ...prev[section], content }
              }))}
              onSave={() => handleSave(section)}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ContentSectionProps {
  id: string;
  sectionLabel: string;
  description: string;
  data: { content: string; isEditing: boolean };
  onEdit: () => void;
  onChange: (content: string) => void;
  onSave: () => void;
}

function ContentSection({ id, sectionLabel, description, data, onEdit, onChange, onSave }: ContentSectionProps) {
  return (
    <Card className="p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl capitalize">
          {sectionLabel}
        </h3>
        <Button onClick={onEdit}>
          {data.isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>

      {data.isEditing ? (
        <div className="space-y-4">
          <Textarea
            value={data.content}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[200px]"
          />
          <Button onClick={onSave}>Save Changes</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="text-sm font-medium text-slate-500 mb-2">Current Live Content:</h4>
            <div className="prose max-w-none" 
              dangerouslySetInnerHTML={{ __html: data.content || 'No content yet' }} 
            />
          </div>
        </div>
      )}
    </Card>
  );
}