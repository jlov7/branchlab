import { createElement } from "react";
import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Field, Input } from "@/components/ui";

describe("ui primitives", () => {
  test("button variants include expected classes", () => {
    const html = renderToStaticMarkup(createElement(Button, { variant: "primary" }, "Save"));
    expect(html).toContain("ui-button");
    expect(html).toContain("ui-button-primary");
  });

  test("field renders label and child control", () => {
    const html = renderToStaticMarkup(
      createElement(
        Field,
        { label: "Run id" },
        createElement(Input, { value: "run_1", readOnly: true }),
      ),
    );
    expect(html).toContain("Run id");
    expect(html).toContain("ui-field");
    expect(html).toContain("ui-input");
  });
});
