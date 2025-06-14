import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";

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
  const [isSending, setIsSending] = useState(false);
  const { isConnected, connectionError } = useWebSocket();

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, receiverId }: { content: string; receiverId: number }) => {
      const response = await apiRequest("POST", "/api/messages", {
        content,
        receiverId
      });
      
      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      return response;
    },
    onSuccess: () => {
      // Clear the input
      setNewMessage("");
      setIsSending(false);
      
      // Invalidate messages to refetch
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${otherUserId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered successfully.",
      });
    },
    onError: (error: any) => {
      setIsSending(false);
      toast({
        title: "Failed to send message",
        description: error.message || "There was an error sending your message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    
    // Show connection warning if applicable
    if (connectionError) {
      toast({
        title: "Connection issue",
        description: "Real-time messaging may be affected. Your message will still be sent.",
        variant: "default",
      });
    }
    
    sendMessageMutation.mutate({
      content: newMessage.trim(),
      receiverId: otherUserId
    });
  };

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

  const displayName = otherUser.userType === "professional" 
    ? professionalProfile?.title || `${otherUser.firstName} ${otherUser.lastName}` || otherUser.username
    : companyProfile?.companyName || `${otherUser.firstName} ${otherUser.lastName}` || otherUser.username;

  const userIcon = otherUser.userType === "professional" ? User : Building;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          {React.createElement(userIcon, { className: "w-5 h-5 text-primary" })}
        </div>
        <div>
          <h3 className="font-semibold">{displayName}</h3>
          <p className="text-sm text-muted-foreground capitalize">{otherUser.userType}</p>
        </div>
        {!isConnected && (
          <div className="ml-auto">
            <span className="text-xs text-amber-600">Offline</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages && messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderId === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div className={`flex items-start max-w-[75%] ${
                message.senderId === user?.id ? "flex-row-reverse" : "flex-row"
              }`}>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-2">
                  {message.senderId === user?.id ? (
                    <User className="w-4 h-4 text-primary" />
                  ) : otherUser.userType === "company" ? (
                    companyProfile?.logoUrl ? (
                      <img 
                        src={companyProfile.logoUrl} 
                        alt={companyProfile.companyName || 'Company logo'} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <Building className="w-4 h-4 text-primary" />
                    )
                  ) : (
                    professionalProfile?.profilePicture ? (
                      <img 
                        src={professionalProfile.profilePicture} 
                        alt={professionalProfile.title || 'Profile picture'} 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )
                  )}
                </div>
                <div className={`rounded-lg p-3 ${
                  message.senderId === user?.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderId === user?.id 
                      ? "text-primary-foreground/70" 
                      : "text-muted-foreground"
                  }`}>
                    {format(new Date(message.createdAt), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending || sendMessageMutation.isPending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!newMessage.trim() || isSending || sendMessageMutation.isPending}
            size="icon"
          >
            {isSending || sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}