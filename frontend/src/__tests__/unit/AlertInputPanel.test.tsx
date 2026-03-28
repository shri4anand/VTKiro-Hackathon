import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { AlertInputPanel } from "../../components/AlertInputPanel";

function setup(props?: Partial<Parameters<typeof AlertInputPanel>[0]>) {
  const defaults = {
    inputText: "",
    onChange: vi.fn(),
    onSubmit: vi.fn(),
    isLoading: false,
  };
  const merged = { ...defaults, ...props };
  render(<AlertInputPanel {...merged} />);
  return merged;
}

describe("AlertInputPanel", () => {
  it("renders textarea with correct aria-label", () => {
    setup();
    expect(screen.getByRole("textbox", { name: "Alert text input" })).toBeInTheDocument();
  });

  it("renders submit button with correct aria-label", () => {
    setup();
    expect(screen.getByRole("button", { name: "Simplify alert text" })).toBeInTheDocument();
  });

  it("shows live character counter", () => {
    setup({ inputText: "hello" });
    expect(screen.getByText("5 / 5,000 characters")).toBeInTheDocument();
  });

  it("does not show validation error before submit attempt", () => {
    setup({ inputText: "" });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows empty validation error after submit with empty text", async () => {
    const user = userEvent.setup();
    setup({ inputText: "" });
    await user.click(screen.getByRole("button", { name: "Simplify alert text" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter alert text.");
  });

  it("shows over-limit validation error after submit with too-long text", async () => {
    const user = userEvent.setup();
    setup({ inputText: "a".repeat(5001) });
    await user.click(screen.getByRole("button", { name: "Simplify alert text" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Text exceeds 5,000 character limit.");
  });

  it("disables submit button when text is over 10000 chars", () => {
    setup({ inputText: "a".repeat(10001) });
    expect(screen.getByRole("button", { name: "Simplify alert text" })).toBeDisabled();
  });

  it("disables submit button when isLoading is true", () => {
    setup({ inputText: "valid text", isLoading: true });
    expect(screen.getByRole("button", { name: "Simplify alert text" })).toBeDisabled();
  });

  it("calls onSubmit with text when valid input is submitted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    setup({ inputText: "valid alert text", onSubmit });
    await user.click(screen.getByRole("button", { name: "Simplify alert text" }));
    expect(onSubmit).toHaveBeenCalledWith("valid alert text");
  });

  it("does not call onSubmit when input is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    setup({ inputText: "", onSubmit });
    await user.click(screen.getByRole("button", { name: "Simplify alert text" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onChange when user types", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ inputText: "", onChange });
    await user.type(screen.getByRole("textbox", { name: "Alert text input" }), "x");
    expect(onChange).toHaveBeenCalled();
  });

  it("accepts exactly 10000 characters (submit enabled)", () => {
    setup({ inputText: "a".repeat(10000) });
    expect(screen.getByRole("button", { name: "Simplify alert text" })).not.toBeDisabled();
  });
});
