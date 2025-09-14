// MongoDB collection schemas (for reference/documentation)
import { ObjectId } from "mongodb";
import { UserPreferences } from "app-types/user";
import { ChatMetadata } from "app-types/chat";
import { UIMessage } from "ai";

export interface UserDocument {
  _id: ObjectId; // MongoDB's internal ID
  id: string; // UUID string (same as PostgreSQL)
  name: string;
  email: string;
  emailVerified: boolean;
  password?: string;
  image?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatThreadDocument {
  _id: ObjectId;
  id: string; // UUID string
  title: string;
  userId: string; // UUID string
  createdAt: Date;
}

export interface ChatMessageDocument {
  _id: ObjectId;
  id: string; // Text ID (same as PostgreSQL)
  threadId: string; // UUID string
  role: string;
  parts: UIMessage["parts"];
  metadata?: ChatMetadata;
  createdAt: Date;
}
