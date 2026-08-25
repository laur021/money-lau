"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, ScanLine } from "lucide-react";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { updateReceiptScanningConsent } from "@/features/settings/actions";
import { toast } from "sonner";

export function ReceiptScanningConsentControl({ defaultEnabled }: { defaultEnabled: boolean }) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [isPending, startTransition] = useTransition();

  return (
    <Field orientation="horizontal">
      <Switch
        aria-label="Allow OCR.space receipt scanning"
        checked={enabled}
        disabled={isPending}
        id="receipt-scanning-consent"
        onCheckedChange={(nextValue) => {
          const previousValue = enabled;
          setEnabled(nextValue);
          startTransition(async () => {
            try {
              const formData = new FormData();
              formData.set("enabled", String(nextValue));
              await updateReceiptScanningConsent(formData);
              toast.success("Receipt scanning preference saved");
            } catch {
              setEnabled(previousValue);
              toast.error("Could not save receipt-scanning preference");
            }
          });
        }}
      />
      <FieldContent>
        <FieldLabel className="flex items-center gap-2" htmlFor="receipt-scanning-consent">
          <ScanLine />
          Allow OCR.space receipt scanning
          {isPending ? <LoaderCircle aria-label="Saving" className="animate-spin" /> : null}
        </FieldLabel>
        <FieldDescription>
          Allow selected receipt images to be sent to OCR.space for one-time text extraction. Images and results are not saved in MoneyLau.
        </FieldDescription>
      </FieldContent>
    </Field>
  );
}
