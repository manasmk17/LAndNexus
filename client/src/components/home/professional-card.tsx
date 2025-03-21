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
    <div className="bg-black rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group border border-blue-900">
      <div className="flex items-center p-6 border-b border-blue-950 bg-gradient-to-r from-black via-blue-950/30 to-black">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center overflow-hidden shadow-lg transform group-hover:scale-105 transition-transform duration-300 border-2 border-blue-800">
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
          <h3 className="text-xl font-heading font-bold text-blue-200 group-hover:text-blue-100 transition-colors">{professional.title}</h3>
          <p className="text-blue-400 flex items-center mt-1">📍 {professional.location}</p>
          <div className="flex mt-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`${i < Math.floor((professional.rating || 0) / 20) ? 'text-blue-400' : 'text-slate-700'} h-4 w-4 ${i < ((professional.rating || 0) / 20) && i >= Math.floor((professional.rating || 0) / 20) ? 'fill-[50%]' : ''}`}
                fill={i < Math.floor((professional.rating || 0) / 20) ? 'currentColor' : 'none'}
              />
            ))}
            <span className="ml-1 text-sm text-blue-300 font-medium">
              {((professional.rating || 0) / 20).toFixed(1)} ({professional.reviewCount || 0} reviews)
            </span>
          </div>
        </div>
      </div>
      <div className="p-6 bg-gradient-to-b from-black to-slate-950">
        <div className="mb-4">
          <h4 className="text-sm font-bold uppercase mb-2 flex items-center">
            <span className="bg-gradient-to-r from-blue-600 to-teal-500 text-white px-3 py-1 rounded-lg shadow-sm">Expertise</span>
          </h4>
          {isLoadingExpertise ? (
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-24 rounded-full bg-slate-800" />
              <Skeleton className="h-7 w-28 rounded-full bg-slate-800" />
              <Skeleton className="h-7 w-20 rounded-full bg-slate-800" />
            </div>
          ) : expertise && expertise.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {expertise.map(area => (
                <Badge key={area.id} variant="secondary" className="bg-blue-900 text-blue-200 hover:bg-blue-800 transition-colors font-medium">
                  {area.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No expertise listed</p>
          )}
        </div>
        <div className="mb-5">
          <h4 className="text-sm font-bold uppercase mb-2 flex items-center">
            <span className="bg-gradient-to-r from-teal-600 to-emerald-500 text-white px-3 py-1 rounded-lg shadow-sm">Certifications</span>
          </h4>
          {isLoadingCertifications ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-48 bg-slate-800" />
              <Skeleton className="h-5 w-40 bg-slate-800" />
            </div>
          ) : certifications && certifications.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {certifications.slice(0, 2).map(cert => (
                <span key={cert.id} className="flex items-center text-sm text-teal-200 bg-teal-900 px-3 py-1.5 rounded-md border border-teal-800">
                  <Verified className="text-teal-300 mr-1.5 h-4 w-4" />
                  {cert.name}
                </span>
              ))}
              {certifications.length > 2 && (
                <span className="text-xs text-blue-300 font-medium ml-1 bg-blue-900 px-2 py-1 rounded-md">+{certifications.length - 2} more</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No certifications listed</p>
          )}
        </div>
        <p className="text-blue-100 mb-6 bg-blue-950 p-4 rounded-lg italic border-l-4 border-blue-700 shadow-md">
          "{professional.bio.length > 120 
            ? professional.bio.substring(0, 120) + '...' 
            : professional.bio}"
        </p>
        
        {professional.ratePerHour && (
          <div className="flex items-center mb-5 text-blue-300 font-bold bg-slate-900 px-4 py-2.5 rounded-lg shadow-md border border-blue-800">
            <span className="text-md">Rate: <span className="text-blue-200">${professional.ratePerHour}/hour</span></span>
          </div>
        )}
        
        <div className="flex space-x-3">
          <Button className="flex-grow bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 transition-all duration-300 transform hover:-translate-y-1 shadow-md" asChild>
            <Link href={`/professional-profile/${professional.id}`}>
              View Profile
            </Link>
          </Button>
          <Button variant="outline" size="icon" className="bg-slate-900/50 hover:bg-blue-900 border-blue-800 hover:border-blue-700 text-blue-300 transition-colors" asChild>
            <Link href={`/messages?professional=${professional.id}`}>
              <Calendar className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
