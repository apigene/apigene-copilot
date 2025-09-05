"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="animate-in fade-in duration-1000 w-full h-full flex flex-col p-4 md:p-8 justify-center">
      <div className="w-full md:max-w-md mx-auto">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-primary text-primary-foreground hover:bg-primary/90",
              card: "bg-background border-none shadow-none",
            },
          }}
          signInUrl="/sign-in"
          redirectUrl="/"
        />
      </div>
    </div>
  );
}
