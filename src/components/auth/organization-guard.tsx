"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface OrganizationGuardProps {
  children: React.ReactNode;
}

export function OrganizationGuard({ children }: OrganizationGuardProps) {
  const router = useRouter();
  const { membership, isLoaded: orgLoaded } = useOrganization();
  const { user, isLoaded: userLoaded } = useUser();

  useEffect(() => {
    if (userLoaded && orgLoaded) {
      if (!user) {
        router.push("/sign-in");
      } else if (!membership) {
        router.push("/finish-setup");
      }
    }
  }, [userLoaded, orgLoaded, user, membership, router]);

  if (!userLoaded || !orgLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user || !membership) {
    return null;
  }

  return <>{children}</>;
}
