import { pgBookmarkRepository } from "../../pg/repositories/bookmark-repository.pg";
import type { BookmarkRepository } from "../../pg/repositories/bookmark-repository.pg";

// MongoDB Bookmark Repository - STUB IMPLEMENTATION
// Currently delegates to PostgreSQL implementation
// This allows incremental migration without breaking existing functionality
export const mongoBookmarkRepository: BookmarkRepository = {
  async createBookmark(
    userId: string,
    itemId: string,
    itemType: "agent" | "workflow",
  ): Promise<void> {
    console.log(
      "➕ [MongoDB Bookmark Repository] createBookmark called with userId:",
      userId,
      "itemId:",
      itemId,
      "itemType:",
      itemType,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgBookmarkRepository.createBookmark(userId, itemId, itemType);
    console.log("✅ [MongoDB Bookmark Repository] createBookmark completed");
  },

  async removeBookmark(
    userId: string,
    itemId: string,
    itemType: "agent" | "workflow",
  ): Promise<void> {
    console.log(
      "🗑️ [MongoDB Bookmark Repository] removeBookmark called with userId:",
      userId,
      "itemId:",
      itemId,
      "itemType:",
      itemType,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgBookmarkRepository.removeBookmark(userId, itemId, itemType);
    console.log("✅ [MongoDB Bookmark Repository] removeBookmark completed");
  },

  async toggleBookmark(
    userId: string,
    itemId: string,
    itemType: "agent" | "workflow",
    isCurrentlyBookmarked: boolean,
  ): Promise<boolean> {
    console.log(
      "🔄 [MongoDB Bookmark Repository] toggleBookmark called with userId:",
      userId,
      "itemId:",
      itemId,
      "itemType:",
      itemType,
      "isCurrentlyBookmarked:",
      isCurrentlyBookmarked,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgBookmarkRepository.toggleBookmark(
      userId,
      itemId,
      itemType,
      isCurrentlyBookmarked,
    );
    console.log(
      "✅ [MongoDB Bookmark Repository] toggleBookmark result:",
      result,
    );
    return result;
  },

  async checkItemAccess(
    itemId: string,
    itemType: "agent" | "workflow",
    userId: string,
  ): Promise<boolean> {
    console.log(
      "🔐 [MongoDB Bookmark Repository] checkItemAccess called with itemId:",
      itemId,
      "itemType:",
      itemType,
      "userId:",
      userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgBookmarkRepository.checkItemAccess(
      itemId,
      itemType,
      userId,
    );
    console.log(
      "✅ [MongoDB Bookmark Repository] checkItemAccess result:",
      result,
    );
    return result;
  },
};
