"use client";

import {
  CircleMinus,
  ExternalLink,
  Landmark,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import {
  philippineContributionCodes,
  type PhilippineContributionCode,
  type SalaryCalculatedComponent,
  type SalaryCalculationType,
  type SalaryComponentInput,
  type SalaryComponentKind,
  type SalaryGovernmentContext,
} from "@/features/salary/types";
import {
  PHILIPPINE_CONTRIBUTION_SOURCES,
  SALARY_ALLOCATION_FRACTIONS,
} from "@/lib/calculations/ph-government-contributions";
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

function allocationLabel(allocation: SalaryGovernmentContext["allocation"]) {
  if (allocation === "full") return "Full monthly amount";
  if (allocation === "half") return "Half monthly amount";
  return "Quarter monthly amount";
}

export function SalaryComponentEditor({
  components,
  calculatedComponents,
  currency,
  governmentContext,
  disabled = false,
  onChange,
}: {
  components: SalaryComponentInput[];
  calculatedComponents?: SalaryCalculatedComponent[];
  currency: string;
  governmentContext?: SalaryGovernmentContext;
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

  const toggleGovernmentPreset = (
    code: PhilippineContributionCode,
    checked: boolean,
  ) => {
    if (checked) {
      const rule = PHILIPPINE_CONTRIBUTION_SOURCES[code];
      onChange([
        ...components,
        {
          name: rule.shortLabel,
          kind: "deduction",
          calculationType: "government_preset",
          governmentPresetCode: code,
        },
      ]);
      return;
    }
    onChange(components.filter((component) => component.governmentPresetCode !== code));
  };

  const governmentComponents = components.filter(
    (component) => component.calculationType === "government_preset",
  );

  return (
    <div className="flex flex-col gap-3">
      {components.map((component, index) => {
        const calculatedComponent = calculatedComponents?.[index];

        if (
          component.calculationType === "government_preset" &&
          component.governmentPresetCode
        ) {
          const rule =
            PHILIPPINE_CONTRIBUTION_SOURCES[component.governmentPresetCode];
          const allocation =
            calculatedComponent?.governmentAllocation ??
            component.governmentAllocation ??
            governmentContext?.allocation ??
            "full";
          const hasOverride = component.governmentOverrideAmount !== undefined;

          return (
            <Card key={component.id ?? component.governmentPresetCode}>
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-sm">{rule.label}</CardTitle>
                  <Badge variant="secondary">PH preset</Badge>
                </div>
                {!disabled ? (
                  <CardAction>
                    <Button
                      aria-label={`Remove ${rule.shortLabel}`}
                      onClick={() =>
                        onChange(
                          components.filter(
                            (_, componentIndex) => componentIndex !== index,
                          ),
                        )
                      }
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <CircleMinus />
                    </Button>
                  </CardAction>
                ) : null}
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-muted-foreground">Effective</dt>
                    <dd className="font-medium">{rule.effectiveFrom}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Prescribed monthly</dt>
                    <dd className="font-medium tabular-nums">
                      {formatMoney(
                        calculatedComponent?.governmentMonthlyAmount ?? 0,
                        "PHP",
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Allocation</dt>
                    <dd className="font-medium">
                      {allocationLabel(allocation)} (
                      {SALARY_ALLOCATION_FRACTIONS[allocation] * 100}%)
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Allocated deduction</dt>
                    <dd className="font-medium tabular-nums">
                      {formatMoney(calculatedComponent?.calculatedAmount ?? 0, "PHP")}
                    </dd>
                  </div>
                </dl>

                <FieldGroup className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Field orientation="horizontal">
                    <Switch
                      checked={hasOverride}
                      disabled={disabled}
                      id={`salary-government-override-${index}`}
                      onCheckedChange={(checked) =>
                        updateComponent(index, {
                          governmentOverrideAmount: checked
                            ? calculatedComponent?.calculatedAmount ?? 0
                            : undefined,
                        })
                      }
                    />
                    <FieldContent>
                      <FieldLabel htmlFor={`salary-government-override-${index}`}>
                        Use custom amount
                      </FieldLabel>
                      <FieldDescription>
                        Set zero for an extra payday with no deduction.
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                  {hasOverride ? (
                    <div className="flex items-end gap-2">
                      <Field>
                        <FieldLabel htmlFor={`salary-government-amount-${index}`}>
                          Custom deduction
                        </FieldLabel>
                        <Input
                          disabled={disabled}
                          id={`salary-government-amount-${index}`}
                          min="0"
                          onChange={(event) =>
                            updateComponent(index, {
                              governmentOverrideAmount: numberValue(
                                event.target.value,
                              ),
                            })
                          }
                          step="0.01"
                          type="number"
                          value={component.governmentOverrideAmount ?? 0}
                        />
                      </Field>
                      {!disabled ? (
                        <Button
                          aria-label={`Reset ${rule.shortLabel} to computed amount`}
                          onClick={() =>
                            updateComponent(index, {
                              governmentOverrideAmount: undefined,
                            })
                          }
                          size="icon"
                          title="Reset to computed amount"
                          type="button"
                          variant="outline"
                        >
                          <RotateCcw />
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </FieldGroup>

                <Button asChild className="w-fit" size="sm" variant="link">
                  <a href={rule.sourceUrl} rel="noreferrer" target="_blank">
                    <ExternalLink data-icon="inline-start" />
                    Official source
                  </a>
                </Button>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={component.id ?? index}>
            <CardContent className="pt-4">
              <FieldGroup className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <Field className="xl:col-span-2">
                  <FieldLabel htmlFor={`salary-component-name-${index}`}>
                    Component
                  </FieldLabel>
                  <Input
                    disabled={disabled}
                    id={`salary-component-name-${index}`}
                    onChange={(event) =>
                      updateComponent(index, { name: event.target.value })
                    }
                    value={component.name}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor={`salary-component-kind-${index}`}>
                    Type
                  </FieldLabel>
                  <NativeSelect
                    className="w-full"
                    disabled={disabled}
                    id={`salary-component-kind-${index}`}
                    onChange={(event) =>
                      updateKind(
                        index,
                        event.target.value as SalaryComponentKind,
                      )
                    }
                    value={component.kind}
                  >
                    <NativeSelectOption value="earning">Earning</NativeSelectOption>
                    <NativeSelectOption value="deduction">
                      Deduction
                    </NativeSelectOption>
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
                    <NativeSelectOption value="percentage_base">
                      % of base pay
                    </NativeSelectOption>
                    {component.kind === "deduction" ? (
                      <NativeSelectOption value="percentage_gross">
                        % of gross pay
                      </NativeSelectOption>
                    ) : null}
                    {component.kind === "earning" ? (
                      <NativeSelectOption value="hourly">
                        Hours x rate x multiplier
                      </NativeSelectOption>
                    ) : null}
                  </NativeSelect>
                </Field>
                <div className="flex items-end justify-between gap-2">
                  <div className="pb-1">
                    <p className="text-xs text-muted-foreground">Calculated</p>
                    <p className="text-sm font-medium tabular-nums">
                      {formatMoney(calculatedComponent?.calculatedAmount ?? 0, currency)}
                    </p>
                  </div>
                  {!disabled ? (
                    <Button
                      aria-label={`Remove ${component.name || "component"}`}
                      onClick={() =>
                        onChange(
                          components.filter(
                            (_, componentIndex) => componentIndex !== index,
                          ),
                        )
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
                        updateComponent(index, {
                          fixedAmount: numberValue(event.target.value),
                        })
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
                        updateComponent(index, {
                          percentage: numberValue(event.target.value),
                        })
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
                      <FieldLabel htmlFor={`salary-component-hours-${index}`}>
                        Hours
                      </FieldLabel>
                      <Input
                        disabled={disabled}
                        id={`salary-component-hours-${index}`}
                        min="0"
                        onChange={(event) =>
                          updateComponent(index, {
                            hours: numberValue(event.target.value),
                          })
                        }
                        step="0.01"
                        type="number"
                        value={component.hours ?? 0}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`salary-component-rate-${index}`}>
                        Rate
                      </FieldLabel>
                      <Input
                        disabled={disabled}
                        id={`salary-component-rate-${index}`}
                        min="0"
                        onChange={(event) =>
                          updateComponent(index, {
                            hourlyRate: numberValue(event.target.value),
                          })
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
                          updateComponent(index, {
                            multiplier: numberValue(event.target.value),
                          })
                        }
                        step="0.01"
                        type="number"
                        value={component.multiplier ?? 1}
                      />
                    </Field>
                  </>
                ) : null}
              </FieldGroup>
            </CardContent>
          </Card>
        );
      })}

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
          <Dialog>
            <DialogTrigger asChild>
              <Button
                disabled={currency !== "PHP"}
                size="sm"
                type="button"
                variant="outline"
              >
                <Landmark data-icon="inline-start" />
                Add government contribution
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Philippine government contributions</DialogTitle>
                <DialogDescription>
                  Select private-sector employee deductions to estimate from the
                  salary bases. Existing presets cannot be duplicated.
                </DialogDescription>
              </DialogHeader>
              <FieldGroup>
                {philippineContributionCodes.map((code) => {
                  const rule = PHILIPPINE_CONTRIBUTION_SOURCES[code];
                  const checked = governmentComponents.some(
                    (component) => component.governmentPresetCode === code,
                  );
                  return (
                    <Field key={code} orientation="horizontal">
                      <Checkbox
                        checked={checked}
                        id={`government-preset-${code}`}
                        onCheckedChange={(value) =>
                          toggleGovernmentPreset(code, value === true)
                        }
                      />
                      <FieldContent>
                        <FieldLabel htmlFor={`government-preset-${code}`}>
                          <FieldTitle>{rule.shortLabel}</FieldTitle>
                        </FieldLabel>
                        <FieldDescription>{rule.label}</FieldDescription>
                      </FieldContent>
                    </Field>
                  );
                })}
              </FieldGroup>
              <DialogFooter>
                <p className="text-xs text-muted-foreground">
                  Presets stay editable after they are added.
                </p>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      ) : null}

      {governmentComponents.length ? (
        <Alert>
          <Landmark />
          <AlertTitle>Estimated government contributions</AlertTitle>
          <AlertDescription>
            Compare these estimates with your employer&apos;s payslip. They are
            planning aids, not payroll, tax, or legal advice.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
