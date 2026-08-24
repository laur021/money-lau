import Image from "next/image";
import { Landmark, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

export type PhilippineInstitution = {
  name: string;
  type: "bank" | "e_wallet";
};

export const PHILIPPINE_INSTITUTIONS: readonly PhilippineInstitution[] = [
  { name: "MariBank Philippines", type: "bank" },
  { name: "GoTyme Bank", type: "bank" },
  { name: "UnionBank of the Philippines", type: "bank" },
  { name: "BDO Unibank", type: "bank" },
  { name: "Bank of the Philippine Islands", type: "bank" },
  { name: "GCash", type: "e_wallet" },
  { name: "Maya", type: "e_wallet" },
] as const;

const institutionLogos = [
  { matches: ["maribank", "seabank"], src: "/institutions/maribank.png" },
  { matches: ["gotyme"], src: "/institutions/gotyme.svg" },
  { matches: ["unionbank", "union bank"], src: "/institutions/unionbank.svg" },
  { matches: ["gcash", "g-xchange"], src: "/institutions/gcash.svg" },
  { matches: ["maya", "paymaya"], src: "/institutions/maya.svg" },
  { matches: ["bdo", "banco de oro"], src: "/institutions/bdo.svg" },
  { matches: ["bpi", "bank of the philippine islands"], src: "/institutions/bpi.svg" },
] as const;

function logoForInstitution(institutionName: string | null | undefined) {
  const normalizedName = institutionName?.toLowerCase().trim() ?? "";
  return institutionLogos.find(({ matches }) =>
    matches.some((name) => normalizedName.includes(name)),
  );
}

export function InstitutionLogo({
  accountType,
  institutionName,
  className,
}: {
  accountType: string;
  institutionName?: string | null;
  className?: string;
}) {
  const logo = logoForInstitution(institutionName);
  const FallbackIcon = accountType === "e_wallet" ? WalletCards : Landmark;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-md border bg-background p-1.5",
        className,
      )}
    >
      {logo ? (
        <Image alt="" className="max-h-full max-w-full object-contain" height={28} src={logo.src} width={40} />
      ) : (
        <FallbackIcon />
      )}
    </span>
  );
}
