"use client";

import * as React from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type ScreenPrivacyContextValue = {
  isScreenPrivate: boolean;
  setScreenPrivate: (value: boolean) => void;
};

const ScreenPrivacyContext = React.createContext<ScreenPrivacyContextValue | null>(null);
const storageKey = "moneylau-screen-private";

export function ScreenPrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isScreenPrivate, setScreenPrivateState] = React.useState(() => {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem(storageKey) !== "false";
  });

  const setScreenPrivate = React.useCallback((value: boolean) => {
    setScreenPrivateState(value);
    window.sessionStorage.setItem(storageKey, String(value));
  }, []);

  return (
    <ScreenPrivacyContext.Provider value={{ isScreenPrivate, setScreenPrivate }}>
      {children}
    </ScreenPrivacyContext.Provider>
  );
}

export function useScreenPrivacy() {
  const context = React.useContext(ScreenPrivacyContext);
  if (!context) throw new Error("useScreenPrivacy must be used within ScreenPrivacyProvider.");
  return context;
}

export function ScreenPrivacyControl() {
  const { isScreenPrivate, setScreenPrivate } = useScreenPrivacy();
  const [isRevealDialogOpen, setIsRevealDialogOpen] = React.useState(false);

  if (isScreenPrivate) {
    return (
      <>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Show financial values"
              onClick={() => setIsRevealDialogOpen(true)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Eye />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Show financial values</TooltipContent>
        </Tooltip>
        <ScreenPrivacyRevealDialog
          onOpenChange={setIsRevealDialogOpen}
          open={isRevealDialogOpen}
        />
      </>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label="Hide financial values"
          onClick={() => setScreenPrivate(true)}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <EyeOff />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Hide financial values</TooltipContent>
    </Tooltip>
  );
}

function ScreenPrivacyRevealDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { setScreenPrivate } = useScreenPrivacy();

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye />
            Show financial values?
          </DialogTitle>
          <DialogDescription>
            Make sure nobody else can see your screen. This will reveal balances, income,
            expenses, and salary-related figures in this browser tab.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Keep hidden
          </Button>
          <Button
            onClick={() => {
              setScreenPrivate(false);
              onOpenChange(false);
            }}
            type="button"
          >
            <ShieldCheck data-icon="inline-start" />
            Show values
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PrivateFinancialValue({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { isScreenPrivate } = useScreenPrivacy();

  return (
    <span
      aria-label={isScreenPrivate ? "Financial value hidden" : undefined}
      className={cn("inline-block tabular-nums", className)}
    >
      {isScreenPrivate ? <span aria-hidden="true">Hidden</span> : children}
    </span>
  );
}

export function PrivateFinancialChart({ children }: { children: React.ReactNode }) {
  const { isScreenPrivate } = useScreenPrivacy();

  if (!isScreenPrivate) return <>{children}</>;

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
      <EyeOff className="size-5" />
      <p className="text-sm font-medium">Financial chart hidden</p>
      <p className="text-xs">Use the eye control in the top bar to reveal values.</p>
    </div>
  );
}
