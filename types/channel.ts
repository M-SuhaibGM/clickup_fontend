export interface Channel {
  id: string;
  name: string;
  projectId: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender?: { id: string; name: string; avatar: string | null };
  reactions?: Reaction[];
}
