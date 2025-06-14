import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, Download, ExternalLink, FileText, Plus, Calendar, Building, Trophy, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";

interface PortfolioShowcaseProps {
  professionalId: number;
  isOwner: boolean;
}

export function PortfolioShowcase({ professionalId, isOwner }: PortfolioShowcaseProps) {
  const [activeTab, setActiveTab] = useState("awards");

  // Fetch portfolio data
  const { data: awards = [] } = useQuery({
    queryKey: ['/api/professional-profiles', professionalId, 'awards'],
    enabled: !!professionalId
  });

  const { data: trainingMaterials = [] } = useQuery({
    queryKey: ['/api/professional-profiles', professionalId, 'training-materials'],
    enabled: !!professionalId
  });

  const { data: certifications = [] } = useQuery({
    queryKey: ['/api/professional-profiles', professionalId, 'certification-portfolio'],
    enabled: !!professionalId
  });

  const { data: portfolioLinks = [] } = useQuery({
    queryKey: ['/api/professional-profiles', professionalId, 'portfolio-links'],
    enabled: !!professionalId
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Portfolio Showcase
        </CardTitle>
        <CardDescription>
          Professional achievements, training materials, certifications, and portfolio links
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 h-auto gap-1 p-1">
            <TabsTrigger value="awards" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Awards & Recognition</span>
              <span className="sm:hidden">Awards</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Training Materials</span>
              <span className="sm:hidden">Materials</span>
            </TabsTrigger>
            <TabsTrigger value="certifications" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Certifications</span>
              <span className="sm:hidden">Certs</span>
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="text-xs sm:text-sm px-2 py-2">
              <span className="hidden sm:inline">Portfolio Links</span>
              <span className="sm:hidden">Links</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="awards" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Awards & Recognition</h3>
              {isOwner && (
                <AddAwardDialog professionalId={professionalId} />
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {awards.map((award: any) => (
                <AwardCard key={award.id} award={award} isOwner={isOwner} />
              ))}
              {awards.length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  No awards added yet
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Training Materials Library</h3>
              {isOwner && (
                <AddTrainingMaterialDialog professionalId={professionalId} />
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {trainingMaterials.map((material: any) => (
                <TrainingMaterialCard key={material.id} material={material} isOwner={isOwner} />
              ))}
              {trainingMaterials.length === 0 && (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  No training materials added yet
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="certifications" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Certification Portfolio</h3>
              {isOwner && (
                <AddCertificationDialog professionalId={professionalId} />
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {certifications.map((cert: any) => (
                <CertificationCard key={cert.id} certification={cert} isOwner={isOwner} />
              ))}
              {certifications.length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  No certifications added yet
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">External Portfolio Links</h3>
              {isOwner && (
                <AddPortfolioLinkDialog professionalId={professionalId} />
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {portfolioLinks.map((link: any) => (
                <PortfolioLinkCard key={link.id} portfolioLink={link} isOwner={isOwner} />
              ))}
              {portfolioLinks.length === 0 && (
                <div className="col-span-3 text-center py-8 text-muted-foreground">
                  No portfolio links added yet
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Award Card Component
function AwardCard({ award, isOwner }: { award: any; isOwner: boolean }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Award className="h-5 w-5 text-yellow-600 mt-1" />
          {award.category && (
            <Badge variant="secondary" className="text-xs">
              {award.category}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{award.title}</CardTitle>
        <CardDescription className="text-sm">
          {award.awardingOrganization} • {format(new Date(award.dateReceived), 'MMM yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {award.description && (
          <p className="text-sm text-muted-foreground mb-3">{award.description}</p>
        )}
        <div className="flex gap-2">
          {award.verificationUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={award.verificationUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Verify
              </a>
            </Button>
          )}
          {award.imageUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={award.imageUrl} target="_blank" rel="noopener noreferrer">
                View Certificate
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Training Material Card Component
function TrainingMaterialCard({ material, isOwner }: { material: any; isOwner: boolean }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <FileText className="h-5 w-5 text-blue-600 mt-1" />
          <Badge variant="outline" className="text-xs">
            {material.materialType}
          </Badge>
        </div>
        <CardTitle className="text-lg">{material.title}</CardTitle>
        {material.description && (
          <CardDescription className="text-sm">{material.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {material.tags && material.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {material.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          {material.fileUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={material.fileUrl} target="_blank" rel="noopener noreferrer">
                <Download className="h-3 w-3 mr-1" />
                Download
              </a>
            </Button>
          )}
          {material.downloadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {material.downloadCount} downloads
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Certification Card Component
function CertificationCard({ certification, isOwner }: { certification: any; isOwner: boolean }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Award className="h-5 w-5 text-green-600 mt-1" />
          {certification.isVerified && (
            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
              Verified
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{certification.certificationName}</CardTitle>
        <CardDescription className="text-sm">
          {certification.issuingOrganization} • {format(new Date(certification.issueDate), 'MMM yyyy')}
          {certification.expiryDate && (
            <span> - {format(new Date(certification.expiryDate), 'MMM yyyy')}</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {certification.skillsGained && certification.skillsGained.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {certification.skillsGained.map((skill: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          {certification.verificationUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={certification.verificationUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Verify
              </a>
            </Button>
          )}
          {certification.certificateImageUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={certification.certificateImageUrl} target="_blank" rel="noopener noreferrer">
                View Certificate
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Portfolio Link Card Component
function PortfolioLinkCard({ portfolioLink, isOwner }: { portfolioLink: any; isOwner: boolean }) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <LinkIcon className="h-5 w-5 text-purple-600 mt-1" />
          {portfolioLink.platformType && (
            <Badge variant="outline" className="text-xs">
              {portfolioLink.platformType}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{portfolioLink.title}</CardTitle>
        {portfolioLink.description && (
          <CardDescription className="text-sm">{portfolioLink.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <Button variant="outline" size="sm" asChild className="w-full">
          <a href={portfolioLink.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3 mr-1" />
            Visit {portfolioLink.platformType || 'Link'}
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

// Add Dialog Components (placeholders for now)
function AddAwardDialog({ professionalId }: { professionalId: number }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Award
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Award or Recognition</DialogTitle>
          <DialogDescription>
            Add a new award, recognition, or achievement to your portfolio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Award Title</Label>
            <Input id="title" placeholder="e.g., Best L&D Professional 2024" />
          </div>
          <div>
            <Label htmlFor="organization">Awarding Organization</Label>
            <Input id="organization" placeholder="e.g., L&D Excellence Awards" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Brief description of the award..." />
          </div>
          <Button className="w-full">Add Award</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddTrainingMaterialDialog({ professionalId }: { professionalId: number }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Material
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Training Material</DialogTitle>
          <DialogDescription>
            Upload or link to your training materials and resources.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Material Title</Label>
            <Input id="title" placeholder="e.g., Leadership Workshop Handbook" />
          </div>
          <div>
            <Label htmlFor="type">Material Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="presentation">Presentation</SelectItem>
                <SelectItem value="workbook">Workbook</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="guide">Guide</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full">Add Material</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddCertificationDialog({ professionalId }: { professionalId: number }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Certification
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Certification</DialogTitle>
          <DialogDescription>
            Add a professional certification to your portfolio.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="certName">Certification Name</Label>
            <Input id="certName" placeholder="e.g., Certified Professional in Learning and Performance" />
          </div>
          <div>
            <Label htmlFor="issuer">Issuing Organization</Label>
            <Input id="issuer" placeholder="e.g., Association for Talent Development" />
          </div>
          <Button className="w-full">Add Certification</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddPortfolioLinkDialog({ professionalId }: { professionalId: number }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Link
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Portfolio Link</DialogTitle>
          <DialogDescription>
            Add a link to your external portfolio, website, or work samples.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="linkTitle">Link Title</Label>
            <Input id="linkTitle" placeholder="e.g., My Professional Website" />
          </div>
          <div>
            <Label htmlFor="url">URL</Label>
            <Input id="url" type="url" placeholder="https://yourwebsite.com" />
          </div>
          <div>
            <Label htmlFor="platform">Platform Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="github">GitHub</SelectItem>
                <SelectItem value="behance">Behance</SelectItem>
                <SelectItem value="dribbble">Dribbble</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full">Add Link</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}