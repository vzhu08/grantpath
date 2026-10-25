import { z } from "zod";
import { createHash } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PDFDocument, PDFArray, PDFDict, PDFName } from "pdf-lib";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  LineRuleType,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import { KitError } from "../../packages/runtime/src/index";

import {
  ProposalDocumentSchema,
  visibleText,
  type ProposalDocument,
} from "./blocks";
export {
  ProposalBlockSchema,
  ProposalDocumentSchema,
  visibleText,
  type ProposalBlock,
  type ProposalDocument,
} from "./blocks";
export const RENDER_PROFILE = {
  id: "nsf-letter-times-12-v1",
  pageWidth: 12240,
  pageHeight: 15840,
  margin: 1440,
  font: "Times New Roman",
  fontHalfPoints: 24,
  lineTwips: 280,
  docxVersion: "9.14.0",
  rendererVersion: "grantpath-docx-lo-1",
} as const;
const digest = (data: Uint8Array | string) =>
  createHash("sha256").update(data).digest("hex");
function paragraph(
  text: string,
  extra: ConstructorParameters<typeof Paragraph>[0] = {},
) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: RENDER_PROFILE.font,
        size: 24,
        color: "000000",
      }),
    ],
    spacing: { line: 280, lineRule: LineRuleType.AT_LEAST, after: 120 },
    wordWrap: true,
    ...(typeof extra === "object" ? extra : {}),
  });
}
export async function createProposalDocx(input: unknown) {
  const document = ProposalDocumentSchema.parse(input);
  const borders = Object.fromEntries(
    [
      "top",
      "bottom",
      "left",
      "right",
      "insideHorizontal",
      "insideVertical",
    ].map((side) => [
      side,
      { style: BorderStyle.SINGLE, size: 4, color: "D9D9D9" },
    ]),
  );
  const children = document.blocks.flatMap((block) => {
    if (block.type === "paragraph") return [paragraph(block.text)];
    if (block.type === "heading")
      return [
        new Paragraph({
          heading: [
            HeadingLevel.HEADING_1,
            HeadingLevel.HEADING_2,
            HeadingLevel.HEADING_3,
          ][block.level - 1],
          children: [
            new TextRun({
              text: block.text,
              bold: true,
              font: RENDER_PROFILE.font,
              size: 24,
              color: "000000",
            }),
          ],
          keepNext: true,
          spacing: {
            before: 180,
            after: 120,
            line: 280,
            lineRule: LineRuleType.AT_LEAST,
          },
        }),
      ];
    if (block.type === "list")
      return block.items.map((item) =>
        paragraph(item, {
          numbering: {
            reference: block.ordered ? "ordered" : "bullet",
            instance: document.blocks.indexOf(block) + 1,
            level: 0,
          },
        }),
      );
    const width = Math.floor(9360 / block.headers.length);
    const row = (cells: string[], header: boolean) =>
      new TableRow({
        tableHeader: header,
        cantSplit: true,
        children: cells.map(
          (text) =>
            new TableCell({
              width: { size: width, type: WidthType.DXA },
              margins: { top: 100, bottom: 100, left: 120, right: 120 },
              verticalAlign: VerticalAlign.CENTER,
              shading: header ? { fill: "EAEAEA" } : undefined,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text,
                      bold: header,
                      font: RENDER_PROFILE.font,
                      size: 24,
                      color: "000000",
                    }),
                  ],
                  spacing: {
                    line: 280,
                    lineRule: LineRuleType.AT_LEAST,
                    after: 0,
                  },
                  wordWrap: true,
                }),
              ],
            }),
        ),
      });
    return [
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: block.headers.map(() => width),
        layout: TableLayoutType.FIXED,
        borders,
        rows: [
          row(block.headers, true),
          ...block.rows.map((cells) => row(cells, false)),
        ],
      }),
      paragraph(""),
    ];
  });
  const doc = new Document({
    creator: "GrantPath",
    lastModifiedBy: "GrantPath",
    title: "Research proposal narrative",
    description: "Draft narrative; researcher review required.",
    styles: {
      default: {
        document: {
          run: { font: RENDER_PROFILE.font, size: 24, color: "000000" },
          paragraph: {
            spacing: { line: 280, lineRule: LineRuleType.AT_LEAST, after: 120 },
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "bullet",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                run: { font: RENDER_PROFILE.font, size: 24 },
                paragraph: { indent: { left: 360, hanging: 180 } },
              },
            },
          ],
        },
        {
          reference: "ordered",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                run: { font: RENDER_PROFILE.font, size: 24 },
                paragraph: { indent: { left: 360, hanging: 180 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });
  const bytes = await Packer.toBuffer(doc);
  if (bytes.length > 25_000_000)
    throw new KitError(
      "ARTIFACT_LIMIT",
      "The DOCX exceeds the 25 MB artifact bound.",
      413,
    );
  return bytes;
}
type RendererConfig = {
  executable: string;
  fontFiles: string[];
  outputRoot: string;
  timeoutMs?: number;
};
function configuredRenderer(): RendererConfig {
  const executable = process.env.GRANTPATH_LIBREOFFICE_PATH?.trim();
  const fontDirectory =
    process.env.GRANTPATH_FONT_DIR?.trim() ||
    (process.platform === "win32" ? "C:\\Windows\\Fonts" : "");
  if (!executable || !path.isAbsolute(executable))
    throw new KitError(
      "RENDERER_UNAVAILABLE",
      "Set GRANTPATH_LIBREOFFICE_PATH to the absolute LibreOffice executable. PDF/page measurement is unavailable; no substitute renderer is used.",
      503,
    );
  if (!fontDirectory)
    throw new KitError(
      "FONT_UNAVAILABLE",
      "Configure GRANTPATH_FONT_DIR with actual Times New Roman fonts. Silent substitution is disabled.",
      503,
    );
  return {
    executable,
    fontFiles: ["times.ttf", "timesbd.ttf", "timesi.ttf", "timesbi.ttf"].map(
      (file) => path.join(fontDirectory, file),
    ),
    outputRoot: path.resolve(
      process.env.GRANTPATH_EXPORT_DIR ?? ".local-data/exports",
    ),
    timeoutMs: 60_000,
  };
}
function cancellation() {
  return new KitError(
    "EXPORT_CANCELLED",
    "Export cancelled. Any created DOCX and input snapshot are preserved; page measurement stays Unknown.",
    408,
  );
}
function checkCancellation(signal?: AbortSignal) {
  if (signal?.aborted) throw cancellation();
}
export async function runRendererProcess(
  executable: string,
  args: string[],
  timeoutMs: number,
  signal?: AbortSignal,
) {
  checkCancellation(signal);
  return await new Promise<string>((resolve, reject) => {
    const child = spawn(executable, args, {
      windowsHide: true,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "",
      bytes = 0,
      settled = false,
      failure: KitError | null = null,
      termination: Promise<void> | null = null;
    const terminate = (reason: KitError) => {
      if (failure) return;
      failure = reason;
      termination = new Promise<void>((done) => {
        if (!child.pid) {
          done();
          return;
        }
        if (process.platform === "win32")
          execFile(
            "taskkill.exe",
            ["/PID", String(child.pid), "/T", "/F"],
            { windowsHide: true, timeout: 5000, maxBuffer: 1024 },
            () => {
              child.kill();
              done();
            },
          );
        else {
          try {
            process.kill(-child.pid, "SIGKILL");
          } catch {
            child.kill("SIGKILL");
          }
          done();
        }
      });
    };
    const timer = setTimeout(
      () =>
        terminate(
          new KitError(
            "CONVERSION_TIMEOUT",
            "LibreOffice exceeded its conversion deadline. The process tree was stopped; DOCX and input are preserved and page count is Unknown.",
            408,
          ),
        ),
      timeoutMs,
    );
    const abort = () => terminate(cancellation());
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    };
    child.stdout.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 16384)
        terminate(
          new KitError(
            "RENDERER_OUTPUT_LIMIT",
            "Renderer diagnostic output exceeded its bound; page measurement stays Unknown.",
            502,
          ),
        );
      else output += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > 16384)
        terminate(
          new KitError(
            "RENDERER_OUTPUT_LIMIT",
            "Renderer diagnostic output exceeded its bound; page measurement stays Unknown.",
            502,
          ),
        );
    });
    child.once("error", () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(
        new KitError(
          "CONVERSION_FAILED",
          "The configured renderer could not start. DOCX/input are preserved and page count is Unknown.",
          502,
        ),
      );
    });
    child.once("close", async (code) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (termination) await termination;
      if (failure) reject(failure);
      else if (code !== 0)
        reject(
          new KitError(
            "CONVERSION_FAILED",
            "LibreOffice conversion failed. DOCX/input are preserved and page count is Unknown.",
            502,
          ),
        );
      else resolve(output.trim());
    });
  });
}
export async function rendererIdentity(
  config = configuredRenderer(),
  signal?: AbortSignal,
) {
  checkCancellation(signal);
  try {
    await access(config.executable);
    await Promise.all(config.fontFiles.map((file) => access(file)));
  } catch {
    throw new KitError(
      "RENDERER_UNAVAILABLE",
      "The configured LibreOffice executable or required Times New Roman font file is unavailable. PDF/page measurement stays Unknown.",
      503,
    );
  }
  checkCancellation(signal);
  const fonts = await Promise.all(
    config.fontFiles.map(async (file) => ({
      name: path.basename(file),
      sha256: digest(await readFile(file)),
    })),
  );
  checkCancellation(signal);
  const version = await runRendererProcess(
    config.executable,
    ["--version"],
    15000,
    signal,
  );
  checkCancellation(signal);
  return { profile: RENDER_PROFILE, libreOffice: version, fonts };
}
export function validatePdfFonts(pdf: PDFDocument, hasVisibleText = true) {
  const names = new Set<string>();
  for (const page of pdf.getPages()) {
    const resources = page.node.Resources();
    const fonts = resources?.lookupMaybe(PDFName.of("Font"), PDFDict);
    for (const [, ref] of fonts?.entries() ?? []) {
      const font = pdf.context.lookup(ref, PDFDict);
      const descendants = font.lookupMaybe(
        PDFName.of("DescendantFonts"),
        PDFArray,
      );
      const actual = descendants?.lookup(0, PDFDict) ?? font;
      const base =
        font.lookupMaybe(PDFName.of("BaseFont"), PDFName)?.decodeText() ?? "";
      const descriptor = actual.lookupMaybe(
        PDFName.of("FontDescriptor"),
        PDFDict,
      );
      if (
        !/^(?:[A-Z]{6}\+)?TimesNewRoman/.test(base) ||
        !descriptor ||
        !["FontFile", "FontFile2", "FontFile3"].some((key) =>
          descriptor.has(PDFName.of(key)),
        )
      )
        throw new KitError(
          "FONT_SUBSTITUTION",
          "The PDF does not use embedded Times New Roman throughout. No page-limit pass is recorded; install the required font and retry.",
          422,
        );
      names.add(base);
    }
  }
  if (hasVisibleText && !names.size)
    throw new KitError(
      "FONT_UNVERIFIED",
      "PDF fonts could not be verified. Page measurement stays Unknown.",
      422,
    );
  return [...names].sort();
}
export type RenderResult = {
  status: "succeeded" | "failed";
  jobId: string;
  directory: string;
  docxPath: string;
  pdfPath: string | null;
  pages: number | null;
  pageLimit: number | null;
  withinPageLimit: boolean | null;
  docxSha256: string;
  pdfSha256: string | null;
  inputSha256: string;
  renderer: Awaited<ReturnType<typeof rendererIdentity>> | null;
  pdfFonts: string[];
  error: string | null;
};
export async function renderProposal(
  input: unknown,
  options: {
    pageLimit?: number;
    signal?: AbortSignal;
    config?: RendererConfig;
  } = {},
): Promise<RenderResult> {
  const document = ProposalDocumentSchema.parse(input);
  if (
    options.pageLimit !== undefined &&
    !z.number().int().min(1).max(1000).safeParse(options.pageLimit).success
  )
    throw new KitError("PAGE_LIMIT", "Use a positive integer page limit.", 400);
  checkCancellation(options.signal);
  const config = options.config ?? configuredRenderer();
  await mkdir(config.outputRoot, { recursive: true, mode: 0o700 });
  const directory = await mkdtemp(
    path.join(path.resolve(config.outputRoot), "render-"),
  );
  const jobId = path.basename(directory),
    docxPath = path.join(directory, "narrative.docx"),
    pdfPath = path.join(directory, "narrative.pdf");
  const bytes = await createProposalDocx(document);
  await writeFile(docxPath, bytes, { mode: 0o600 });
  await writeFile(
    path.join(directory, "input.json"),
    JSON.stringify(document),
    { mode: 0o600 },
  );
  const initial: RenderResult = {
    status: "failed",
    jobId,
    directory,
    docxPath,
    pdfPath: null,
    pages: null,
    pageLimit: options.pageLimit ?? null,
    withinPageLimit: null,
    docxSha256: digest(bytes),
    pdfSha256: null,
    inputSha256: digest(JSON.stringify(document)),
    renderer: null,
    pdfFonts: [],
    error: null,
  };
  try {
    checkCancellation(options.signal);
    if (process.platform === "win32" && directory.length > 150)
      throw new KitError(
        "RENDER_PATH_LENGTH",
        "LibreOffice needs a shorter private export directory on Windows. Set GRANTPATH_EXPORT_DIR to a short workspace path and retry; DOCX is preserved and pages stay Unknown.",
        503,
      );
    initial.renderer = await rendererIdentity(config, options.signal);
    checkCancellation(options.signal);
    const profile = pathToFileURL(path.join(directory, "lo-profile")).href;
    await runRendererProcess(
      config.executable,
      [
        `-env:UserInstallation=${profile}`,
        "--headless",
        "--norestore",
        "--nodefault",
        "--nofirststartwizard",
        "--convert-to",
        "pdf:writer_pdf_Export",
        "--outdir",
        directory,
        docxPath,
      ],
      config.timeoutMs ?? 60_000,
      options.signal,
    );
    checkCancellation(options.signal);
    const metadata = await stat(pdfPath);
    if (metadata.size < 100 || metadata.size > 25_000_000)
      throw new Error("PDF outside artifact size bounds.");
    const pdf = await readFile(pdfPath),
      parsed = await PDFDocument.load(pdf);
    checkCancellation(options.signal);
    const pdfFonts = validatePdfFonts(parsed, !!visibleText(document).trim()),
      pages = parsed.getPageCount();
    checkCancellation(options.signal);
    const result: RenderResult = {
      ...initial,
      status: "succeeded",
      pdfPath,
      pages,
      pdfFonts,
      withinPageLimit:
        options.pageLimit === undefined ? null : pages <= options.pageLimit,
      pdfSha256: digest(pdf),
    };
    await writeFile(
      path.join(directory, "render-result.json"),
      JSON.stringify(result, null, 2),
      { mode: 0o600 },
    );
    if (options.signal?.aborted) throw cancellation();
    return result;
  } catch (error) {
    const result: RenderResult = {
      ...initial,
      error:
        error instanceof KitError
          ? error.message
          : "PDF conversion or validation failed. The exact DOCX and input snapshot were preserved; page count remains Unknown.",
    };
    await writeFile(
      path.join(directory, "render-result.json"),
      JSON.stringify(result, null, 2),
      { mode: 0o600 },
    );
    return result;
  }
}
