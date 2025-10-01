import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Photo } from "@/types";
import PhotoCard from "@/components/PhotoCard";

type FavStore = { [id: number]: Photo };

type SortKey = "idDesc" | "idAsc" | "title";

export default function Favorites() {
  const [favs, setFavs] = useLocalStorage<FavStore>("ral-favs-v1", {});
  const all = React.useMemo(() => Object.values(favs), [favs]);

  // URL-backed UI state (search + sort)
  const [params, setParams] = useSearchParams();
  const qParam = params.get("q") ?? "";
  const sortParam = (params.get("sort") as SortKey) ?? "idDesc";
  const qDebounced = useDebouncedValue(qParam, 250);

  const setParam = (key: string, val?: string) => {
    if (val) params.set(key, val);
    else params.delete(key);
    setParams(params, { replace: true });
  };

  const onChangeQ = (v: string) => setParam("q", v || undefined);
  const onChangeSort = (v: SortKey) => setParam("sort", v);

  const filtered = React.useMemo(() => {
    const q = qDebounced.trim().toLowerCase();
    const res = q
      ? all.filter((p) => p.title.toLowerCase().includes(q))
      : all.slice();

    switch (sortParam) {
      case "title":
        res.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "idAsc":
        res.sort((a, b) => a.id - b.id);
        break;
      case "idDesc":
      default:
        res.sort((a, b) => b.id - a.id); // id as proxy for recency
    }
    return res;
  }, [all, qDebounced, sortParam]);

  const removeOne = (p: Photo) =>
    setFavs((s) => {
      const n = { ...s };
      delete n[p.id];
      return n;
    });

  const clearAll = () => {
    if (!all.length) return;
    const msg =
      "Remove all favorites? This only affects your browser's saved list.";
    if (window.confirm(msg)) setFavs({});
  };

  // Export / Import
  const dlUrlRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    return () => {
      if (dlUrlRef.current) URL.revokeObjectURL(dlUrlRef.current);
    };
  }, []);

  const exportJSON = () => {
    const payload = filtered.length ? filtered : all;
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    if (dlUrlRef.current) URL.revokeObjectURL(dlUrlRef.current);
    dlUrlRef.current = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = dlUrlRef.current;
    a.download = "favorites.json";
    a.click();
  };

  const fileRef = React.useRef<HTMLInputElement>(null);
  const triggerImport = () => fileRef.current?.click();
  const onImportFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const text = await f.text();
      const arr = JSON.parse(text) as unknown;
      if (!Array.isArray(arr)) throw new Error("Invalid file format");
      const next: FavStore = { ...favs };
      for (const item of arr) {
        const p = item as Partial<Photo>;
        if (p && typeof p.id === "number" && p.url && p.thumbnailUrl && p.title) {
          next[p.id] = p as Photo;
        }
      }
      setFavs(next);
    } catch {
      alert("Import failed: invalid JSON.");
    } finally {
      e.currentTarget.value = "";
    }
  };

  const empty = all.length === 0;
  const showEmptyFiltered = !empty && filtered.length === 0;

  return (
    <>
      <header className="toolbar" role="banner">
        <nav className="nav" aria-label="Primary">
          <Link to="/" className="btn btn-ghost">
            <span className="logo-dot" aria-hidden="true" /> Gallery
          </Link>
          <span className="btn btn-ghost" aria-current="page">
            Favorites <span className="badge">{all.length}</span>
          </span>
        </nav>

        <div className="row" role="search" aria-label="Filter favorites">
          <div className="input-wrap">
            <input
              className="input"
              placeholder="Search favorites…"
              value={qParam}
              onChange={(e) => onChangeQ(e.target.value)}
              aria-label="Search favorites by title"
              inputMode="search"
              autoCorrect="off"
              spellCheck={false}
            />
            {qParam && (
              <button
                className="btn-icon"
                onClick={() => onChangeQ("")}
                aria-label="Clear search"
                title="Clear search"
              >
                ⨯
              </button>
            )}
          </div>

          <label className="sr-only" htmlFor="sort">
            Sort favorites
          </label>
          <select
            id="sort"
            className="select"
            value={sortParam}
            onChange={(e) => onChangeSort(e.target.value as SortKey)}
            aria-label="Sort favorites"
          >
            <option value="idDesc">Newest first</option>
            <option value="idAsc">Oldest first</option>
            <option value="title">Title A–Z</option>
          </select>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-outline" onClick={exportJSON} title="Export visible favorites as JSON">
              Export
            </button>
            <button className="btn btn-outline" onClick={triggerImport} title="Import favorites from JSON">
              Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              onChange={onImportFile}
              style={{ display: "none" }}
              aria-hidden="true"
              tabIndex={-1}
            />
            <button
              className="btn"
              onClick={clearAll}
              title="Remove all favorites"
              aria-label="Remove all favorites"
              disabled={!all.length}
            >
              Clear all
            </button>
          </div>
        </div>

        <p className="muted" aria-live="polite">
          Showing {filtered.length.toLocaleString()} of {all.length.toLocaleString()} favorite
          {all.length === 1 ? "" : "s"}
          {qDebounced ? ` · “${qDebounced}”` : ""}
        </p>
      </header>

      {empty ? (
        <section className="empty container" aria-labelledby="fav-empty-h">
          <h2 id="fav-empty-h">No favorites yet</h2>
          <p style={{ marginBottom: 12 }}>
            Hit the ☆ on any photo in the Gallery to add it here.
          </p>
          <Link to="/" className="btn btn-primary">Browse Gallery</Link>
        </section>
      ) : showEmptyFiltered ? (
        <section className="empty container" aria-labelledby="fav-empty-filter-h">
          <h2 id="fav-empty-filter-h">No matches</h2>
          <p>Try clearing your search or changing the sort.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button className="btn" onClick={() => onChangeQ("")}>Clear search</button>
            <button className="btn btn-outline" onClick={() => onChangeSort("idDesc")}>Reset sort</button>
          </div>
        </section>
      ) : (
        <section className="container" aria-labelledby="fav-results-h">
          <h2 id="fav-results-h" className="sr-only">Favorite photos</h2>
          <div className="grid" style={{ marginTop: 12 }}>
            {filtered.map((p) => (
              <PhotoCard key={p.id} p={p} fav={true} onToggleFav={removeOne} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
