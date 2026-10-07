import { Link, Route, Routes } from "react-router-dom";
import { AddItemPage } from "./components/AddItemPage";
import { HomePage } from "./components/HomePage";

export function App() {
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <p className="eyebrow">Simple collection</p>
            <h1>Items</h1>
          </div>
          <nav className="app-nav" aria-label="Main navigation">
            <Link className="app-nav-link" to="/">
              Home
            </Link>
            <Link className="app-nav-link" to="/new">
              Add Item
            </Link>
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/new" element={<AddItemPage />} />
      </Routes>
    </>
  );
}
