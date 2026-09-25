"use client";

import { IonButton, IonButtons, IonContent, IonDatetime, IonHeader, IonModal, IonTitle, IonToolbar } from "@ionic/react";
import { calendarOutline } from "ionicons/icons";
import { IonIcon } from "@ionic/react";
import { format, parse } from "date-fns";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type DateValue = string | null | undefined;

type IonicDateInputProps = {
  className?: string;
  defaultValue?: DateValue;
  disabled?: boolean;
  id?: string;
  max?: string;
  min?: string;
  name: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  type?: "date" | "month";
  value?: DateValue;
};

function normalizedValue(value: DateValue, type: "date" | "month") {
  if (!value) return "";
  return type === "month" ? value.slice(0, 7) : value.slice(0, 10);
}

function labelFor(value: string, type: "date" | "month") {
  if (!value) return type === "month" ? "Choose month" : "Choose date";

  const pattern = type === "month" ? "yyyy-MM" : "yyyy-MM-dd";
  const parsed = parse(value, pattern, new Date());
  return format(parsed, type === "month" ? "MMMM yyyy" : "MMM d, yyyy");
}

/**
 * An Ionic sheet-based date/month input that keeps the app's server-action
 * contract: FormData always receives a local YYYY-MM-DD or YYYY-MM value.
 */
export function IonicDateInput({
  className,
  defaultValue,
  disabled = false,
  id,
  max,
  min,
  name,
  onValueChange,
  required = false,
  type = "date",
  value,
}: IonicDateInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() => normalizedValue(defaultValue, type));
  const [draftValue, setDraftValue] = useState("");
  const [open, setOpen] = useState(false);
  const selectedValue = normalizedValue(controlled ? value : internalValue, type);

  const openPicker = () => {
    setDraftValue(selectedValue || normalizedValue(defaultValue, type));
    setOpen(true);
  };

  const commit = () => {
    const nextValue = normalizedValue(draftValue, type);
    if (!controlled) setInternalValue(nextValue);
    onValueChange?.(nextValue);
    setOpen(false);
  };

  return (
    <>
      <input name={name} type="hidden" value={selectedValue} />
      <button
        aria-describedby={required ? `${inputId}-required` : undefined}
        aria-haspopup="dialog"
        className={cn(
          "ionic-date-trigger flex h-11 w-full items-center justify-between rounded-md border border-input bg-card px-3 text-left text-base shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:text-sm dark:bg-input/30",
          !selectedValue && "text-muted-foreground",
          className,
        )}
        disabled={disabled}
        id={inputId}
        onClick={openPicker}
        type="button"
      >
        <span>{labelFor(selectedValue, type)}</span>
        <IonIcon aria-hidden="true" icon={calendarOutline} />
      </button>
      {required ? <span className="sr-only" id={`${inputId}-required`}>Required</span> : null}
      <IonModal
        className="moneylau-date-modal"
        isOpen={open}
        onDidDismiss={() => setOpen(false)}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setOpen(false)}>Cancel</IonButton>
            </IonButtons>
            <IonTitle>{type === "month" ? "Select month" : "Select date"}</IonTitle>
            <IonButtons slot="end">
              <IonButton disabled={!draftValue && required} onClick={commit} strong>
                Done
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonDatetime
            firstDayOfWeek={1}
            max={max}
            min={min}
            onIonChange={(event) => setDraftValue(typeof event.detail.value === "string" ? event.detail.value : "")}
            preferWheel={type === "month"}
            presentation={type === "month" ? "month-year" : "date"}
            showDefaultButtons={false}
            size="cover"
            value={draftValue || undefined}
          />
        </IonContent>
      </IonModal>
    </>
  );
}
