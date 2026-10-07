export type Item = {
  id: number;
  description: string;
  createdAt: string;
  updatedAt: string;
};

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(payload?.error?.message ?? "Request failed");
  }

  return (await response.json()) as T;
}

export const api = {
  async listItems(): Promise<Item[]> {
    return readJson<Item[]>(await fetch("/api/items"));
  },

  async createItem(description: string): Promise<Item> {
    return readJson<Item>(
      await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      }),
    );
  },

  async updateItem(id: number, description: string): Promise<Item> {
    return readJson<Item>(
      await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      }),
    );
  },

  async deleteItem(id: number): Promise<void> {
    await readJson<{ deleted: boolean }>(await fetch(`/api/items/${id}`, { method: "DELETE" }));
  },
};
