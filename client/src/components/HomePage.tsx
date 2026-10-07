import { useEffect, useState } from "react";
import { api, type Item } from "../api";

export function HomePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadItems() {
    try {
      setItems(await api.listItems());
      setError(null);
    } catch {
      setError("Unable to load items.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function saveItem(id: number) {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateItem(id, description);
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      setEditingId(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to update the item.");
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: number) {
    setError(null);
    try {
      await api.deleteItem(id);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch {
      setError("Unable to delete the item.");
    }
  }

  return (
    <main className="page-shell">
      <section className="panel dashboard-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Items</p>
            <h2>All items</h2>
          </div>
        </div>

        {error ? <p className="empty-state error-text">{error}</p> : null}
        {loading ? (
          <p className="empty-state">Loading items...</p>
        ) : items.length === 0 ? (
          <p className="empty-state">No items yet. Create one to get started.</p>
        ) : (
          <div className="item-list" role="list">
            {items.map((item) => (
              <article key={item.id} className="item-card" role="listitem">
                {editingId === item.id ? (
                  <form
                    className="item-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void saveItem(item.id);
                    }}
                  >
                    <label>
                      Description
                      <textarea
                        autoFocus
                        rows={3}
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        required
                      />
                    </label>
                    <div className="item-actions">
                      <button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="item-description">{item.description}</p>
                    <div className="item-footer">
                      <span className="item-meta">
                        Added {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <div className="item-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {
                            setDescription(item.description);
                            setEditingId(item.id);
                            setError(null);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger-button"
                          onClick={() => void removeItem(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
