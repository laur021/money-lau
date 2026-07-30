"use client";

import { CircleMinus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type {
  SalaryCalculatedComponent,
  SalaryCalculationType,
  SalaryComponentInput,
  SalaryComponentKind,
} from "@/features/salary/types";
import { formatMoney } from "@/lib/formatting/money";

function numberValue(value: string) {
  return value === "" ? 0 : Number(value);
}

function newComponent(kind: SalaryComponentKind): SalaryComponentInput {
  return {
    name: kind === "earning" ? "Allowance" : "Deduction",
    kind,
    calculationType: "fixed",
    fixedAmount: 0,
  };
}

export function SalaryComponentEditor({
  components,
  calculatedComponents,
  currency,
  disabled = false,
  onChange,
}: {
  components: SalaryComponentInput[];
  calculatedComponents?: SalaryCalculatedComponent[];
  currency: string;
  disabled?: boolean;
  onChange: (components: SalaryComponentInput[]) => void;
}) {
  const updateComponent = (index: number, patch: Partial<SalaryComponentInput>) => {
    onChange(
      components.map((component, componentIndex) =>
        componentIndex === index ? { ...component, ...patch } : component,
      ),
    );
  };

  const updateKind = (index: number, kind: SalaryComponentKind) => {
    const component = components[index];
    let calculationType = component.calculationType;
    if (kind === "deduction" && calculationType === "hourly") calculationType = "fixed";
    if (kind === "earning" && calculationType === "percentage_gross") {
      calculationType = "percentage_base";
    }
    updateComponent(index, { kind, calculationType });
  };

  const updateCalculationType = (index: number, calculationType: SalaryCalculationType) => {
    updateComponent(index, {
      calculationType,
      fixedAmount: calculationType === "fixed" ? components[index].fixedAmount ?? 0 : undefined,
      percentage: calculationType.startsWith("percentage")
        ? components[index].percentage ?? 0
        : undefined,
      hours: calculationType === "hourly" ? components[index].hours ?? 0 : undefined,
      hourlyRate:
        calculationType === "hourly" ? components[index].hourlyRate ?? 0 : undefined,
      multiplier:
        calculationType === "hourly" ? components[index].multiplier ?? 1 : undefined,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {components.map((component, index) => (
        <div className="rounded-md border bg-muted/15 p-3" key={component.id ?? index}>
          <FieldGroup className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <Field className="xl:col-span-2">
              <FieldLabel htmlFor={`salary-component-name-${index}`}>Component</FieldLabel>
              <Input
                disabled={disabled}
                id={`salary-component-name-${index}`}
                onChange={(event) => updateComponent(index, { name: event.target.value })}
                value={component.name}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`salary-component-kind-${index}`}>Type</FieldLabel>
              <NativeSelect
                className="w-full"
                disabled={disabled}
                id={`salary-component-kind-${index}`}
                onChange={(event) =>
                  updateKind(index, event.target.value as SalaryComponentKind)
                }
                value={component.kind}
              >
                <NativeSelectOption value="earning">Earning</NativeSelectOption>
                <NativeSelectOption value="deduction">Deduction</NativeSelectOption>
              </NativeSelect>
            </Field>
            <Field className="xl:col-span-2">
              <FieldLabel htmlFor={`salary-component-calculation-${index}`}>
                Calculation
              </FieldLabel>
              <NativeSelect
                className="w-full"
                disabled={disabled}
                id={`salary-component-calculation-${index}`}
                onChange={(event) =>
                  updateCalculationType(
                    index,
                    event.target.value as SalaryCalculationType,
                  )
                }
                value={component.calculationType}
              >
                <NativeSelectOption value="fixed">Fixed amount</NativeSelectOption>
                <NativeSelectOption value="percentage_base">% of base pay</NativeSelectOption>
                {component.kind === "deduction" ? (
                  <NativeSelectOption value="percentage_gross">% of gross pay</NativeSelectOption>
                ) : null}
                {component.kind === "earning" ? (
                  <NativeSelectOption value="hourly">Hours x rate x multiplier</NativeSelectOption>
                ) : null}
              </NativeSelect>
            </Field>
            <div className="flex items-end justify-between gap-2">
              <div className="pb-1">
                <p className="text-xs text-muted-foreground">Calculated</p>
                <p className="text-sm font-medium tabular-nums">
                  {formatMoney(
                    calculatedComponents?.[index]?.calculatedAmount ?? 0,
                    currency || "PHP",
                  )}
                </p>
              </div>
              {!disabled ? (
                <Button
                  aria-label={`Remove ${component.name || "component"}`}
                  onClick={() =>
                    onChange(components.filter((_, componentIndex) => componentIndex !== index))
                  }
                  size="icon-sm"
                  type="button"
                  variant="ghost"
                >
                  <CircleMinus />
                </Button>
              ) : null}
            </div>
            {component.calculationType === "fixed" ? (
              <Field>
                <FieldLabel htmlFor={`salary-component-amount-${index}`}>
                  Amount
                </FieldLabel>
                <Input
                  disabled={disabled}
                  id={`salary-component-amount-${index}`}
                  min="0"
                  onChange={(event) =>
                    updateComponent(index, { fixedAmount: numberValue(event.target.value) })
                  }
                  step="0.01"
                  type="number"
                  value={component.fixedAmount ?? 0}
                />
              </Field>
            ) : null}
            {component.calculationType.startsWith("percentage") ? (
              <Field>
                <FieldLabel htmlFor={`salary-component-percentage-${index}`}>
                  Percentage
                </FieldLabel>
                <Input
                  disabled={disabled}
                  id={`salary-component-percentage-${index}`}
                  min="0"
                  onChange={(event) =>
                    updateComponent(index, { percentage: numberValue(event.target.value) })
                  }
                  step="0.0001"
                  type="number"
                  value={component.percentage ?? 0}
                />
              </Field>
            ) : null}
            {component.calculationType === "hourly" ? (
              <>
                <Field>
                  <FieldLabel htmlFor={`salary-component-hours-${index}`}>Hours</FieldLabel>
                  <Input
                    disabled={disabled}
                    id={`salary-component-hours-${index}`}
                    min="0"
                    onChange={(event) =>
                      updateComponent(index, { hours: numberValue(event.target.value) })
                    }
                    step="0.01"
                    type="number"
                    value={component.hours ?? 0}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`salary-component-rate-${index}`}>Rate</FieldLabel>
                  <Input
                    disabled={disabled}
                    id={`salary-component-rate-${index}`}
                    min="0"
                    onChange={(event) =>
                      updateComponent(index, { hourlyRate: numberValue(event.target.value) })
                    }
                    step="0.01"
                    type="number"
                    value={component.hourlyRate ?? 0}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`salary-component-multiplier-${index}`}>
                    Multiplier
                  </FieldLabel>
                  <Input
                    disabled={disabled}
                    id={`salary-component-multiplier-${index}`}
                    min="0"
                    onChange={(event) =>
                      updateComponent(index, { multiplier: numberValue(event.target.value) })
                    }
                    step="0.01"
                    type="number"
                    value={component.multiplier ?? 1}
                  />
                </Field>
              </>
            ) : null}
          </FieldGroup>
        </div>
      ))}

      {!disabled ? (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => onChange([...components, newComponent("earning")])}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus data-icon="inline-start" />
            Add earning
          </Button>
          <Button
            onClick={() => onChange([...components, newComponent("deduction")])}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus data-icon="inline-start" />
            Add deduction
          </Button>
        </div>
      ) : null}
    </div>
  );
}
