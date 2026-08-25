"use client";

import {
  TransactionForm,
  type ReceiptTransactionDraft,
} from "@/components/transactions/transaction-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { updateReceiptScanningConsent } from "@/features/settings/actions";
import { Camera, FileScan, LoaderCircle, ShieldCheck, Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

type Account = { id: string; name: string; currency: string; is_archived?: boolean };
type Category = {
  id: string;
  name: string;
  transaction_type: "income" | "expense";
  is_archived?: boolean;
};

type ReceiptScanResponse = { draft?: ReceiptTransactionDraft; code?: string; error?: string };
const maxReceiptFileSize = 1024 * 1024;

async function compressReceiptImage(file: File) {
  if (file.size <= maxReceiptFileSize) return file;
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("MoneyLau could not open this image."));
      element.src = sourceUrl;
    });
    let width = Math.min(image.naturalWidth, 2000);
    let height = Math.round(image.naturalHeight * (width / image.naturalWidth));
    for (let attempt = 0; attempt < 7; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("MoneyLau could not prepare this image.");
      context.drawImage(image, 0, 0, width, height);
      const quality = Math.max(0.55, 0.88 - attempt * 0.05);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      );
      if (blob && blob.size <= maxReceiptFileSize) {
        return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "receipt"}.jpg`, {
          type: "image/jpeg",
        });
      }
      width = Math.round(width * 0.75);
      height = Math.round(height * 0.75);
    }
    throw new Error(
      "This image is still larger than 1 MB after compression. Crop it to the receipt and try again."
    );
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export function ReceiptScanDialog({
  accounts,
  categories,
  hasConsent,
}: {
  accounts: Account[];
  categories: Category[];
  hasConsent: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [consented, setConsented] = React.useState(hasConsent);
  const [consentOpen, setConsentOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [draft, setDraft] = React.useState<ReceiptTransactionDraft | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isScanning, startScanTransition] = React.useTransition();
  const [isConsenting, startConsentTransition] = React.useTransition();
  const uploadInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const previewUrl = React.useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  React.useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  function reset() {
    setFile(null);
    setDraft(null);
    setError(null);
  }

  function openScanner() {
    if (!consented) {
      setConsentOpen(true);
      return;
    }
    setOpen(true);
  }

  async function selectFile(nextFile: File | null) {
    if (!nextFile) return;
    if (!new Set(["image/jpeg", "image/png"]).has(nextFile.type)) {
      setFile(null);
      setError("Choose a JPEG or PNG receipt image.");
      return;
    }
    try {
      const preparedFile = await compressReceiptImage(nextFile);
      setError(null);
      setFile(preparedFile);
    } catch (fileError) {
      setFile(null);
      setError(
        fileError instanceof Error ? fileError.message : "MoneyLau could not prepare this image."
      );
    }
  }

  function saveConsent() {
    startConsentTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("enabled", "true");
        await updateReceiptScanningConsent(formData);
        setConsented(true);
        setConsentOpen(false);
        setOpen(true);
        toast.success("Receipt scanning enabled");
      } catch (consentError) {
        toast.error("Could not save receipt-scanning consent", {
          description: consentError instanceof Error ? consentError.message : "Please try again.",
        });
      }
    });
  }

  function scanReceipt() {
    if (!file || isScanning) return;
    setError(null);
    startScanTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("receipt", file);
        const response = await fetch("/api/receipts/analyze", { method: "POST", body: formData });
        const payload = (await response.json()) as ReceiptScanResponse;
        if (!response.ok) {
          if (payload.code === "CONSENT_REQUIRED") {
            setOpen(false);
            setConsentOpen(true);
          }
          throw new Error(payload.error ?? "MoneyLau could not scan this receipt.");
        }
        if (!payload.draft) throw new Error("MoneyLau could not prepare a receipt draft.");
        setDraft(payload.draft);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "MoneyLau could not scan this receipt."
        );
      }
    });
  }

  return (
    <>
      <Button
        onClick={openScanner}
        type="button"
        variant="outline"
      >
        <Camera data-icon="inline-start" />
        Scan receipt
      </Button>
      <Dialog
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) reset();
        }}
        open={open}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileScan />
              {draft ? "Review receipt draft" : "Scan a receipt"}
            </DialogTitle>
            <DialogDescription>
              {draft
                ? "Nothing has been saved yet. Review the details, then explicitly save the transaction."
                : "Upload a JPEG or PNG receipt up to 1 MB. MoneyLau sends it to OCR.space for one-time analysis and does not retain the image."}
            </DialogDescription>
          </DialogHeader>
          {draft ? (
            <TransactionForm accounts={accounts} categories={categories} receiptDraft={draft} />
          ) : (
            <div className="grid gap-4">
              <Field>
                <FieldLabel>Receipt photo</FieldLabel>
                <Input
                  accept="image/jpeg,image/png"
                  className="sr-only"
                  id="receipt-upload"
                  onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
                  ref={uploadInputRef}
                  type="file"
                />
                <Input
                  accept="image/jpeg,image/png"
                  capture="environment"
                  className="sr-only"
                  id="receipt-camera"
                  onChange={(event) => selectFile(event.target.files?.[0] ?? null)}
                  ref={cameraInputRef}
                  type="file"
                />
                <div
                  className="mt-2 flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 p-6 text-center transition-colors hover:bg-muted/60"
                  onClick={() => uploadInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    selectFile(event.dataTransfer.files?.[0] ?? null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      uploadInputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {file && previewUrl ? (
                    <>
                      {/* Blob URLs are browser-only previews and cannot use Next's image optimizer. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt="Selected receipt preview"
                        className="max-h-28 w-full rounded-md object-contain"
                        src={previewUrl}
                      />
                      <p className="text-xs text-muted-foreground">
                        {file.name} ({Math.ceil(file.size / 1024)} KB) — click or drop another image to replace it
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="size-6 text-muted-foreground" />
                      <p className="text-sm font-medium">Drag and drop a receipt image here</p>
                      <p className="text-xs text-muted-foreground">JPEG or PNG, up to 1 MB</p>
                    </>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    onClick={() => uploadInputRef.current?.click()}
                    type="button"
                    variant="outline"
                  >
                    <Upload data-icon="inline-start" />
                    Upload image
                  </Button>
                  <Button
                    className="sm:hidden"
                    onClick={() => cameraInputRef.current?.click()}
                    type="button"
                    variant="outline"
                  >
                    <Camera data-icon="inline-start" />
                    Take photo
                  </Button>
                </div>
                <FieldDescription>
                  On desktop, upload or drag and drop. On mobile, upload from your device or take a
                  new photo.
                </FieldDescription>
              </Field>
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>Receipt unavailable</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              <DialogFooter>
                <Button disabled={!file || isScanning} onClick={scanReceipt} type="button">
                  {isScanning ? (
                    <LoaderCircle className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <FileScan data-icon="inline-start" />
                  )}
                  {isScanning ? "Scanning…" : "Scan receipt"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog onOpenChange={setConsentOpen} open={consentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Allow OCR.space receipt scanning?</DialogTitle>
            <DialogDescription>
              MoneyLau will send each selected receipt image to OCR.space to extract receipt text
              and prepare a merchant, date, total, currency, and tax draft. Images and extraction
              results are not saved by MoneyLau and are never attached to a transaction.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setConsentOpen(false)} type="button" variant="outline">
              Not now
            </Button>
            <Button disabled={isConsenting} onClick={saveConsent} type="button">
              <ShieldCheck data-icon="inline-start" />
              Allow scanning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
