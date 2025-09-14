import { getCollection, COLLECTIONS } from "../mongodb";
import { ObjectId } from "mongodb";
import type { User, UserPreferences, UserRepository } from "app-types/user";

// Helper function to check if a string is a valid ObjectId
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

// MongoDB User Repository Implementation
export const mongoUserRepository: UserRepository = {
  async existsByEmail(email: string): Promise<boolean> {
    console.log(
      "🔍 [MongoDB User Repository] existsByEmail called with email:",
      email,
    );

    const collection = await getCollection(COLLECTIONS.USERS);

    const doc = await collection.findOne(
      { email: email },
      { projection: { _id: 1 } },
    );
    const result = !!doc;

    console.log("✅ [MongoDB User Repository] existsByEmail result:", result);
    return result;
  },

  async updateUser(
    id: string,
    user: Pick<User, "name" | "image">,
  ): Promise<User> {
    console.log(
      "✏️ [MongoDB User Repository] updateUser called with id:",
      id,
      "user:",
      user,
    );

    const collection = await getCollection(COLLECTIONS.USERS);
    const now = new Date();

    if (!isValidObjectId(id)) {
      throw new Error(`Invalid ObjectId: ${id}`);
    }

    const updateDoc = {
      name: user.name,
      image: user.image,
      updated_at: now,
    };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateDoc },
      { returnDocument: "after" },
    );

    if (!result) {
      throw new Error(`User with id ${id} not found`);
    }

    const userResult: User = {
      id: result._id.toString(),
      name: result.name,
      email: result.email,
      image: result.image,
      preferences: result.preferences,
      trial_expire_in: result.trial_expire_in,
      org_name: result.org_name,
      org_id: result.org_id,
      role: result.role,
      onboarding_completed: result.onboarding_completed,
      features: result.features,
    };

    console.log("✅ [MongoDB User Repository] updateUser result:", userResult);
    return userResult;
  },

  async updatePreferences(
    userId: string,
    preferences: UserPreferences,
  ): Promise<User> {
    console.log(
      "⚙️ [MongoDB User Repository] updatePreferences called with userId:",
      userId,
      "preferences:",
      preferences,
    );

    const collection = await getCollection(COLLECTIONS.USERS);
    const now = new Date();

    if (!isValidObjectId(userId)) {
      throw new Error(`Invalid ObjectId: ${userId}`);
    }

    const updateDoc = {
      preferences: preferences,
      updated_at: now,
    };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updateDoc },
      { returnDocument: "after" },
    );

    if (!result) {
      throw new Error(`User with id ${userId} not found`);
    }

    const userResult: User = {
      id: result._id.toString(),
      name: result.name,
      email: result.email,
      image: result.image,
      preferences: result.preferences,
      trial_expire_in: result.trial_expire_in,
      org_name: result.org_name,
      org_id: result.org_id,
      role: result.role,
      onboarding_completed: result.onboarding_completed,
      features: result.features,
    };

    console.log(
      "✅ [MongoDB User Repository] updatePreferences result:",
      userResult,
    );
    return userResult;
  },

  async getPreferences(userId: string): Promise<UserPreferences | null> {
    console.log(
      "🔍 [MongoDB User Repository] getPreferences called with userId:",
      userId,
    );

    const collection = await getCollection(COLLECTIONS.USERS);

    if (!isValidObjectId(userId)) {
      console.log(
        "✅ [MongoDB User Repository] getPreferences: Invalid ObjectId",
      );
      return null;
    }

    const doc = await collection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { preferences: 1 } },
    );

    const result = doc?.preferences || null;

    console.log("✅ [MongoDB User Repository] getPreferences result:", result);
    return result;
  },

  async findById(userId: string): Promise<User | null> {
    console.log(
      "🔍 [MongoDB User Repository] findById called with userId:",
      userId,
    );

    const collection = await getCollection(COLLECTIONS.USERS);

    if (!isValidObjectId(userId)) {
      console.log("✅ [MongoDB User Repository] findById: Invalid ObjectId");
      return null;
    }

    const doc = await collection.findOne({ _id: new ObjectId(userId) });

    if (!doc) {
      console.log(
        "✅ [MongoDB User Repository] findById result: User not found",
      );
      return null;
    }

    const result: User = {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      image: doc.image,
      preferences: doc.preferences,
      trial_expire_in: doc.trial_expire_in,
      org_name: doc.org_name,
      org_id: doc.org_id,
      role: doc.role,
      onboarding_completed: doc.onboarding_completed,
      features: doc.features,
    };

    console.log("✅ [MongoDB User Repository] findById result: User found");
    return result;
  },
};
