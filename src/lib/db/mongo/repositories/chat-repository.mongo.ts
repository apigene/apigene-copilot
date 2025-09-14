import { getCollection, COLLECTIONS } from "../mongodb";
import { ObjectId } from "mongodb";
import { getCurrentUserEmail } from "../auth-utils";
import type { ChatRepository, ChatMessage, ChatThread } from "app-types/chat";

// Helper function to check if a string is a valid ObjectId
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

// MongoDB Chat Repository Implementation
export const mongoChatRepository: ChatRepository = {
  async insertThread(
    thread: Omit<ChatThread, "createdAt">,
  ): Promise<ChatThread> {
    console.log(
      "➕ [MongoDB Chat Repository] insertThread called with thread:",
      thread.title,
      "userId:",
      thread.userId,
      "id:",
      thread.id,
    );

    // Get current user email for consistency with agent repository
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.CHAT_THREADS);
    const now = new Date();

    const threadDoc = {
      threadId: thread.id || new ObjectId().toString(),
      title: thread.title,
      userId: userEmail, // Ignore passed userId, use current user email
      created_at: now,
      updated_at: now,
    };

    await collection.insertOne(threadDoc);

    const result: ChatThread = {
      id: threadDoc.threadId,
      title: thread.title,
      userId: userEmail, // Use user email instead of internal UUID
      createdAt: now,
    };

    console.log("✅ [MongoDB Chat Repository] insertThread result:", result);
    return result;
  },

  async selectThread(id: string): Promise<ChatThread | null> {
    console.log(
      "🔍 [MongoDB Chat Repository] selectThread called with id:",
      id,
    );

    const collection = await getCollection(COLLECTIONS.CHAT_THREADS);

    const doc = await collection.findOne({ threadId: id });

    if (!doc) {
      console.log(
        "✅ [MongoDB Chat Repository] selectThread result: Thread not found",
      );
      return null;
    }

    const result: ChatThread = {
      id: doc.threadId,
      title: doc.title,
      userId: doc.userId,
      createdAt: doc.created_at,
    };

    console.log(
      "✅ [MongoDB Chat Repository] selectThread result: Thread found",
    );
    return result;
  },

  async deleteChatMessage(id: string): Promise<void> {
    console.log(
      "🗑️ [MongoDB Chat Repository] deleteChatMessage called with id:",
      id,
    );

    const collection = await getCollection(COLLECTIONS.CHAT_MESSAGES);

    if (!isValidObjectId(id)) {
      console.log(
        "✅ [MongoDB Chat Repository] deleteChatMessage: Invalid ObjectId",
      );
      return;
    }

    await collection.deleteOne({ _id: new ObjectId(id) });

    console.log("✅ [MongoDB Chat Repository] deleteChatMessage completed");
  },

  async selectThreadDetails(id: string) {
    console.log(
      "🔍 [MongoDB Chat Repository] selectThreadDetails called with id:",
      id,
    );

    const threadCollection = await getCollection(COLLECTIONS.CHAT_THREADS);
    const messageCollection = await getCollection(COLLECTIONS.CHAT_MESSAGES);
    const userCollection = await getCollection(COLLECTIONS.USERS);

    // Get thread
    const threadDoc = await threadCollection.findOne({ threadId: id });

    if (!threadDoc) {
      console.log(
        "✅ [MongoDB Chat Repository] selectThreadDetails result: Thread not found",
      );
      return null;
    }

    // Get messages for this thread
    const messageDocs = await messageCollection
      .find({ threadId: id })
      .sort({ created_at: 1 })
      .toArray();

    // Get user preferences
    const userDoc = await userCollection.findOne(
      { email: threadDoc.userId }, // Query by email instead of ObjectId
      { projection: { preferences: 1 } },
    );

    const thread: ChatThread = {
      id: threadDoc.threadId,
      title: threadDoc.title,
      userId: threadDoc.userId,
      createdAt: threadDoc.created_at,
    };

    const messages: ChatMessage[] = messageDocs.map((doc) => ({
      id: doc._id.toString(),
      threadId: doc.threadId,
      role: doc.role,
      parts: doc.parts,
      metadata: doc.metadata,
      createdAt: doc.created_at,
    }));

    const result = {
      ...thread,
      messages,
      userPreferences: userDoc?.preferences,
    };

    console.log(
      "✅ [MongoDB Chat Repository] selectThreadDetails result: Thread details found",
    );
    return result;
  },

  async selectMessagesByThreadId(threadId: string): Promise<ChatMessage[]> {
    console.log(
      "🔍 [MongoDB Chat Repository] selectMessagesByThreadId called with threadId:",
      threadId,
    );

    const collection = await getCollection(COLLECTIONS.CHAT_MESSAGES);

    const docs = await collection
      .find({ threadId: threadId })
      .sort({ created_at: 1 })
      .toArray();

    const results: ChatMessage[] = docs.map((doc) => ({
      id: doc._id.toString(),
      threadId: doc.threadId,
      role: doc.role,
      parts: doc.parts,
      metadata: doc.metadata,
      createdAt: doc.created_at,
    }));

    console.log(
      "✅ [MongoDB Chat Repository] selectMessagesByThreadId result:",
      results.length,
      "messages found",
    );
    return results;
  },

  async selectThreadsByUserId(userId: string) {
    console.log(
      "🔍 [MongoDB Chat Repository] selectThreadsByUserId called with userId:",
      userId,
    );

    // Get current user email for consistency with agent repository
    const userEmail = await getCurrentUserEmail();

    const threadCollection = await getCollection(COLLECTIONS.CHAT_THREADS);
    const messageCollection = await getCollection(COLLECTIONS.CHAT_MESSAGES);

    // Get threads - query by user email instead of passed userId
    const threadDocs = await threadCollection
      .find({ userId: userEmail })
      .sort({ updated_at: -1 })
      .toArray();

    // Get last message for each thread
    const results = await Promise.all(
      threadDocs.map(async (threadDoc) => {
        const lastMessage = await messageCollection.findOne(
          { threadId: threadDoc._id.toString() },
          { sort: { created_at: -1 } },
        );

        return {
          id: threadDoc._id.toString(),
          title: threadDoc.title,
          userId: threadDoc.userId,
          createdAt: threadDoc.created_at,
          lastMessageAt:
            lastMessage?.created_at?.getTime() ||
            threadDoc.created_at.getTime(),
        };
      }),
    );

    console.log(
      "✅ [MongoDB Chat Repository] selectThreadsByUserId result:",
      results.length,
      "threads found",
    );
    return results;
  },

  async updateThread(id: string, thread) {
    console.log(
      "✏️ [MongoDB Chat Repository] updateThread called with id:",
      id,
      "thread:",
      thread,
    );

    const collection = await getCollection(COLLECTIONS.CHAT_THREADS);
    const now = new Date();

    const updateDoc: any = {
      updated_at: now,
    };

    if (thread.title !== undefined) updateDoc.title = thread.title;
    if (thread.userId !== undefined) {
      // Get current user email for consistency
      const userEmail = await getCurrentUserEmail();
      updateDoc.userId = userEmail;
    }

    const result = await collection.findOneAndUpdate(
      { threadId: id },
      { $set: updateDoc },
      { returnDocument: "after" },
    );

    if (!result) {
      throw new Error(`Thread with id ${id} not found`);
    }

    const threadResult: ChatThread = {
      id: result.threadId,
      title: result.title,
      userId: result.userId,
      createdAt: result.created_at,
    };

    console.log(
      "✅ [MongoDB Chat Repository] updateThread result:",
      threadResult,
    );
    return threadResult;
  },

  async deleteThread(id: string): Promise<void> {
    console.log("🗑️ [MongoDB Chat Repository] deleteThread called with id:", id);

    const threadCollection = await getCollection(COLLECTIONS.CHAT_THREADS);
    const messageCollection = await getCollection(COLLECTIONS.CHAT_MESSAGES);

    // Delete thread
    await threadCollection.deleteOne({ threadId: id });

    // Delete all messages in this thread
    await messageCollection.deleteMany({ threadId: id });

    console.log("✅ [MongoDB Chat Repository] deleteThread completed");
  },

  async upsertThread(thread) {
    console.log(
      "💾 [MongoDB Chat Repository] upsertThread called with thread:",
      thread,
    );

    // Get current user email for consistency with agent repository
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.CHAT_THREADS);
    const now = new Date();

    const threadDoc = {
      title: thread.title,
      userId: userEmail, // Use user email instead of internal UUID
      created_at: now,
      updated_at: now,
    };

    let result;
    if (thread.id) {
      // Update existing thread
      result = await collection.findOneAndUpdate(
        { threadId: thread.id },
        { $set: threadDoc },
        { returnDocument: "after" },
      );
    } else {
      // Create new thread
      const insertResult = await collection.insertOne(threadDoc);
      result = await collection.findOne({ _id: insertResult.insertedId });
    }

    const threadResult: ChatThread = {
      id: result.threadId,
      title: result.title,
      userId: userEmail, // Use user email instead of internal UUID
      createdAt: result.created_at,
    };

    console.log(
      "✅ [MongoDB Chat Repository] upsertThread result:",
      threadResult,
    );
    return threadResult;
  },

  async insertMessage(
    message: Omit<ChatMessage, "createdAt">,
  ): Promise<ChatMessage> {
    console.log(
      "➕ [MongoDB Chat Repository] insertMessage called with message:",
      message.role,
      "threadId:",
      message.threadId,
    );

    const collection = await getCollection(COLLECTIONS.CHAT_MESSAGES);
    const now = new Date();

    const messageDoc = {
      threadId: message.threadId,
      role: message.role,
      parts: message.parts,
      metadata: message.metadata,
      created_at: now,
    };

    const insertResult = await collection.insertOne(messageDoc);

    const result: ChatMessage = {
      id: insertResult.insertedId.toString(),
      threadId: message.threadId,
      role: message.role,
      parts: message.parts,
      metadata: message.metadata,
      createdAt: now,
    };

    console.log("✅ [MongoDB Chat Repository] insertMessage result:", result);
    return result;
  },

  async upsertMessage(
    message: Omit<ChatMessage, "createdAt">,
  ): Promise<ChatMessage> {
    console.log(
      "💾 [MongoDB Chat Repository] upsertMessage called with message:",
      message.role,
      "threadId:",
      message.threadId,
    );

    const collection = await getCollection(COLLECTIONS.CHAT_MESSAGES);
    const now = new Date();

    const messageDoc = {
      threadId: message.threadId,
      role: message.role,
      parts: message.parts,
      metadata: message.metadata,
      created_at: now,
    };

    let result;
    if (message.id && isValidObjectId(message.id)) {
      // Update existing message
      result = await collection.findOneAndUpdate(
        { _id: new ObjectId(message.id) },
        { $set: messageDoc },
        { returnDocument: "after" },
      );
    } else {
      // Create new message
      const insertResult = await collection.insertOne(messageDoc);
      result = await collection.findOne({ _id: insertResult.insertedId });
    }

    const messageResult: ChatMessage = {
      id: result._id.toString(),
      threadId: result.threadId,
      role: result.role,
      parts: result.parts,
      metadata: result.metadata,
      createdAt: result.created_at,
    };

    console.log(
      "✅ [MongoDB Chat Repository] upsertMessage result:",
      messageResult,
    );
    return messageResult;
  },

  async deleteMessagesByChatIdAfterTimestamp(messageId: string): Promise<void> {
    console.log(
      "🗑️ [MongoDB Chat Repository] deleteMessagesByChatIdAfterTimestamp called with messageId:",
      messageId,
    );

    const collection = await getCollection(COLLECTIONS.CHAT_MESSAGES);

    if (!isValidObjectId(messageId)) {
      console.log(
        "✅ [MongoDB Chat Repository] deleteMessagesByChatIdAfterTimestamp: Invalid ObjectId",
      );
      return;
    }

    // First get the message to find its timestamp and threadId
    const message = await collection.findOne({ _id: new ObjectId(messageId) });

    if (!message) {
      console.log("Message not found, nothing to delete");
      return;
    }

    // Delete all messages in the same thread after this timestamp
    await collection.deleteMany({
      threadId: message.threadId,
      created_at: { $gt: message.created_at },
    });

    console.log(
      "✅ [MongoDB Chat Repository] deleteMessagesByChatIdAfterTimestamp completed",
    );
  },

  async deleteAllThreads(userId: string): Promise<void> {
    console.log(
      "🗑️ [MongoDB Chat Repository] deleteAllThreads called with userId:",
      userId,
    );

    const threadCollection = await getCollection(COLLECTIONS.CHAT_THREADS);
    const messageCollection = await getCollection(COLLECTIONS.CHAT_MESSAGES);

    // Get all thread IDs for this user (userId is now user email)
    const threads = await threadCollection
      .find({ userId: userId }, { projection: { _id: 1 } })
      .toArray();

    const threadIds = threads.map((t) => t._id.toString());

    // Delete all threads
    await threadCollection.deleteMany({ userId: userId });

    // Delete all messages in these threads
    if (threadIds.length > 0) {
      await messageCollection.deleteMany({ threadId: { $in: threadIds } });
    }

    console.log("✅ [MongoDB Chat Repository] deleteAllThreads completed");
  },

  async deleteUnarchivedThreads(userId: string): Promise<void> {
    console.log(
      "🗑️ [MongoDB Chat Repository] deleteUnarchivedThreads called with userId:",
      userId,
    );

    // For now, this is the same as deleteAllThreads since we don't have archive status in MongoDB yet
    // TODO: Implement archive status tracking
    await this.deleteAllThreads(userId);

    console.log(
      "✅ [MongoDB Chat Repository] deleteUnarchivedThreads completed",
    );
  },

  async insertMessages(
    messages: PartialBy<ChatMessage, "createdAt">[],
  ): Promise<ChatMessage[]> {
    console.log(
      "➕ [MongoDB Chat Repository] insertMessages called with",
      messages.length,
      "messages",
    );

    const collection = await getCollection(COLLECTIONS.CHAT_MESSAGES);
    const now = new Date();

    const messageDocs = messages.map((message) => ({
      threadId: message.threadId,
      role: message.role,
      parts: message.parts,
      metadata: message.metadata,
      created_at: message.createdAt || now,
    }));

    const insertResult = await collection.insertMany(messageDocs);

    const results: ChatMessage[] = messages.map((message, index) => ({
      id: insertResult.insertedIds[index].toString(),
      threadId: message.threadId,
      role: message.role,
      parts: message.parts,
      metadata: message.metadata,
      createdAt: message.createdAt || now,
    }));

    console.log(
      "✅ [MongoDB Chat Repository] insertMessages result:",
      results.length,
      "messages inserted",
    );
    return results;
  },
};
