import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export function AddItemPage() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);

    try {
      await api.createItem(description);
      navigate("/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The item could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="panel form-panel">
        <div className="panel-header compact">
          <div>
            <p className="eyebrow">Create</p>
            <h2>New item</h2>
          </div>
        </div>

        <form className="item-form" onSubmit={onSubmit}>
          <label>
            Description
            <textarea
              autoFocus
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the item"
              required
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add item"}
            </button>
            <button type="button" className="secondary-button" onClick={() => navigate("/")}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
