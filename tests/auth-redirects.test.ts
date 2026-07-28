import { describe, expect, it } from "vitest";
import { getSafeNextPath } from "../lib/auth/redirects";
describe("OAuth redirect paths", () => { it("allows internal destinations", () => expect(getSafeNextPath("/dashboard")).toBe("/dashboard")); it("rejects external and malformed destinations", () => { expect(getSafeNextPath("https://bad.example")).toBe("/dashboard"); expect(getSafeNextPath("//bad.example")).toBe("/dashboard"); expect(getSafeNextPath("/\\bad")).toBe("/dashboard"); }); });
