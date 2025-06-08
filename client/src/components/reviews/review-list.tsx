import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, Calendar, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

interface Review {
  id: number;
  professionalId: number;
  companyId: number;
  rating: number;
  comment: string | null;
  isPublic: boolean;
  createdAt: string;
}

interface ReviewListProps {
  professionalId: number;
  showPrivateReviews?: boolean;
}

export function ReviewList({ professionalId, showPrivateReviews = false }: ReviewListProps) {
  const { data: reviews = [], isLoading, error } = useQuery<Review[]>({
    queryKey: ["/api/professionals", professionalId, "reviews"],
    queryFn: async () => {
      const response = await fetch(`/api/professionals/${professionalId}/reviews`, {
        credentials: "include"
      });
      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }
      return response.json();
    }
  });

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-2 text-sm font-medium">{rating}/5</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6">
          <p className="text-red-600">Failed to load reviews. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-600">This professional hasn't received any reviews yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate average rating
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Reviews ({reviews.length})</span>
            <div className="flex items-center space-x-2">
              <StarRating rating={Math.round(averageRating)} />
              <span className="text-sm text-muted-foreground">
                ({averageRating.toFixed(1)} average)
              </span>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className={!review.isPublic ? "border-orange-200 bg-orange-50" : ""}>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Review Header */}
                <div className="flex items-center justify-between">
                  <StarRating rating={review.rating} />
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    {!review.isPublic && (
                      <div className="flex items-center space-x-1">
                        <EyeOff className="w-4 h-4" />
                        <span>Private</span>
                      </div>
                    )}
                    {review.isPublic && (
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>Public</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(review.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>

                {/* Review Comment */}
                {review.comment && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                  </div>
                )}

                {/* Review Meta */}
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-sm text-muted-foreground">
                    Review by Company #{review.companyId}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}