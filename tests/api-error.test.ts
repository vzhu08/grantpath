import { describe,it,expect } from "vitest";
import { apiErrorMessage } from "../lib/api-error";
describe("browser API error messages",()=>{
  it.each(["Live AI is disabled. Manual drafting remains available.","Saved inputs changed. Reload and reconcile before retrying.","The export renderer is unavailable. DOCX remains available."])("preserves structured actionable guidance",message=>{expect(apiErrorMessage({code:"ACTION_REQUIRED",message,requestId:"synthetic"},"Save failed.")).toBe(message);});
  it("keeps legacy string guidance",()=>expect(apiErrorMessage("  Generation failed; edit manually.  ","Fallback")).toBe("Generation failed; edit manually."));
  it.each([undefined,null,{},[],{message:42},{message:" "},""])("uses a meaningful fallback for malformed or empty errors",error=>expect(apiErrorMessage(error,"Could not save; your text is preserved.")).toBe("Could not save; your text is preserved."));
});
