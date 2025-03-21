import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Verified, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProfessionalProfile, Expertise, Certification } from "@shared/schema";

interface ProfessionalCardProps {
  professional: ProfessionalProfile;
}

export default function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const { data: expertise, isLoading: isLoadingExpertise } = useQuery<Expertise[]>({
    queryKey: [`/api/professional-profiles/${professional.id}/expertise`],
  });

  const { data: certifications, isLoading: isLoadingCertifications } = useQuery<Certification[]>({
    queryKey: [`/api/professional-profiles/${professional.id}/certifications`],
  });

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex items-center p-6 border-b border-gray-200">
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {professional.profileImageUrl ? (
            <img 
              src={professional.profileImageUrl} 
              alt={professional.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-heading font-medium">{professional.title}</h3>
          <p className="text-gray-500">{professional.location}</p>
          <div className="flex mt-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`${i < Math.floor(professional.rating / 20) ? 'text-yellow-400' : 'text-gray-200'} h-4 w-4 ${i < (professional.rating / 20) && i >= Math.floor(professional.rating / 20) ? 'fill-[50%]' : ''}`}
                fill={i < Math.floor(professional.rating / 20) ? 'currentColor' : 'none'}
              />
            ))}
            <span className="ml-1 text-sm text-gray-500">
              {(professional.rating / 20).toFixed(1)} ({professional.reviewCount} reviews)
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Expertise</h4>
          {isLoadingExpertise ? (
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          ) : expertise && expertise.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {expertise.map(area => (
                <Badge key={area.id} variant="secondary" className="bg-blue-100 text-primary">
                  {area.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No expertise listed</p>
          )}
        </div>
        <div className="mb-4">
          <h4 className="text-sm font-bold text-gray-500 uppercase mb-2">Certifications</h4>
          {isLoadingCertifications ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-40" />
            </div>
          ) : certifications && certifications.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {certifications.slice(0, 2).map(cert => (
                <span key={cert.id} className="flex items-center text-sm text-gray-700">
                  <Verified className="text-green-500 mr-1 text-sm h-4 w-4" />
                  {cert.name}
                </span>
              ))}
              {certifications.length > 2 && (
                <span className="text-xs text-gray-500 ml-1">+{certifications.length - 2} more</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No certifications listed</p>
          )}
        </div>
        <p className="text-gray-700 mb-4">
          {professional.bio.length > 120 
            ? professional.bio.substring(0, 120) + '...' 
            : professional.bio}
        </p>
        <div className="flex space-x-2">
          <Link href={`/professional-profile/${professional.id}`}>
            <Button className="flex-grow">View Profile</Button>
          </Link>
          <Link href={`/messages?professional=${professional.id}`}>
            <Button variant="outline" size="icon">
              <Calendar className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
