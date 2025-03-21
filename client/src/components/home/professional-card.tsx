import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Calendar, Verified, User, MapPin } from "lucide-react";
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] group border border-gray-100">
      <div className="flex items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-transparent">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center overflow-hidden shadow-md transform group-hover:scale-105 transition-transform duration-300">
          {professional.profileImageUrl ? (
            <img 
              src={professional.profileImageUrl} 
              alt={professional.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-8 h-8 text-white" />
          )}
        </div>
        <div className="ml-4">
          <h3 className="text-xl font-heading font-medium text-gray-800 group-hover:text-primary transition-colors">{professional.title}</h3>
          <p className="text-gray-500 flex items-center mt-1">📍 {professional.location}</p>
          <div className="flex mt-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`${i < Math.floor((professional.rating || 0) / 20) ? 'text-yellow-400' : 'text-gray-200'} h-4 w-4 ${i < ((professional.rating || 0) / 20) && i >= Math.floor((professional.rating || 0) / 20) ? 'fill-[50%]' : ''}`}
                fill={i < Math.floor((professional.rating || 0) / 20) ? 'currentColor' : 'none'}
              />
            ))}
            <span className="ml-1 text-sm text-gray-500">
              {((professional.rating || 0) / 20).toFixed(1)} ({professional.reviewCount || 0} reviews)
            </span>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="mb-4">
          <h4 className="text-sm font-bold text-primary/80 uppercase mb-2 flex items-center">
            <span className="bg-primary/10 px-2 py-1 rounded">Expertise</span>
          </h4>
          {isLoadingExpertise ? (
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          ) : expertise && expertise.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {expertise.map(area => (
                <Badge key={area.id} variant="secondary" className="bg-blue-100 text-primary hover:bg-blue-200 transition-colors">
                  {area.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No expertise listed</p>
          )}
        </div>
        <div className="mb-4">
          <h4 className="text-sm font-bold text-primary/80 uppercase mb-2 flex items-center">
            <span className="bg-primary/10 px-2 py-1 rounded">Certifications</span>
          </h4>
          {isLoadingCertifications ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-40" />
            </div>
          ) : certifications && certifications.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {certifications.slice(0, 2).map(cert => (
                <span key={cert.id} className="flex items-center text-sm text-gray-700 bg-green-50 px-2 py-1 rounded-md">
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
        <p className="text-gray-700 mb-6 bg-gray-50 p-3 rounded-md italic">
          "{professional.bio.length > 120 
            ? professional.bio.substring(0, 120) + '...' 
            : professional.bio}"
        </p>
        
        {professional.ratePerHour && (
          <div className="flex items-center mb-4 text-green-600 font-medium bg-green-50 px-3 py-2 rounded-md">
            <span className="text-sm">Rate: ${professional.ratePerHour}/hour</span>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button className="flex-grow bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 transition-all duration-300 transform hover:-translate-y-1" asChild>
            <Link href={`/professional-profile/${professional.id}`}>
              View Profile
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="hover:bg-blue-50 hover:border-primary/50 transition-colors" asChild>
            <Link href={`/messages?professional=${professional.id}`}>
              <Calendar className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
