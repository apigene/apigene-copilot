import { User, UserPreferences, UserRepository } from "app-types/user";
import { pgUserRepository } from "../../pg/repositories/user-repository.pg";

// MongoDB User Repository - STUB IMPLEMENTATION
// Currently delegates to PostgreSQL implementation
// This allows incremental migration without breaking existing functionality
export const mongoUserRepository: UserRepository = {
  existsByEmail: async (email: string): Promise<boolean> => {
    console.log(
      "🔍 [MongoDB User Repository] existsByEmail called with email:",
      email,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgUserRepository.existsByEmail(email);
    console.log("✅ [MongoDB User Repository] existsByEmail result:", result);
    return result;
  },

  updateUser: async (
    id: string,
    user: Pick<User, "name" | "image">,
  ): Promise<User> => {
    console.log(
      "✏️ [MongoDB User Repository] updateUser called with id:",
      id,
      "user:",
      user,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgUserRepository.updateUser(id, user);
    console.log("✅ [MongoDB User Repository] updateUser result:", result);
    return result;
  },

  updatePreferences: async (
    userId: string,
    preferences: UserPreferences,
  ): Promise<User> => {
    console.log(
      "⚙️ [MongoDB User Repository] updatePreferences called with userId:",
      userId,
      "preferences:",
      preferences,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgUserRepository.updatePreferences(
      userId,
      preferences,
    );
    console.log(
      "✅ [MongoDB User Repository] updatePreferences result:",
      result,
    );
    return result;
  },

  getPreferences: async (userId: string) => {
    console.log(
      "🔍 [MongoDB User Repository] getPreferences called with userId:",
      userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgUserRepository.getPreferences(userId);
    console.log("✅ [MongoDB User Repository] getPreferences result:", result);
    return result;
  },

  findById: async (userId: string) => {
    console.log(
      "🔍 [MongoDB User Repository] findById called with userId:",
      userId,
    );
    // TODO: Implement MongoDB version
    // For now, delegate to PostgreSQL
    const result = await pgUserRepository.findById(userId);
    console.log(
      "✅ [MongoDB User Repository] findById result:",
      result ? "User found" : "User not found",
    );
    return result;
  },
};
