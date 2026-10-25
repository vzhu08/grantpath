"use client";
import { useState } from "react";
import { type ProposalBlock } from "../lib/proposals/blocks";
import { Field } from "./common";

export function BlockPreview({ blocks }: { blocks: ProposalBlock[] }) {
  return (
    <div aria-label="Structured content preview">
      {blocks.map((block, index) => {
        if (block.type === "paragraph")
          return (
            <p
              key={index}
              style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
            >
              {block.text || "[Empty paragraph]"}
            </p>
          );
        if (block.type === "heading")
          return block.level === 1 ? (
            <h3 key={index}>{block.text}</h3>
          ) : block.level === 2 ? (
            <h4 key={index}>{block.text}</h4>
          ) : (
            <h5 key={index}>{block.text}</h5>
          );
        if (block.type === "list")
          return block.ordered ? (
            <ol key={index}>
              {block.items.map((text, item) => (
                <li key={item}>{text}</li>
              ))}
            </ol>
          ) : (
            <ul key={index}>
              {block.items.map((text, item) => (
                <li key={item}>{text}</li>
              ))}
            </ul>
          );
        return (
          <div key={index} style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {block.headers.map((text, cell) => (
                    <th
                      key={cell}
                      scope="col"
                      style={{
                        padding: 8,
                        border: "1px solid #dfe5dd",
                        textAlign: "left",
                      }}
                    >
                      {text}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((text, c) => (
                      <td
                        key={c}
                        style={{
                          padding: 8,
                          border: "1px solid #dfe5dd",
                          overflowWrap: "anywhere",
                        }}
                      >
                        {text}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export function ProposalBlockEditor({
  blocks,
  onChange,
  disabled = false,
}: {
  blocks: ProposalBlock[];
  onChange: (blocks: ProposalBlock[]) => void;
  disabled?: boolean;
}) {
  const [newType, setNewType] = useState<ProposalBlock["type"]>("paragraph");
  function update(index: number, block: ProposalBlock) {
    onChange(blocks.map((previous, i) => (i === index ? block : previous)));
  }
  function move(index: number, direction: number) {
    const copy = [...blocks],
      next = index + direction;
    [copy[index], copy[next]] = [copy[next]!, copy[index]!];
    onChange(copy);
  }
  function add() {
    const block: ProposalBlock =
      newType === "paragraph"
        ? { type: "paragraph", text: "" }
        : newType === "heading"
          ? { type: "heading", level: 2, text: "" }
          : newType === "list"
            ? { type: "list", ordered: false, items: [""] }
            : {
                type: "table",
                headers: ["Column 1", "Column 2"],
                rows: [["", ""]],
              };
    onChange([...blocks, block]);
  }
  return (
    <fieldset
      disabled={disabled}
      style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
    >
      <div className="form-stack">
        {blocks.map((block, index) => (
          <section
            className="criterion"
            key={index}
            aria-label={`Content block ${index + 1}`}
          >
            <div className="row spread">
              <strong>
                {index + 1}.{" "}
                {block.type === "list"
                  ? block.ordered
                    ? "Numbered list"
                    : "Bullet list"
                  : block.type}
              </strong>
              <div className="row">
                <button
                  type="button"
                  disabled={index === 0}
                  aria-label={`Move block ${index + 1} up`}
                  onClick={() => move(index, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === blocks.length - 1}
                  aria-label={`Move block ${index + 1} down`}
                  onClick={() => move(index, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      blocks.length > 1
                        ? blocks.filter((_, i) => i !== index)
                        : [{ type: "paragraph", text: "" }],
                    )
                  }
                >
                  Remove block
                </button>
              </div>
            </div>
            {(block.type === "paragraph" || block.type === "heading") && (
              <Field
                label={`${block.type === "heading" ? "Heading" : "Paragraph"} text ${index + 1}`}
              >
                <textarea
                  rows={block.type === "heading" ? 2 : 5}
                  value={block.text}
                  maxLength={20_000}
                  onChange={(e) =>
                    update(index, { ...block, text: e.target.value })
                  }
                />
              </Field>
            )}
            {block.type === "heading" && (
              <Field label={`Heading level ${index + 1}`}>
                <select
                  value={block.level}
                  onChange={(e) =>
                    update(index, {
                      ...block,
                      level: Number(e.target.value) as 1 | 2 | 3,
                    })
                  }
                >
                  <option value="1">Heading 1</option>
                  <option value="2">Heading 2</option>
                  <option value="3">Heading 3</option>
                </select>
              </Field>
            )}
            {block.type === "list" && (
              <>
                <Field label={`List style ${index + 1}`}>
                  <select
                    value={block.ordered ? "numbered" : "bullets"}
                    onChange={(e) =>
                      update(index, {
                        ...block,
                        ordered: e.target.value === "numbered",
                      })
                    }
                  >
                    <option value="bullets">Bullets</option>
                    <option value="numbered">Numbered, starting at 1</option>
                  </select>
                </Field>
                <Field
                  label={`List items ${index + 1}`}
                  hint="One nonempty item per line."
                >
                  <textarea
                    rows={Math.min(8, Math.max(3, block.items.length))}
                    value={block.items.join("\n")}
                    onChange={(e) =>
                      update(index, {
                        ...block,
                        items: e.target.value.split("\n"),
                      })
                    }
                  />
                </Field>
              </>
            )}
            {block.type === "table" && (
              <div className="form-stack">
                <p className="muted">
                  Simple rectangular table. Long text wraps; the renderer
                  measures the resulting pages.
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {block.headers.map((header, c) => (
                          <th scope="col" key={c}>
                            <Field
                              label={`Table ${index + 1} column ${c + 1} heading`}
                            >
                              <input
                                value={header}
                                maxLength={2000}
                                onChange={(e) =>
                                  update(index, {
                                    ...block,
                                    headers: block.headers.map(
                                      (value, column) =>
                                        column === c ? e.target.value : value,
                                    ),
                                  })
                                }
                              />
                            </Field>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, r) => (
                        <tr key={r}>
                          {row.map((cell, c) => (
                            <td key={c}>
                              <Field
                                label={`Table ${index + 1} row ${r + 1} column ${c + 1}`}
                              >
                                <textarea
                                  rows={2}
                                  maxLength={2000}
                                  value={cell}
                                  onChange={(e) =>
                                    update(index, {
                                      ...block,
                                      rows: block.rows.map((previous, ri) =>
                                        ri === r
                                          ? previous.map((value, ci) =>
                                              ci === c ? e.target.value : value,
                                            )
                                          : previous,
                                      ),
                                    })
                                  }
                                />
                              </Field>
                            </td>
                          ))}
                          <td>
                            <button
                              type="button"
                              aria-label={`Remove table ${index + 1} row ${r + 1}`}
                              onClick={() =>
                                update(index, {
                                  ...block,
                                  rows: block.rows.filter((_, ri) => ri !== r),
                                })
                              }
                            >
                              − row
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="row">
                  <button
                    type="button"
                    disabled={block.rows.length >= 200}
                    onClick={() =>
                      update(index, {
                        ...block,
                        rows: [...block.rows, block.headers.map(() => "")],
                      })
                    }
                  >
                    Add row
                  </button>
                  <button
                    type="button"
                    disabled={block.headers.length >= 12}
                    onClick={() =>
                      update(index, {
                        ...block,
                        headers: [
                          ...block.headers,
                          `Column ${block.headers.length + 1}`,
                        ],
                        rows: block.rows.map((row) => [...row, ""]),
                      })
                    }
                  >
                    Add column
                  </button>
                  <button
                    type="button"
                    disabled={block.headers.length <= 1}
                    onClick={() =>
                      update(index, {
                        ...block,
                        headers: block.headers.slice(0, -1),
                        rows: block.rows.map((row) => row.slice(0, -1)),
                      })
                    }
                  >
                    Remove last column
                  </button>
                </div>
              </div>
            )}
          </section>
        ))}
        <div className="row">
          <Field label="Content to add">
            <select
              value={newType}
              onChange={(e) =>
                setNewType(e.target.value as ProposalBlock["type"])
              }
            >
              <option value="paragraph">Paragraph</option>
              <option value="heading">Heading</option>
              <option value="list">List</option>
              <option value="table">Simple table</option>
            </select>
          </Field>
          <button type="button" disabled={blocks.length >= 1000} onClick={add}>
            Add content block
          </button>
        </div>
      </div>
    </fieldset>
  );
}
