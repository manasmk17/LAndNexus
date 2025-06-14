import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Search, User, Building } from "lucide-react";
import MessageThread from "@/components/messaging/message-thread";
import type { Message, User as UserType } from "@shared/schema";

export default function Messages() {
  const [, setLocation] = useLocation();
  const { user, isLoading: isLoadingAuth } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Get user from query parameters
  const params = new URLSearchParams(window.location.search);
  const userIdParam = params.get("user");
  const professionalIdParam = params.get("professional");
  const companyIdParam = params.get("company");
  
  // Set selected user from URL params if provided
  useEffect(() => {
    if (userIdParam) {
      setSelectedUserId(parseInt(userIdParam));
    } else if (professionalIdParam || companyIdParam) {
      setLocation("/messages");
    }
  }, [userIdParam, professionalIdParam, companyIdParam, setLocation]);
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isLoadingAuth && !user) {
      setLocation("/login?redirect=/messages");
    }
  }, [user, isLoadingAuth, setLocation]);
  
  // Fetch all messages for current user
  const { 
    data: messages, 
    isLoading: isLoadingMessages 
  } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
    enabled: !!user,
  });
  
  // Fetch user details for all message contacts
  const { 
    data: users 
  } = useQuery<UserType[]>({
    queryKey: ["/api/users/batch"],
    enabled: !!messages && messages.length > 0,
    queryFn: async () => {
      // Extract unique user IDs from messages
      const userIds = messages ? 
        Array.from(new Set([
          ...messages.map(msg => msg.senderId),
          ...messages.map(msg => msg.receiverId)
        ])).filter(id => id !== user?.id) : [];
        
      if (userIds.length === 0) return [];
      
      const response = await fetch(`/api/users/batch?ids=${userIds.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return await response.json();
    }
  });
  
  // Get unique contacts from messages
  const contacts = messages ? 
    Array.from(new Set(
      messages.map(msg => 
        msg.senderId === user?.id ? msg.receiverId : msg.senderId
      )
    )).map(contactId => {
      // Get the latest message with this contact
      const latestMessage = [...messages]
        .filter(msg => 
          (msg.senderId === contactId && msg.receiverId === user?.id) ||
          (msg.receiverId === contactId && msg.senderId === user?.id)
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      // Find user details
      const contactUser = users?.find(u => u.id === contactId);
      
      return {
        userId: contactId,
        user: contactUser,
        latestMessage,
        unreadCount: messages.filter(msg => 
          msg.senderId === contactId && 
          msg.receiverId === user?.id && 
          !msg.read
        ).length
      };
    }).filter(contact => contact.user) : [];
  
  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    !searchTerm || 
    contact.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.user?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Messages</h1>
        <p className="text-muted-foreground">
          Stay connected with your professional network
        </p>
        

      </div>

      <div className="grid lg:grid-cols-3 gap-6 h-[600px]">
        {/* Contacts List */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Conversations
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingMessages ? (
                <div className="space-y-4 p-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">
                    Start a conversation by visiting a professional's profile
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredContacts.map((contact) => (
                    <button
                      key={contact.userId}
                      onClick={() => setSelectedUserId(contact.userId)}
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                        selectedUserId === contact.userId ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {contact.user?.userType === 'company' ? (
                            <Building className="h-5 w-5 text-primary" />
                          ) : (
                            <User className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">
                              {contact.user?.firstName} {contact.user?.lastName}
                            </p>
                            {contact.unreadCount > 0 && (
                              <Badge variant="default" className="ml-2">
                                {contact.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {contact.latestMessage?.content || 'No messages yet'}
                          </p>
                          {contact.latestMessage && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(contact.latestMessage.createdAt), { addSuffix: true })}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            {selectedUserId ? (
              <MessageThread otherUserId={selectedUserId} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a contact from the left to start messaging
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}