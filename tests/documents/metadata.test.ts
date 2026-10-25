import { describe,it,expect } from "vitest";
import { POST } from "../../app/api/documents/route";
describe("upload metadata input failures",()=>{
  it.each([Buffer.from("{"),Buffer.from([0xff,0xfe,0xfd]),Buffer.from('{"unfinished":')])("returns a useful400 for invalid UTF8/JSON before touching storage",async bytes=>{
    const response=await POST(new Request("http://127.0.0.1:3103/api/documents",{method:"POST",headers:{origin:"http://127.0.0.1:3103",host:"127.0.0.1:3103","content-type":"application/octet-stream","x-upload-metadata":bytes.toString("base64url")},body:"x"}));
    expect(response.status).toBe(400);const result=await response.json();expect(result.error.code).toBe("METADATA");expect(result.error.message).toBe("Upload metadata must be valid UTF-8 JSON.");expect(response.headers.get("cache-control")).toBe("no-store");
  });
});
