import { pgChatRepository } from "../../pg/repositories/chat-repository.pg";
import type { ChatRepository, ChatMessage, ChatThread } from "app-types/chat";

// MongoDB Chat Repository - STUB IMPLEMENTATION
// Currently delegates to PostgreSQL implementation
// This allows incremental migration without breaking existing functionality
export const mongoChatRepository: ChatRepository = {
  async insertThread(
    thread: Omit<ChatThread, "createdAt">,
  ): Promise<ChatThread> {
    console.log(
      "➕ [MongoDB Chat Repository] insertThread called with thread:",
      thread.title,
      "userId:",
      thread.userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgChatRepository.insertThread(thread);
    console.log("✅ [MongoDB Chat Repository] insertThread result:", result);
    return result;
  },

  async selectThread(id: string): Promise<ChatThread | null> {
    console.log(
      "🔍 [MongoDB Chat Repository] selectThread called with id:",
      id,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgChatRepository.selectThread(id);
    console.log(
      "✅ [MongoDB Chat Repository] selectThread result:",
      result ? "Thread found" : "Thread not found",
    );
    return result;
  },

  async deleteChatMessage(id: string): Promise<void> {
    console.log(
      "🗑️ [MongoDB Chat Repository] deleteChatMessage called with id:",
      id,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgChatRepository.deleteChatMessage(id);
    console.log("✅ [MongoDB Chat Repository] deleteChatMessage completed");
  },

  async selectThreadDetails(id: string) {
    console.log(
      "🔍 [MongoDB Chat Repository] selectThreadDetails called with id:",
      id,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgChatRepository.selectThreadDetails(id);
    console.log(
      "✅ [MongoDB Chat Repository] selectThreadDetails result:",
      result ? "Thread details found" : "Thread not found",
    );
    return result;
  },

  async selectMessagesByThreadId(threadId: string): Promise<ChatMessage[]> {
    console.log(
      "🔍 [MongoDB Chat Repository] selectMessagesByThreadId called with threadId:",
      threadId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgChatRepository.selectMessagesByThreadId(threadId);
    console.log(
      "✅ [MongoDB Chat Repository] selectMessagesByThreadId result:",
      result.length,
      "messages found",
    );
    return result;
  },

  async selectThreadsByUserId(userId: string) {
    console.log(
      "🔍 [MongoDB Chat Repository] selectThreadsByUserId called with userId:",
      userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgChatRepository.selectThreadsByUserId(userId);
    console.log(
      "✅ [MongoDB Chat Repository] selectThreadsByUserId result:",
      result.length,
      "threads found",
    );
    return result;
  },

  async updateThread(id: string, thread) {
    console.log(
      "✏️ [MongoDB Chat Repository] updateThread called with id:",
      id,
      "thread:",
      thread,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgChatRepository.updateThread(id, thread);
    console.log("✅ [MongoDB Chat Repository] updateThread result:", result);
    return result;
  },

  async deleteThread(id: string): Promise<void> {
    console.log("🗑️ [MongoDB Chat Repository] deleteThread called with id:", id);
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgChatRepository.deleteThread(id);
    console.log("✅ [MongoDB Chat Repository] deleteThread completed");
  },

  async upsertThread(thread) {
    console.log(
      "💾 [MongoDB Chat Repository] upsertThread called with thread:",
      thread,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgChatRepository.upsertThread(thread);
    console.log("✅ [MongoDB Chat Repository] upsertThread result:", result);
    return result;
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
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgChatRepository.insertMessage(message);
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
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgChatRepository.upsertMessage(message);
    console.log("✅ [MongoDB Chat Repository] upsertMessage result:", result);
    return result;
  },

  async deleteMessagesByChatIdAfterTimestamp(messageId: string): Promise<void> {
    console.log(
      "🗑️ [MongoDB Chat Repository] deleteMessagesByChatIdAfterTimestamp called with messageId:",
      messageId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgChatRepository.deleteMessagesByChatIdAfterTimestamp(messageId);
    console.log(
      "✅ [MongoDB Chat Repository] deleteMessagesByChatIdAfterTimestamp completed",
    );
  },

  async deleteAllThreads(userId: string): Promise<void> {
    console.log(
      "🗑️ [MongoDB Chat Repository] deleteAllThreads called with userId:",
      userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgChatRepository.deleteAllThreads(userId);
    console.log("✅ [MongoDB Chat Repository] deleteAllThreads completed");
  },

  async deleteUnarchivedThreads(userId: string): Promise<void> {
    console.log(
      "🗑️ [MongoDB Chat Repository] deleteUnarchivedThreads called with userId:",
      userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgChatRepository.deleteUnarchivedThreads(userId);
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
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgChatRepository.insertMessages(messages);
    console.log(
      "✅ [MongoDB Chat Repository] insertMessages result:",
      result.length,
      "messages inserted",
    );
    return result;
  },
};
