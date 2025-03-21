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
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border border-purple-100">
      <div className="flex items-center p-6 border-b border-purple-100 bg-gradient-to-r from-purple-50 via-fuchsia-50 to-transparent">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 flex items-center justify-center overflow-hidden shadow-lg transform group-hover:scale-105 transition-transform duration-300 border-2 border-white">
          {professional.profileImageUrl ? (
            <img 
              src={professional.profileImageUrl} 
              alt={professional.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-white" />
          )}
        </div>
        <div className="ml-5">
          <h3 className="text-xl font-heading font-bold text-purple-900 group-hover:text-purple-700 transition-colors">{professional.title}</h3>
          <p className="text-purple-600 flex items-center mt-1">📍 {professional.location}</p>
          <div className="flex mt-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`${i < Math.floor((professional.rating || 0) / 20) ? 'text-fuchsia-400' : 'text-gray-200'} h-4 w-4 ${i < ((professional.rating || 0) / 20) && i >= Math.floor((professional.rating || 0) / 20) ? 'fill-[50%]' : ''}`}
                fill={i < Math.floor((professional.rating || 0) / 20) ? 'currentColor' : 'none'}
              />
            ))}
            <span className="ml-1 text-sm text-purple-500 font-medium">
              {((professional.rating || 0) / 20).toFixed(1)} ({professional.reviewCount || 0} reviews)
            </span>
          </div>
        </div>
      </div>
      <div className="p-6 bg-gradient-to-b from-white to-purple-50/30">
        <div className="mb-4">
          <h4 className="text-sm font-bold uppercase mb-2 flex items-center">
            <span className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-3 py-1 rounded-lg shadow-sm">Expertise</span>
          </h4>
          {isLoadingExpertise ? (
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          ) : expertise && expertise.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {expertise.map(area => (
                <Badge key={area.id} variant="secondary" className="bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200 transition-colors font-medium">
                  {area.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No expertise listed</p>
          )}
        </div>
        <div className="mb-5">
          <h4 className="text-sm font-bold uppercase mb-2 flex items-center">
            <span className="bg-gradient-to-r from-cyan-500 to-teal-400 text-white px-3 py-1 rounded-lg shadow-sm">Certifications</span>
          </h4>
          {isLoadingCertifications ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-40" />
            </div>
          ) : certifications && certifications.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {certifications.slice(0, 2).map(cert => (
                <span key={cert.id} className="flex items-center text-sm text-teal-700 bg-teal-50 px-3 py-1.5 rounded-md border border-teal-100">
                  <Verified className="text-teal-500 mr-1.5 h-4 w-4" />
                  {cert.name}
                </span>
              ))}
              {certifications.length > 2 && (
                <span className="text-xs text-fuchsia-600 font-medium ml-1 bg-fuchsia-50 px-2 py-1 rounded-md">+{certifications.length - 2} more</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No certifications listed</p>
          )}
        </div>
        <p className="text-purple-900 mb-6 bg-gradient-to-r from-purple-50 to-fuchsia-50 p-4 rounded-lg italic border-l-4 border-purple-300 shadow-sm">
          "{professional.bio.length > 120 
            ? professional.bio.substring(0, 120) + '...' 
            : professional.bio}"
        </p>
        
        {professional.ratePerHour && (
          <div className="flex items-center mb-5 text-amber-700 font-bold bg-gradient-to-r from-amber-50 to-yellow-100 px-4 py-2.5 rounded-lg shadow-sm border border-amber-200">
            <span className="text-md">Rate: <span className="text-amber-600">${professional.ratePerHour}/hour</span></span>
          </div>
        )}
        
        <div className="flex space-x-3">
          <Button className="flex-grow bg-gradient-to-r from-purple-600 to-fuchsia-500 hover:from-purple-700 hover:to-fuchsia-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md" asChild>
            <Link href={`/professional-profile/${professional.id}`}>
              View Profile
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="hover:bg-purple-50 border-purple-200 hover:border-purple-400 text-purple-700 transition-colors" asChild>
            <Link href={`/messages?professional=${professional.id}`}>
              <Calendar className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
