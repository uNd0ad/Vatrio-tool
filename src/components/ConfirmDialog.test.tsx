import { describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("apelează onConfirm la clic pe butonul de confirmare", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmDialog title="Ștergi 1 anunț?" confirmLabel="Șterge" onConfirm={onConfirm} onCancel={onCancel} />);
    screen.getByText("Șterge").click();
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
    cleanup();
  });

  it("apelează onCancel la Escape", () => {
    const onCancel = vi.fn();
    render(<ConfirmDialog title="Ștergi?" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledOnce();
    cleanup();
  });

  it("confirmă la Enter — nu depinde de window.confirm din webview", () => {
    const onConfirm = vi.fn();
    render(<ConfirmDialog title="Ștergi?" onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(onConfirm).toHaveBeenCalledOnce();
    cleanup();
  });
});
