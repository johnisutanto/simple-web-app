import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, type Item } from "../api";
import { AddItemPage } from "./AddItemPage";
import { HomePage } from "./HomePage";

vi.mock("../api", () => ({
  api: {
    listItems: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
  },
}));

const item: Item = {
  id: 1,
  description: "Buy milk",
  createdAt: "2026-10-01T12:00:00.000Z",
  updatedAt: "2026-10-01T12:00:00.000Z",
};

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

describe("AddItemPage", () => {
  beforeEach(() => {
    vi.mocked(api.createItem).mockResolvedValue(item);
  });

  it("creates an item and navigates to the list", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/new"]}>
        <AddItemPage />
        <CurrentPath />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole("textbox", { name: "Description" }), "Buy milk");
    await user.click(screen.getByRole("button", { name: "Add item" }));

    await waitFor(() => {
      expect(api.createItem).toHaveBeenCalledWith("Buy milk");
      expect(screen.getByLabelText("Current path")).toHaveTextContent("/");
    });
  });

  it("shows the API error when creating an item fails", async () => {
    const user = userEvent.setup();
    vi.mocked(api.createItem).mockRejectedValue(new Error("Description is required"));
    render(
      <MemoryRouter>
        <AddItemPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByRole("textbox", { name: "Description" }), "Buy milk");
    await user.click(screen.getByRole("button", { name: "Add item" }));

    expect(await screen.findByText("Description is required")).toBeInTheDocument();
  });
});

describe("HomePage", () => {
  beforeEach(() => {
    vi.mocked(api.listItems).mockResolvedValue([item]);
    vi.mocked(api.updateItem).mockImplementation(async (id, description) => ({
      ...item,
      id,
      description,
    }));
    vi.mocked(api.deleteItem).mockResolvedValue();
  });

  it("lists items returned by the API", async () => {
    render(<HomePage />);

    expect(await screen.findByText("Buy milk")).toBeInTheDocument();
    expect(api.listItems).toHaveBeenCalledOnce();
  });

  it("shows an empty state when there are no items", async () => {
    vi.mocked(api.listItems).mockResolvedValue([]);
    render(<HomePage />);

    expect(await screen.findByText("No items yet. Create one to get started.")).toBeInTheDocument();
  });

  it("edits an item", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(await screen.findByRole("button", { name: "Edit" }));
    const description = screen.getByRole("textbox", { name: "Description" });
    await user.clear(description);
    await user.type(description, "Buy oat milk");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(api.updateItem).toHaveBeenCalledWith(item.id, "Buy oat milk");
    expect(await screen.findByText("Buy oat milk")).toBeInTheDocument();
  });

  it("deletes an item", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    expect(await screen.findByText("Buy milk")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(api.deleteItem).toHaveBeenCalledWith(item.id);
      expect(screen.queryByText("Buy milk")).not.toBeInTheDocument();
    });
  });

  it("shows a load error when the API cannot list items", async () => {
    vi.mocked(api.listItems).mockRejectedValue(new Error("Network error"));
    render(<HomePage />);

    expect(await screen.findByText("Unable to load items.")).toBeInTheDocument();
  });
});
