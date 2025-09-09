"use client";

import { CreateOrganization, useOrganization, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FinishSetupPage() {
  const router = useRouter();
  const { membership } = useOrganization();
  const { user: clerkUser, isLoaded: userLoaded } = useUser();

  useEffect(() => {
    if (userLoaded && !clerkUser) {
      router.push("/sign-in");
    }
  }, [userLoaded, clerkUser, router]);

  useEffect(() => {
    if (membership) {
      router.push("/");
    }
  }, [membership, router]);

  if (!userLoaded) {
    return (
      <div className="animate-in fade-in duration-1000 w-full h-full flex flex-col p-4 md:p-8 justify-center">
        <div className="w-full md:max-w-md mx-auto text-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!clerkUser) {
    return null;
  }

  return (
    <div className="animate-in fade-in duration-1000 w-full h-full flex flex-col p-4 md:p-8 justify-center">
      <div className="w-full md:max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold mb-2">
            Create Your Organization
          </h1>
          <p className="text-muted-foreground">
            Set up your organization to get started with Apigene MCP Client.
          </p>
        </div>
        <CreateOrganization
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-primary text-primary-foreground hover:bg-primary/90",
              card: "bg-background border-none shadow-none",
            },
          }}
          afterCreateOrganizationUrl="/"
        />
      </div>
    </div>
  );
}
