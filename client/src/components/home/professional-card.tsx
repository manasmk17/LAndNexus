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
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border border-gray-200 h-full flex flex-col">
      <div className="flex items-center p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-white via-slate-50 to-white">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-slate-800 via-slate-700 to-blue-700 flex items-center justify-center overflow-hidden shadow-lg transform group-hover:scale-105 transition-transform duration-300 border-2 border-slate-300 flex-shrink-0">
          {professional.profileImagePath ? (
            <img 
              src={professional.profileImagePath.startsWith('uploads/') ? `/${professional.profileImagePath}` : professional.profileImagePath}
              alt={professional.title || 'Professional'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Set default avatar on error using UI Avatars service with the user's name
                const target = e.target as HTMLImageElement;
                target.onerror = null; // Prevent infinite error loops
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  (professional.firstName || '') + ' ' + (professional.lastName || '')
                )}&size=150&background=6366f1&color=ffffff`;
              }}
            />
          ) : (
            <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          )}
        </div>
        <div className="ml-3 sm:ml-5 flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-heading font-bold text-slate-800 group-hover:text-slate-700 transition-colors truncate">{professional.title}</h3>
          <p className="text-sm sm:text-base text-slate-700/90 flex items-center mt-1 truncate">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            {professional.location}
          </p>
          <div className="flex items-center mt-1 flex-wrap">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`${i < Math.floor((professional.rating || 0) / 20) ? 'text-amber-400' : 'text-gray-300'} h-3 w-3 sm:h-4 sm:w-4`}
                  fill={i < Math.floor((professional.rating || 0) / 20) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span className="ml-1 text-xs sm:text-sm text-slate-700 font-medium">
              {((professional.rating || 0) / 20).toFixed(1)} ({professional.reviewCount || 0})
            </span>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-50 to-slate-100 flex-1 flex flex-col">
        <div className="mb-3 sm:mb-4">
          <h4 className="text-xs sm:text-sm font-bold uppercase mb-2 flex items-center">
            <span className="bg-gradient-to-r from-slate-800 to-blue-700 text-white px-2 sm:px-3 py-1 rounded-lg shadow-sm text-xs">Expertise</span>
          </h4>
          {isLoadingExpertise ? (
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Skeleton className="h-6 sm:h-7 w-20 sm:w-24 rounded-full bg-slate-200" />
              <Skeleton className="h-6 sm:h-7 w-24 sm:w-28 rounded-full bg-slate-200" />
              <Skeleton className="h-6 sm:h-7 w-16 sm:w-20 rounded-full bg-slate-200" />
            </div>
          ) : expertise && expertise.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
              {expertise.slice(0, 3).map(area => (
                <Badge key={area.id} variant="secondary" className="bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors font-medium border border-slate-200 text-xs sm:text-sm">
                  {area.name}
                </Badge>
              ))}
              {expertise.length > 3 && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-xs">
                  +{expertise.length - 3}
                </Badge>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500">No expertise listed</p>
          )}
        </div>
        <div className="mb-4 sm:mb-5">
          <h4 className="text-xs sm:text-sm font-bold uppercase mb-2 flex items-center">
            <span className="bg-gradient-to-r from-blue-700 to-slate-800 text-white px-2 sm:px-3 py-1 rounded-lg shadow-sm text-xs">Certifications</span>
          </h4>
          {isLoadingCertifications ? (
            <div className="space-y-1.5 sm:space-y-2">
              <Skeleton className="h-4 sm:h-5 w-40 sm:w-48 bg-slate-200" />
              <Skeleton className="h-4 sm:h-5 w-32 sm:w-40 bg-slate-200" />
            </div>
          ) : certifications && certifications.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2 sm:mt-3">
              {certifications.slice(0, 2).map(cert => (
                <span key={cert.id} className="flex items-center text-xs sm:text-sm text-slate-800 bg-slate-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-slate-200">
                  <Verified className="text-blue-700 mr-1 sm:mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="truncate">{cert.name}</span>
                </span>
              ))}
              {certifications.length > 2 && (
                <span className="text-xs text-slate-800 font-medium bg-slate-100 px-2 py-1 rounded-md border border-slate-200">+{certifications.length - 2}</span>
              )}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500">No certifications listed</p>
          )}
        </div>
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-slate-900 mb-4 sm:mb-6 bg-slate-50 p-3 sm:p-4 rounded-lg italic border-l-4 border-slate-400 shadow-md">
            "{professional?.bio && professional.bio.length > 100 
              ? professional.bio.substring(0, 100) + '...' 
              : professional?.bio || 'No bio available'}"
          </p>
        </div>
        
        {professional.ratePerHour && (
          <div className="flex items-center mb-4 sm:mb-5 text-slate-800 font-bold bg-slate-50 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg shadow-md border border-slate-200">
            <span className="text-sm sm:text-md">Rate: <span className="text-blue-700">${professional.ratePerHour}/hour</span></span>
          </div>
        )}
        
        <div className="flex gap-2 sm:gap-3 mt-auto">
          <Button 
            className="flex-grow bg-gradient-to-r from-slate-800 to-blue-700 hover:from-slate-900 hover:to-blue-800 transition-all duration-300 transform hover:-translate-y-1 shadow-md text-xs sm:text-sm" 
            size="sm"
            asChild
          >
            <Link href={`/professional-profile/${professional.id}`}>
              View Profile
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white hover:bg-slate-100 border-slate-300 hover:border-slate-400 text-slate-700 transition-colors px-2 sm:px-3" 
            asChild
          >
            <Link href={`/messages?professional=${professional.id}`}>
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
