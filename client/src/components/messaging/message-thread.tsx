
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";


import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Send, User, Building } from "lucide-react";
import type { Message, User as UserType, ProfessionalProfile, CompanyProfile } from "@shared/schema";

interface MessageThreadProps {
  otherUserId: number;
}

export default function MessageThread({ otherUserId }: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");


  // Fetch messages between current user and the selected user
  const { 
    data: messages, 
    isLoading: isLoadingMessages 
  } = useQuery<Message[]>({
    queryKey: [`/api/messages/${otherUserId}`],
    enabled: !!user && !!otherUserId,
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Fetch other user's details
  const { 
    data: otherUser, 
    isLoading: isLoadingUser 
  } = useQuery<UserType>({
    queryKey: [`/api/users/${otherUserId}`],
    enabled: !!otherUserId,
  });

  // Fetch professional profile if other user is a professional
  const { 
    data: professionalProfile 
  } = useQuery<ProfessionalProfile>({
    queryKey: [`/api/professional-profiles/by-user/${otherUserId}`],
    enabled: !!otherUser && otherUser.userType === "professional",
  });

  // Fetch company profile if other user is a company
  const { 
    data: companyProfile 
  } = useQuery<CompanyProfile>({
    queryKey: [`/api/company-profiles/by-user/${otherUserId}`],
    enabled: !!otherUser && otherUser.userType === "company",
  });

  // Message sending mutation with enhanced error handling
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; receiverId: number }) => {
      const response = await apiRequest("POST", "/api/messages", messageData);
      return response;
    },
    onSuccess: () => {
      setNewMessage("");
      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${otherUserId}`] });
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered",
      });
    },
    onError: (error: any) => {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to send message",
        description: error.message || "Please check your connection and try again",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be signed in to send messages",
        variant: "destructive",
      });
      return;
    }


    
    sendMessageMutation.mutate({
      content: newMessage.trim(),
      receiverId: otherUserId
    });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when opened
  useEffect(() => {
    if (messages && user) {
      const unreadMessages = messages.filter(
        msg => !msg.read && msg.receiverId === user.id
      );

      if (unreadMessages.length > 0) {
        // Mark each unread message as read
        unreadMessages.forEach(async (message) => {
          try {
            await apiRequest("PUT", `/api/messages/${message.id}/read`, {});
          } catch (error) {
            console.error("Failed to mark message as read:", error);
          }
        });

        // Invalidate queries to update UI
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
        queryClient.invalidateQueries({ queryKey: [`/api/messages/${otherUserId}`] });
      }
    }
  }, [messages, user, otherUserId, queryClient]);

  if (isLoadingUser || isLoadingMessages) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b p-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const getDisplayName = () => {
    return otherUser.userType === "professional" 
      ? professionalProfile?.title || `${otherUser.firstName} ${otherUser.lastName}` || otherUser.username
      : companyProfile?.companyName || `${otherUser.firstName} ${otherUser.lastName}` || otherUser.username;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          {otherUser.userType === "company" ? (
            companyProfile?.logoUrl ? (
              <img 
                src={companyProfile.logoUrl} 
                alt={companyProfile.companyName || 'Company logo'} 
                className="w-full h-full object-cover rounded-full" 
              />
            ) : (
              <Building className="w-5 h-5 text-primary" />
            )
          ) : (
            professionalProfile?.profileImageUrl ? (
              <img 
                src={professionalProfile.profileImageUrl} 
                alt={professionalProfile.title || 'Professional profile'} 
                className="w-full h-full object-cover rounded-full" 
              />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )
          )}
        </div>
        <div>
          <h3 className="font-semibold">{getDisplayName()}</h3>
          <p className="text-sm text-muted-foreground capitalize">{otherUser.userType}</p>
        </div>

      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages && messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.id ? "justify-end" : "justify-start"}`}
            >
              {message.senderId !== user?.id && (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-2 mt-1">
                  {otherUser.userType === "company" ? (
                    companyProfile?.logoUrl ? (
                      <img 
                        src={companyProfile.logoUrl} 
                        alt={companyProfile.companyName || 'Company logo'} 
                        className="w-full h-full object-cover rounded-full" 
                      />
                    ) : (
                      <Building className="h-4 w-4 text-gray-500" />
                    )
                  ) : (
                    professionalProfile?.profileImageUrl ? (
                      <img 
                        src={professionalProfile.profileImageUrl} 
                        alt={professionalProfile.title || 'Professional profile'} 
                        className="w-full h-full object-cover rounded-full" 
                      />
                    ) : (
                      <User className="h-4 w-4 text-gray-500" />
                    )
                  )}
                </div>
              )}
              <div 
                className={`max-w-[75%] px-4 py-2 rounded-lg ${
                  message.senderId === user?.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                <p 
                  className={`text-xs mt-1 ${
                    message.senderId === user?.id 
                      ? "text-primary-foreground text-opacity-80" 
                      : "text-gray-500"
                  }`}
                >
                  {format(new Date(message.createdAt), "h:mm a")}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={sendMessageMutation.isPending || !newMessage.trim()}
            className="min-w-[44px]"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
