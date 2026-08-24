"use client";

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

export function ActionFeedbackForm({
  action,
  children,
  className,
  pendingMessage = "Saving your changes…",
  successMessage,
  ...props
}: ActionFeedbackFormProps) {
  async function submit(formData: FormData) {
    const toastId = toast.loading(pendingMessage);

    try {
      await action(formData);
      toast.success(successMessage, { id: toastId });
    } catch (error) {
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
