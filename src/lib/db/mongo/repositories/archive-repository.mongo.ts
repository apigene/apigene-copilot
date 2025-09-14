import { getCollection, COLLECTIONS } from "../mongodb";
import { ObjectId } from "mongodb";
import { getCurrentUserEmail } from "../auth-utils";
import type {
  ArchiveRepository,
  Archive,
  ArchiveItem,
  ArchiveWithItemCount,
} from "app-types/archive";

// Helper function to check if a string is a valid ObjectId
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

// MongoDB Archive Repository Implementation
export const mongoArchiveRepository: ArchiveRepository = {
  async createArchive(archive) {
    console.log(
      "➕ [MongoDB Archive Repository] createArchive called with archive:",
      archive.name,
      "userId:",
      archive.userId,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.ARCHIVES);
    const now = new Date();

    const archiveDoc = {
      name: archive.name,
      description: archive.description,
      userId: userEmail, // Use current user email instead of passed userId
      created_at: now,
      updated_at: now,
    };

    const insertResult = await collection.insertOne(archiveDoc);

    const result: Archive = {
      id: insertResult.insertedId.toString(),
      name: archiveDoc.name,
      description: archiveDoc.description,
      userId: archiveDoc.userId,
      createdAt: archiveDoc.created_at,
      updatedAt: archiveDoc.updated_at,
    };

    console.log(
      "✅ [MongoDB Archive Repository] createArchive result:",
      result,
    );
    return result;
  },

  async getArchivesByUserId(userId: string): Promise<ArchiveWithItemCount[]> {
    console.log(
      "🔍 [MongoDB Archive Repository] getArchivesByUserId called with userId:",
      userId,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const archiveCollection = await getCollection(COLLECTIONS.ARCHIVES);
    const archiveItemCollection = await getCollection(
      COLLECTIONS.ARCHIVE_ITEMS,
    );

    // Get all archives for the user
    const archiveDocs = await archiveCollection
      .find({ userId: userEmail }) // Use current user email instead of passed userId
      .sort({ updated_at: 1 })
      .toArray();

    // Get item counts for each archive
    const results = await Promise.all(
      archiveDocs.map(async (archiveDoc) => {
        const itemCount = await archiveItemCollection.countDocuments({
          archiveId: archiveDoc._id.toString(),
        });

        return {
          id: archiveDoc._id.toString(),
          name: archiveDoc.name,
          description: archiveDoc.description,
          userId: archiveDoc.userId,
          createdAt: archiveDoc.created_at,
          updatedAt: archiveDoc.updated_at,
          itemCount: itemCount,
        } as ArchiveWithItemCount;
      }),
    );

    console.log(
      "✅ [MongoDB Archive Repository] getArchivesByUserId result:",
      results.length,
      "archives found",
    );
    return results;
  },

  async getArchiveById(id: string): Promise<Archive | null> {
    console.log(
      "🔍 [MongoDB Archive Repository] getArchiveById called with id:",
      id,
    );

    const collection = await getCollection(COLLECTIONS.ARCHIVES);

    if (!isValidObjectId(id)) {
      console.log(
        "✅ [MongoDB Archive Repository] getArchiveById result: null (invalid ObjectId)",
      );
      return null;
    }

    const doc = await collection.findOne({ _id: new ObjectId(id) });

    if (!doc) {
      console.log(
        "✅ [MongoDB Archive Repository] getArchiveById result: null (archive not found)",
      );
      return null;
    }

    const result: Archive = {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      userId: doc.userId,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    };

    console.log(
      "✅ [MongoDB Archive Repository] getArchiveById result: Archive found",
    );
    return result;
  },

  async updateArchive(id: string, archive) {
    console.log(
      "✏️ [MongoDB Archive Repository] updateArchive called with id:",
      id,
      "archive:",
      archive,
    );

    const collection = await getCollection(COLLECTIONS.ARCHIVES);
    const now = new Date();

    if (!isValidObjectId(id)) {
      throw new Error(`Invalid ObjectId: ${id}`);
    }

    const updateDoc: any = {
      updated_at: now,
    };

    if (archive.name !== undefined) updateDoc.name = archive.name;
    if (archive.description !== undefined)
      updateDoc.description = archive.description;

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: "after" },
    );

    if (!result) {
      throw new Error(`Archive with id ${id} not found`);
    }

    const archiveResult: Archive = {
      id: result._id.toString(),
      name: result.name,
      description: result.description,
      userId: result.userId,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };

    console.log(
      "✅ [MongoDB Archive Repository] updateArchive result:",
      archiveResult,
    );
    return archiveResult;
  },

  async deleteArchive(id: string): Promise<void> {
    console.log(
      "🗑️ [MongoDB Archive Repository] deleteArchive called with id:",
      id,
    );

    const archiveCollection = await getCollection(COLLECTIONS.ARCHIVES);
    const archiveItemCollection = await getCollection(
      COLLECTIONS.ARCHIVE_ITEMS,
    );

    if (!isValidObjectId(id)) {
      throw new Error(`Invalid ObjectId: ${id}`);
    }

    // Delete all items in the archive first
    await archiveItemCollection.deleteMany({ archiveId: id });

    // Delete the archive
    await archiveCollection.deleteOne({ _id: new ObjectId(id) });

    console.log("✅ [MongoDB Archive Repository] deleteArchive completed");
  },

  async addItemToArchive(
    archiveId: string,
    itemId: string,
    userId: string,
  ): Promise<ArchiveItem> {
    console.log(
      "➕ [MongoDB Archive Repository] addItemToArchive called with archiveId:",
      archiveId,
      "itemId:",
      itemId,
      "userId:",
      userId,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const collection = await getCollection(COLLECTIONS.ARCHIVE_ITEMS);
    const now = new Date();

    const itemDoc = {
      archiveId: archiveId,
      itemId: itemId,
      userId: userEmail, // Use current user email instead of passed userId
      added_at: now,
    };

    // Use upsert to avoid duplicates
    const result = await collection.findOneAndUpdate(
      {
        archiveId: archiveId,
        itemId: itemId,
      },
      { $set: itemDoc },
      { upsert: true, returnDocument: "after" },
    );

    if (!result) {
      throw new Error("Failed to create archive item");
    }

    const archiveItemResult: ArchiveItem = {
      id: result._id.toString(),
      archiveId: result.archiveId,
      itemId: result.itemId,
      userId: result.userId,
      addedAt: result.added_at,
    };

    console.log(
      "✅ [MongoDB Archive Repository] addItemToArchive result:",
      archiveItemResult,
    );
    return archiveItemResult;
  },

  async removeItemFromArchive(
    archiveId: string,
    itemId: string,
  ): Promise<void> {
    console.log(
      "🗑️ [MongoDB Archive Repository] removeItemFromArchive called with archiveId:",
      archiveId,
      "itemId:",
      itemId,
    );

    const collection = await getCollection(COLLECTIONS.ARCHIVE_ITEMS);

    await collection.deleteOne({
      archiveId: archiveId,
      itemId: itemId,
    });

    console.log(
      "✅ [MongoDB Archive Repository] removeItemFromArchive completed",
    );
  },

  async getArchiveItems(archiveId: string): Promise<ArchiveItem[]> {
    console.log(
      "🔍 [MongoDB Archive Repository] getArchiveItems called with archiveId:",
      archiveId,
    );

    const collection = await getCollection(COLLECTIONS.ARCHIVE_ITEMS);

    const docs = await collection
      .find({ archiveId: archiveId })
      .sort({ added_at: 1 })
      .toArray();

    const results: ArchiveItem[] = docs.map((doc) => ({
      id: doc._id.toString(),
      archiveId: doc.archiveId,
      itemId: doc.itemId,
      userId: doc.userId,
      addedAt: doc.added_at,
    }));

    console.log(
      "✅ [MongoDB Archive Repository] getArchiveItems result:",
      results.length,
      "items found",
    );
    return results;
  },

  async getItemArchives(itemId: string, userId: string): Promise<Archive[]> {
    console.log(
      "🔍 [MongoDB Archive Repository] getItemArchives called with itemId:",
      itemId,
      "userId:",
      userId,
    );

    // Get current user email for consistency
    const userEmail = await getCurrentUserEmail();

    const archiveCollection = await getCollection(COLLECTIONS.ARCHIVES);
    const archiveItemCollection = await getCollection(
      COLLECTIONS.ARCHIVE_ITEMS,
    );

    // Find archive items for this item and user
    const itemDocs = await archiveItemCollection
      .find({
        itemId: itemId,
        userId: userEmail, // Use current user email instead of passed userId
      })
      .toArray();

    // Get archive details for each item
    const results = await Promise.all(
      itemDocs.map(async (itemDoc) => {
        const archiveDoc = await archiveCollection.findOne({
          _id: new ObjectId(itemDoc.archiveId),
        });

        if (!archiveDoc) return null;

        return {
          id: archiveDoc._id.toString(),
          name: archiveDoc.name,
          description: archiveDoc.description,
          userId: archiveDoc.userId,
          createdAt: archiveDoc.created_at,
          updatedAt: archiveDoc.updated_at,
        } as Archive;
      }),
    );

    // Filter out null results and sort by name
    const filteredResults = results
      .filter((result): result is Archive => result !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    console.log(
      "✅ [MongoDB Archive Repository] getItemArchives result:",
      filteredResults.length,
      "archives found",
    );
    return filteredResults;
  },
};
