"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="w-full h-full flex flex-col p-4 md:p-8 justify-center">
      <div className="w-full md:max-w-md mx-auto">
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-primary text-primary-foreground hover:bg-primary/90",
              card: "bg-background border-none shadow-none",
            },
          }}
          signUpUrl="/sign-up"
          redirectUrl="/"
        />
      </div>
    </div>
  );
}
