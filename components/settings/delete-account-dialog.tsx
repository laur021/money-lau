"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ActionFeedbackForm } from "@/components/ui/action-feedback-form";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { requestAccountDeletion } from "@/features/settings/actions";
import { Trash2 } from "lucide-react";

export function DeleteAccountDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 data-icon="inline-start" />
          Request account deletion
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <ActionFeedbackForm
          action={requestAccountDeletion}
          className="flex flex-col gap-5"
          pendingMessage="Submitting deletion request…"
          successMessage="Deletion request submitted"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Request permanent account deletion?</AlertDialogTitle>
            <AlertDialogDescription>
              This schedules a deletion review. Your financial records remain available until the
              request is completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Field>
            <FieldLabel htmlFor="delete-confirmation">Type DELETE to confirm</FieldLabel>
            <Input id="delete-confirmation" name="confirmation" required autoComplete="off" />
            <FieldDescription>This action cannot be automatically undone.</FieldDescription>
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction type="submit" variant="destructive">
              Submit request
            </AlertDialogAction>
          </AlertDialogFooter>
        </ActionFeedbackForm>
      </AlertDialogContent>
    </AlertDialog>
  );
}
