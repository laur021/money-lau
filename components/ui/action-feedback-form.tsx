"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ServerAction = (formData: FormData) => void | Promise<void>;

type ActionFeedbackFormProps = Omit<React.ComponentProps<"form">, "action"> & {
  action: ServerAction;
  pendingMessage?: string;
  successMessage: string;
};

function messageFromError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  return "Please try again.";
}

function getNextRedirect(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  ) {
    const [, redirectType, ...parts] = error.digest.split(";");
    const url = parts.slice(0, -2).join(";");

    if (url) return { url, replace: redirectType === "replace" };
  }

  return null;
}

export function ActionFeedbackForm({
  action,
  children,
  className,
  pendingMessage = "Saving your changes…",
  successMessage,
  ...props
}: ActionFeedbackFormProps) {
  const router = useRouter();

  async function submit(formData: FormData) {
    const toastId = toast.loading(pendingMessage);

    try {
      await action(formData);
      toast.success(successMessage, { id: toastId });
    } catch (error) {
      // `redirect()` completes server actions by throwing a framework control-flow
      // value. Navigate to its target instead of presenting it as a failed action.
      const redirect = getNextRedirect(error);
      if (redirect) {
        toast.dismiss(toastId);
        if (redirect.replace) {
          router.replace(redirect.url);
        } else {
          router.push(redirect.url);
        }
        return;
      }
      toast.error("Couldn’t complete that action", {
        id: toastId,
        description: messageFromError(error),
      });
    }
  }

  return (
    <form action={submit} aria-live="polite" className={cn(className)} {...props}>
      {children}
    </form>
  );
}
