import { pgArchiveRepository } from "../../pg/repositories/archive-repository.pg";
import type {
  ArchiveRepository,
  Archive,
  ArchiveItem,
  ArchiveWithItemCount,
} from "app-types/archive";

// MongoDB Archive Repository - STUB IMPLEMENTATION
// Currently delegates to PostgreSQL implementation
// This allows incremental migration without breaking existing functionality
export const mongoArchiveRepository: ArchiveRepository = {
  async createArchive(archive) {
    console.log(
      "➕ [MongoDB Archive Repository] createArchive called with archive:",
      archive.name,
      "userId:",
      archive.userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgArchiveRepository.createArchive(archive);
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
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgArchiveRepository.getArchivesByUserId(userId);
    console.log(
      "✅ [MongoDB Archive Repository] getArchivesByUserId result:",
      result.length,
      "archives found",
    );
    return result;
  },

  async getArchiveById(id: string): Promise<Archive | null> {
    console.log(
      "🔍 [MongoDB Archive Repository] getArchiveById called with id:",
      id,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgArchiveRepository.getArchiveById(id);
    console.log(
      "✅ [MongoDB Archive Repository] getArchiveById result:",
      result ? "Archive found" : "Archive not found",
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
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgArchiveRepository.updateArchive(id, archive);
    console.log(
      "✅ [MongoDB Archive Repository] updateArchive result:",
      result,
    );
    return result;
  },

  async deleteArchive(id: string): Promise<void> {
    console.log(
      "🗑️ [MongoDB Archive Repository] deleteArchive called with id:",
      id,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgArchiveRepository.deleteArchive(id);
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
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgArchiveRepository.addItemToArchive(
      archiveId,
      itemId,
      userId,
    );
    console.log(
      "✅ [MongoDB Archive Repository] addItemToArchive result:",
      result,
    );
    return result;
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
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    await pgArchiveRepository.removeItemFromArchive(archiveId, itemId);
    console.log(
      "✅ [MongoDB Archive Repository] removeItemFromArchive completed",
    );
  },

  async getArchiveItems(archiveId: string): Promise<ArchiveItem[]> {
    console.log(
      "🔍 [MongoDB Archive Repository] getArchiveItems called with archiveId:",
      archiveId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgArchiveRepository.getArchiveItems(archiveId);
    console.log(
      "✅ [MongoDB Archive Repository] getArchiveItems result:",
      result.length,
      "items found",
    );
    return result;
  },

  async getItemArchives(itemId: string, userId: string): Promise<Archive[]> {
    console.log(
      "🔍 [MongoDB Archive Repository] getItemArchives called with itemId:",
      itemId,
      "userId:",
      userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgArchiveRepository.getItemArchives(itemId, userId);
    console.log(
      "✅ [MongoDB Archive Repository] getItemArchives result:",
      result.length,
      "archives found",
    );
    return result;
  },
};
