import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import ts from "typescript";
const source = ts.transpileModule(
  await fs.readFile("src/admin/utils/commerce-time.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const { commerceSlotRange } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const expected = (instant, zone) =>
  new Intl.DateTimeFormat("en-JM", {
    timeZone: zone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(instant));

test("slot times use the recorded timezone rather than the staff browser default", () => {
  const previous = process.env.TZ;
  const start = "2026-10-29T18:00:00Z",
    end = "2026-10-29T20:00:00Z";
  try {
    const outputs = [];
    for (const zone of ["UTC", "Asia/Tokyo", "America/Los_Angeles"]) {
      process.env.TZ = zone;
      outputs.push(commerceSlotRange(start, end, "America/Jamaica"));
    }
    assert.equal(new Set(outputs).size, 1);
    assert.equal(
      outputs[0],
      `${expected(start, "America/Jamaica")} – ${expected(end, "America/Jamaica")} (America/Jamaica)`,
    );
    assert.notEqual(
      outputs[0],
      commerceSlotRange(start, end, "America/New_York"),
    );
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});
test("slot endpoints honor daylight-saving transitions independently", () => {
  const start = "2026-11-01T05:30:00Z",
    end = "2026-11-01T07:30:00Z";
  const result = commerceSlotRange(start, end, "America/New_York");
  assert.equal(
    result,
    `${expected(start, "America/New_York")} – ${expected(end, "America/New_York")} (America/New_York)`,
  );
  assert.equal(new Date(end) - new Date(start), 2 * 60 * 60 * 1000);
  assert.match(result, /1:30/);
  assert.match(result, /2:30/);
});
test("missing or invalid schedule data never silently falls back to the browser timezone", () => {
  const date = "2026-10-29T18:00:00Z";
  for (const args of [
    [date, date, ""],
    [null, date, "UTC"],
    [date, null, "UTC"],
    [date, date, "Invalid/Zone"],
    ["bad", date, "UTC"],
    [date, "bad", "UTC"],
  ]) {
    assert.equal(commerceSlotRange(...args), "Schedule unavailable");
  }
});
