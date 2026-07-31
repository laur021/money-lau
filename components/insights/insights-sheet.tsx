"use client";

import * as React from "react";
import { BotMessageSquare, EyeOff, LoaderCircle, RotateCcw, SendHorizontal, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { InsightMessage } from "@/features/insights/types";
import { PERIOD_LABELS, REPORTING_PERIODS, type ReportingPeriod } from "@/lib/calculations/periods";
import { useScreenPrivacy } from "@/components/privacy/screen-privacy";
import { updateInsightsConsent } from "@/features/settings/actions";

const suggestedQuestions = [
  "What spending category should I review first?",
  "Can I afford my upcoming bills based on this context?",
  "How does this month compare with last month?",
];

export function InsightsSheet({
  currencies,
  defaultCurrency,
  hasConsent,
}: {
  currencies: string[];
  defaultCurrency: string;
  hasConsent: boolean;
}) {
  const { isScreenPrivate } = useScreenPrivacy();
  const [open, setOpen] = React.useState(false);
  const [consented, setConsented] = React.useState(hasConsent);
  const [consentDialogOpen, setConsentDialogOpen] = React.useState(false);
  const [history, setHistory] = React.useState<InsightMessage[]>([]);
  const [message, setMessage] = React.useState("");
  const [period, setPeriod] = React.useState<ReportingPeriod>("this_month");
  const [currency, setCurrency] = React.useState(defaultCurrency);
  const [error, setError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [isConsenting, startConsentTransition] = React.useTransition();

  function clearChat() {
    setError(null);
    setHistory([]);
    setMessage("");
  }

  function sendInsight(question = message) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isPending || isScreenPrivate) return;
    if (!consented) {
      setConsentDialogOpen(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currency,
            history: history.slice(-6),
            message: trimmedQuestion,
            period,
          }),
        });
        const payload = (await response.json()) as { answer?: string; code?: string; error?: string };
        if (!response.ok) {
          if (payload.code === "CONSENT_REQUIRED") setConsentDialogOpen(true);
          throw new Error(payload.error ?? "MoneyLau could not prepare an insight.");
        }
        const answer = payload.answer;
        if (!answer) throw new Error("MoneyLau received an empty insight.");
        setHistory((current) => {
          const nextHistory: InsightMessage[] = [
            ...current,
            { role: "user", content: trimmedQuestion },
            { role: "assistant", content: answer },
          ];
          return nextHistory.slice(-12);
        });
        setMessage("");
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "MoneyLau could not prepare an insight.");
      }
    });
  }

  function grantConsent() {
    startConsentTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("enabled", "true");
        await updateInsightsConsent(formData);
        setConsented(true);
        setConsentDialogOpen(false);
      } catch {
        setError("MoneyLau could not save your consent. Please try again.");
      }
    });
  }

  return (
    <>
      <Sheet onOpenChange={setOpen} open={open}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <SheetTrigger asChild>
                <Button aria-label="Ask MoneyLau" disabled={isScreenPrivate} size="sm" type="button" variant="outline">
                  <BotMessageSquare data-icon="inline-start" />
                  Ask MoneyLau
                </Button>
              </SheetTrigger>
            </span>
          </TooltipTrigger>
          {isScreenPrivate ? <TooltipContent>Reveal financial values to use MoneyLau Insights</TooltipContent> : null}
        </Tooltip>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <BotMessageSquare />
              Ask MoneyLau
            </SheetTitle>
            <SheetDescription>
              Read-only budgeting guidance based on your selected financial summary.
            </SheetDescription>
          </SheetHeader>
          {isScreenPrivate ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <EyeOff />
              <p className="text-sm font-medium">Insights are hidden</p>
              <p>Reveal financial values with the eye control in the top bar to use this chat.</p>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6">
              <FieldGroup className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="insight-period">Period</FieldLabel>
                  <NativeSelect
                    className="w-full"
                    id="insight-period"
                    onChange={(event) => setPeriod(event.target.value as ReportingPeriod)}
                    value={period}
                  >
                    {REPORTING_PERIODS.filter((item) => item !== "all_time").map((item) => (
                      <NativeSelectOption key={item} value={item}>
                        {PERIOD_LABELS[item]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="insight-currency">Currency</FieldLabel>
                  <NativeSelect
                    className="w-full"
                    id="insight-currency"
                    onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                    value={currency}
                  >
                    {currencies.map((currencyOption) => (
                      <NativeSelectOption key={currencyOption} value={currencyOption}>
                        {currencyOption}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              </FieldGroup>

              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question) => (
                  <Button key={question} onClick={() => sendInsight(question)} size="sm" type="button" variant="secondary">
                    {question}
                  </Button>
                ))}
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
                {history.length ? history.map((entry, index) => (
                  <div className="flex flex-col gap-1" key={`${entry.role}-${index}`}>
                    <Badge className="w-fit" variant={entry.role === "assistant" ? "secondary" : "outline"}>
                      {entry.role === "assistant" ? "MoneyLau" : "You"}
                    </Badge>
                    <p className="whitespace-pre-wrap text-sm leading-6">{entry.content}</p>
                  </div>
                )) : (
                  <Alert>
                    <ShieldCheck />
                    <AlertTitle>Private by default</AlertTitle>
                    <AlertDescription>
                      Your chat is kept only in this browser session. MoneyLau sends an aggregated summary, not your raw transaction details.
                    </AlertDescription>
                  </Alert>
                )}
                {isPending ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <LoaderCircle className="animate-spin" />
                    Preparing an insight...
                  </div>
                ) : null}
                {error ? <Alert variant="destructive"><AlertTitle>Insight unavailable</AlertTitle><AlertDescription>{error}</AlertDescription></Alert> : null}
              </div>

              <Field>
                <FieldLabel htmlFor="insight-question">Your question</FieldLabel>
                <Textarea
                  id="insight-question"
                  maxLength={1_500}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ask about spending, Bills, or your budget."
                  value={message}
                />
              </Field>
              <div className="flex items-center justify-between gap-2">
                <Button disabled={isPending || history.length === 0} onClick={clearChat} size="sm" type="button" variant="ghost">
                  <RotateCcw data-icon="inline-start" />
                  New chat
                </Button>
                <Button disabled={isPending || !message.trim()} onClick={() => sendInsight()} size="sm" type="button">
                  <SendHorizontal data-icon="inline-start" />
                  Send
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">General budgeting guidance only, not financial, tax, legal, or investment advice.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog onOpenChange={setConsentDialogOpen} open={consentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allow DeepSeek financial summaries?</DialogTitle>
            <DialogDescription>
              MoneyLau will send a selected, aggregated summary of your balances, completed totals, category spending, Bills, and salary income to DeepSeek for budgeting guidance. It does not send account IDs, transaction descriptions, notes, or merchant names. Current-session follow-ups are sent to DeepSeek, but chats are never saved in MoneyLau.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setConsentDialogOpen(false)} type="button" variant="outline">Not now</Button>
            <Button disabled={isConsenting} onClick={grantConsent} type="button">
              <ShieldCheck data-icon="inline-start" />
              Allow Insights
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
