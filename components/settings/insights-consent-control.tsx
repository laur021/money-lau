"use client";

import { useState, useTransition } from "react";
import { BotMessageSquare, LoaderCircle } from "lucide-react";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { updateInsightsConsent } from "@/features/settings/actions";
import { toast } from "sonner";

export function InsightsConsentControl({ defaultEnabled }: { defaultEnabled: boolean }) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [isPending, startTransition] = useTransition();

  return (
    <Field orientation="horizontal">
      <Switch
        aria-label="Allow MoneyLau Insights"
        checked={enabled}
        disabled={isPending}
        id="ai-insights-consent"
        onCheckedChange={(nextValue) => {
          const previousValue = enabled;
          setEnabled(nextValue);
          startTransition(async () => {
            const toastId = toast.loading("Saving insights preference…");
            try {
              const formData = new FormData();
              formData.set("enabled", String(nextValue));
              await updateInsightsConsent(formData);
              toast.success("Insights preference saved", { id: toastId });
            } catch {
              setEnabled(previousValue);
              toast.error("Couldn’t save insights preference", { id: toastId });
            }
          });
        }}
      />
      <FieldContent>
        <FieldLabel className="flex items-center gap-2" htmlFor="ai-insights-consent">
          <BotMessageSquare />
          Allow MoneyLau Insights
          {isPending ? <LoaderCircle aria-label="Saving" className="animate-spin" /> : null}
        </FieldLabel>
        <FieldDescription>
          Allow selected, aggregated financial summaries to be sent to DeepSeek for budgeting guidance. Chats are not saved.
        </FieldDescription>
      </FieldContent>
    </Field>
  );
}
