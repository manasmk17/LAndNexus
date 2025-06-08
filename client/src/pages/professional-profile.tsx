import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, DollarSign, Star, Mail, Phone, Award, BookOpen } from "lucide-react";
import { ReviewList } from "@/components/reviews/review-list";
import { ReviewForm } from "@/components/reviews/review-form";
import { useState } from "react";

interface ProfessionalProfile {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  title: string;
  bio: string;
  location: string;
  ratePerHour: number;
  profileImageUrl: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  services: string;
  availability: string;
  email: string;
  phone: string;
}

interface Expertise {
  id: number;
  name: string;
}

interface Certification {
  id: number;
  name: string;
  issuer: string;
  dateEarned: string;
}

export default function ProfessionalProfile() {
  const { id } = useParams<{ id: string }>();
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const professionalId = parseInt(id || "0");

  const { data: profile, isLoading: profileLoading } = useQuery<ProfessionalProfile>({
    queryKey: ["/api/professional-profiles", professionalId],
    queryFn: async () => {
      const response = await fetch(`/api/professional-profiles/${professionalId}`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch professional profile");
      }
      return response.json();
    }
  });

  const { data: expertise = [] } = useQuery<Expertise[]>({
    queryKey: ["/api/professional-profiles", professionalId, "expertise"],
    queryFn: async () => {
      const response = await fetch(`/api/professional-profiles/${professionalId}/expertise`, {
        credentials: "include"
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  const { data: certifications = [] } = useQuery<Certification[]>({
    queryKey: ["/api/professional-profiles", professionalId, "certifications"],
    queryFn: async () => {
      const response = await fetch(`/api/professional-profiles/${professionalId}/certifications`, {
        credentials: "include"
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-200 rounded-lg"></div>
                <div className="h-24 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Professional Not Found</h2>
              <p className="text-gray-600">The requested professional profile could not be found.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const StarRating = ({ rating, reviewCount }: { rating: number; reviewCount: number }) => (
    <div className="flex items-center space-x-2">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="text-lg font-semibold">{rating}/5</span>
      <span className="text-gray-600">({reviewCount} reviews)</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        {/* Header Section */}
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-shrink-0">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <p className="text-xl text-gray-600 mt-1">{profile.title}</p>
                </div>

                <StarRating rating={profile.rating} reviewCount={profile.reviewCount} />

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{profile.yearsExperience} years experience</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${profile.ratePerHour}/hour</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button size="lg">Book Consultation</Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                  >
                    Write Review
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </CardContent>
            </Card>

            {/* Services */}
            {profile.services && (
              <Card>
                <CardHeader>
                  <CardTitle>Services Offered</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.services.split(',').map((service, index) => (
                      <Badge key={index} variant="secondary">
                        {service.trim()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Expertise */}
            {expertise.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5" />
                    <span>Areas of Expertise</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {expertise.map((exp) => (
                      <Badge key={exp.id} variant="outline">
                        {exp.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5" />
                    <span>Certifications</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {certifications.map((cert) => (
                      <div key={cert.id} className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-semibold">{cert.name}</h4>
                        <p className="text-gray-600">{cert.issuer}</p>
                        <p className="text-sm text-gray-500">
                          Earned: {new Date(cert.dateEarned).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Review Form */}
            {showReviewForm && (
              <ReviewForm
                professionalId={professionalId}
                onSubmitSuccess={() => setShowReviewForm(false)}
              />
            )}

            {/* Reviews Section */}
            <ReviewList professionalId={professionalId} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{profile.email}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability */}
            {profile.availability && (
              <Card>
                <CardHeader>
                  <CardTitle>Availability</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{profile.availability}</p>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-semibold">{profile.yearsExperience} years</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Hourly Rate</span>
                  <span className="font-semibold">${profile.ratePerHour}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating</span>
                  <span className="font-semibold">{profile.rating}/5</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Reviews</span>
                  <span className="font-semibold">{profile.reviewCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}