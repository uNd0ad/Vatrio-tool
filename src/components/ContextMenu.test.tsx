import { describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ContextMenu } from "./ContextMenu";
import { makeListing } from "../testing/makeListing";

function renderMenu(overrides: Partial<Parameters<typeof ContextMenu>[0]> = {}) {
  const props = {
    x: 10,
    y: 10,
    listing: makeListing({ id: "target-1", title: "Apartament vizat" }),
    isStarred: false,
    onClose: vi.fn(),
    onOpenDetails: vi.fn(),
    onToggleStar: vi.fn(),
    onStatusChange: vi.fn(),
    onOpenExternal: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
  render(<ContextMenu {...props} />);
  return props;
}

describe("ContextMenu", () => {
  it("șterge exact anunțul pe care s-a dat clic dreapta", () => {
    const props = renderMenu();
    screen.getByText(/șterge/i).click();
    // Contractul care conta: id-ul vine din anunțul țintă, nu din selecția
    // curentă a tabelului. Părintele îl primește explicit tocmai pentru că
    // varianta care citea `selectedRowIds` vedea o valoare învechită.
    expect(props.onDelete).toHaveBeenCalledWith("target-1");
    cleanup();
  });

  it("închide meniul după ștergere", () => {
    const props = renderMenu();
    screen.getByText(/șterge/i).click();
    expect(props.onClose).toHaveBeenCalled();
    cleanup();
  });
});
