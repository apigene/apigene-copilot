"use client";
import { OrganizationProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useAuth, useOrganization } from "@clerk/nextjs";

export default function ClerkOrganizationProfile() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { organization, isLoaded: orgLoaded } = useOrganization();

  if (!authLoaded || !orgLoaded) {
    return (
      <div className="flex justify-center p-6">
        <div className="text-white">Loading Clerk...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex justify-center p-6">
        <div className="text-white">
          Please sign in to access user management.
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex justify-center p-6">
        <div className="text-white">
          You need to be part of an organization to manage users.
        </div>
        <div className="text-gray-400 mt-2">
          Create an organization in your Clerk dashboard first.
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-6">
      <OrganizationProfile appearance={{ baseTheme: dark }} path="/users" />
    </div>
  );
}
