import { getCollection, COLLECTIONS } from "../mongodb";
import { ObjectId } from "mongodb";
import { getCurrentUserEmail } from "../auth-utils";
import type { BookmarkRepository } from "../../pg/repositories/bookmark-repository.pg";

// Helper function to check if a string is a valid ObjectId
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

// MongoDB Bookmark Repository Implementation
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

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.BOOKMARKS);
    const now = new Date();

    const bookmarkDoc = {
      userId: userEmail, // Use current user email instead of passed userId
      itemId: itemId,
      itemType: itemType,
      created_at: now,
      updated_at: now,
    };

    // Use upsert to avoid duplicates
    await collection.updateOne(
      {
        userId: userEmail,
        itemId: itemId,
        itemType: itemType,
      },
      { $set: bookmarkDoc },
      { upsert: true },
    );

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

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.BOOKMARKS);

    await collection.deleteOne({
      userId: userEmail, // Use current user email instead of passed userId
      itemId: itemId,
      itemType: itemType,
    });

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

    if (isCurrentlyBookmarked) {
      await this.removeBookmark(userId, itemId, itemType);
      console.log(
        "✅ [MongoDB Bookmark Repository] toggleBookmark result: false (removed)",
      );
      return false;
    } else {
      await this.createBookmark(userId, itemId, itemType);
      console.log(
        "✅ [MongoDB Bookmark Repository] toggleBookmark result: true (added)",
      );
      return true;
    }
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

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    if (itemType === "agent") {
      const agentCollection = await getCollection(COLLECTIONS.AGENTS);

      if (!isValidObjectId(itemId)) {
        console.log(
          "✅ [MongoDB Bookmark Repository] checkItemAccess result: false (invalid ObjectId)",
        );
        return false;
      }

      const agentDoc = await agentCollection.findOne({
        _id: new ObjectId(itemId),
      });

      if (!agentDoc) {
        console.log(
          "✅ [MongoDB Bookmark Repository] checkItemAccess result: false (agent not found)",
        );
        return false;
      }

      // Can bookmark if it's public/readonly or if it's their own agent
      const hasAccess =
        agentDoc.visibility === "public" ||
        agentDoc.visibility === "readonly" ||
        agentDoc.created_by === userEmail; // Use current user email instead of passed userId

      console.log(
        "✅ [MongoDB Bookmark Repository] checkItemAccess result:",
        hasAccess,
      );
      return hasAccess;
    }

    if (itemType === "workflow") {
      const workflowCollection = await getCollection(COLLECTIONS.WORKFLOWS);

      if (!isValidObjectId(itemId)) {
        console.log(
          "✅ [MongoDB Bookmark Repository] checkItemAccess result: false (invalid ObjectId)",
        );
        return false;
      }

      const workflowDoc = await workflowCollection.findOne({
        _id: new ObjectId(itemId),
      });

      if (!workflowDoc) {
        console.log(
          "✅ [MongoDB Bookmark Repository] checkItemAccess result: false (workflow not found)",
        );
        return false;
      }

      // Can bookmark if it's public/readonly or if it's their own workflow
      const hasAccess =
        workflowDoc.visibility === "public" ||
        workflowDoc.visibility === "readonly" ||
        workflowDoc.userId === userEmail; // Use current user email instead of passed userId

      console.log(
        "✅ [MongoDB Bookmark Repository] checkItemAccess result:",
        hasAccess,
      );
      return hasAccess;
    }

    console.log(
      "✅ [MongoDB Bookmark Repository] checkItemAccess result: false (unsupported itemType)",
    );
    return false;
  },
};
