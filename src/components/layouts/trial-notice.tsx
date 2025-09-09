"use client";

import { useState } from "react";
import { Button } from "ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "ui/dialog";
import { Badge } from "ui/badge";
import { Sparkles, ExternalLink } from "lucide-react";
import { useUserInfo } from "@/hooks/queries/use-user-info";

interface TrialNoticeProps {
  className?: string;
}

export function TrialNotice({ className }: TrialNoticeProps) {
  const { data: userInfo, isLoading } = useUserInfo();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Don't render if loading or no trial data
  if (isLoading || !userInfo) {
    return null;
  }

  const trialEnds = userInfo.trial_expire_in ?? -1;

  // Don't render if no trial or trial has expired
  if (trialEnds < 0) {
    return null;
  }

  const isExpiringSoon = trialEnds <= 3;
  const isExpired = trialEnds === 0;

  return (
    <>
      <div
        className={`cursor-pointer transition-all duration-200 hover:opacity-90 ${className}`}
        onClick={() => setIsDialogOpen(true)}
      >
        <Badge
          variant={
            isExpired ? "destructive" : isExpiringSoon ? "secondary" : "default"
          }
          className={`
            w-full justify-center py-2 px-3 text-xs font-semibold
            ${
              isExpired
                ? "bg-red-500/20 text-red-400 border-red-500/30"
                : isExpiringSoon
                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                  : "bg-blue-500/20 text-blue-400 border-blue-500/30"
            }
          `}
        >
          <Sparkles className="w-3 h-3 mr-1" />
          {trialEnds} {trialEnds !== 1 ? "days" : "day"} left in trial period
        </Badge>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Welcome to Apigene
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your AI-powered control center enabling agentic workflows and
              seamless, governed connectivity across SaaS apps.
            </p>

            <div
              className={`
              rounded-lg p-4 border-2 flex items-center justify-center gap-2
              ${
                isExpired
                  ? "bg-red-500/10 border-red-500/30"
                  : isExpiringSoon
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-blue-500/10 border-blue-500/30"
              }
            `}
            >
              <Sparkles
                className={`w-5 h-5 ${isExpired ? "text-red-400" : isExpiringSoon ? "text-yellow-400" : "text-blue-400"}`}
              />
              <span
                className={`font-semibold text-sm ${isExpired ? "text-red-400" : isExpiringSoon ? "text-yellow-400" : "text-blue-400"}`}
              >
                {trialEnds} {trialEnds !== 1 ? "days" : "day"} left in your free
                trial
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              Ready to unlock more? Check our pricing or book a demo with our
              team.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              onClick={() =>
                window.open("https://apigene.ai/pricing", "_blank")
              }
            >
              View Pricing
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>

            <Button
              variant="outline"
              className="w-full border-border hover:bg-accent font-semibold"
              onClick={() =>
                window.open(
                  "https://calendly.com/apigene/apigene-demo",
                  "_blank",
                )
              }
            >
              Book a Demo / Talk to Sales
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>

            <div className="border-t border-border pt-3">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
