import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchAlbums, fetchPhotosPage } from "@/api";
import type { Album, Photo } from "@/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useInfiniteRef } from "@/hooks/useInfiniteRef";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import PhotoCard from "@/components/PhotoCard";
import SkeletonCard from "@/components/SkeletonCard";

type FavStore = { [id: number]: Photo };

export default function Gallery() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<Photo[]>([]);
  const [hasMore, setHasMore] = React.useState(true);
  const [albums, setAlbums] = React.useState<Album[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [initialLoaded, setInitialLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [favs, setFavs] = useLocalStorage<FavStore>("ral-favs-v1", {});
  const toggleFav = (p: Photo) =>
    setFavs((s) => (s[p.id] ? (delete s[p.id], { ...s }) : { ...s, [p.id]: p }));

  // URL state
  const qParam = params.get("q") ?? "";
  const albumParam = params.get("album") ?? "";
  const qDebounced = useDebouncedValue(qParam, 250);

  // Albums bootstrap (non-blocking)
  React.useEffect(() => {
    let alive = true;
    fetchAlbums()
      .then((as) => alive && setAlbums(as))
      .catch(() => alive && setAlbums([]));
    return () => {
      alive = false;
    };
  }, []);

  // Page appender
  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetchPhotosPage(page)
      .then((data) => {
        if (!alive) return;
        setItems((prev) => [...prev, ...data]);
        if (data.length < 24) setHasMore(false);
      })
      .catch(() => alive && setError("Could not load photos"))
      .finally(() => {
        if (alive) {
          setLoading(false);
          setInitialLoaded(true);
        }
      });

    return () => {
      alive = false;
    };
  }, [page]);

  // Reset pagination on filters (q/album)
  React.useEffect(() => {
    let alive = true;
    setItems([]);
    setHasMore(true);
    setPage(1);
    setLoading(true);
    setError(null);

    fetchPhotosPage(1)
      .then((d) => {
        if (!alive) return;
        setItems(d);
        if (d.length < 24) setHasMore(false);
      })
      .catch(() => alive && setError("Could not load photos"))
      .finally(() => alive && (setLoading(false), setInitialLoaded(true)));

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDebounced, albumParam]);

  // Infinite sentinel (prefetch earlier; fully invisible)
  const sentinelRef = useInfiniteRef(
    () => hasMore && !loading && !error && setPage((p) => p + 1),
    { rootMargin: "1000px 0px" }
  );

  // Derived
  const albumId = albumParam ? Number(albumParam) : null;
  const filtered = React.useMemo(
    () =>
      items.filter(
        (p) =>
          (!albumId || p.albumId === albumId) &&
          (!qDebounced || p.title.toLowerCase().includes(qDebounced.toLowerCase()))
      ),
    [items, albumId, qDebounced]
  );

  const totalFavs = React.useMemo(() => Object.keys(favs).length, [favs]);

  // Handlers
  const onChangeQ = (v: string) => {
    if (v) params.set("q", v);
    else params.delete("q");
    setParams(params, { replace: true });
  };
  const onChangeAlbum = (v: string) => {
    if (v) params.set("album", v);
    else params.delete("album");
    setParams(params, { replace: true });
  };
  const clearFilters = () => {
    params.delete("q");
    params.delete("album");
    setParams(params, { replace: true });
  };

  // UI
  const showEmpty = initialLoaded && filtered.length === 0 && !error;

  return (
    <>
      <header className="toolbar" role="banner">
        <nav className="nav" aria-label="Primary">
          <Link to="/" className="btn btn-ghost" aria-current="page">
            <span className="logo-dot" aria-hidden="true" /> Gallery
          </Link>
          <Link to="/favorites" className="btn btn-ghost">
            Favorites{" "}
            <span className="badge" aria-label={`${totalFavs} favorites`}>
              {totalFavs}
            </span>
          </Link>
        </nav>

        <div className="row" role="search" aria-label="Photo search">
          <div className="input-wrap">
            <input
              className="input"
              placeholder="Search title…"
              value={qParam}
              onChange={(e) => onChangeQ(e.target.value)}
              aria-label="Search photos by title"
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

          <label className="sr-only" htmlFor="album-filter">
            Filter by album
          </label>
          <select
            id="album-filter"
            className="select"
            value={albumParam}
            onChange={(e) => onChangeAlbum(e.target.value)}
            aria-label="Filter by album"
          >
            <option value="">All albums</option>
            {albums.slice(0, 50).map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>

          {(qParam || albumParam) && (
            <button className="btn btn-outline" onClick={clearFilters} aria-label="Clear filters">
              Clear
            </button>
          )}
        </div>

        <p className="muted" aria-live="polite">
          {filtered.length.toLocaleString()} results
          {albumId ? ` · Album ${albumId}` : ""} {qDebounced ? ` · “${qDebounced}”` : ""}
        </p>
      </header>

      {error && (
        <div className="error" role="alert">
          <strong>We hit a snag:</strong> {error}
          <div>
            <button className="btn btn-primary" onClick={() => setPage((p) => p)}>
              Retry
            </button>
          </div>
        </div>
      )}

      {showEmpty && (
        <section className="empty" aria-labelledby="empty-h">
          <h2 id="empty-h">No matches</h2>
          <p>Try adjusting your search or album filter.</p>
        </section>
      )}

      <section aria-labelledby="results-h" className="container">
        <h2 id="results-h" className="sr-only">
          Results
        </h2>

        <div className="grid">
          {filtered.map((p) => (
            <PhotoCard key={p.id} p={p} fav={!!favs[p.id]} onToggleFav={toggleFav} />
          ))}

          {/* Initial load: show more skeletons for visual stability */}
          {loading &&
            Array.from({ length: initialLoaded ? 6 : 18 }).map((_, i) => <SkeletonCard key={`s-${i}`} />)}
        </div>

        {/* Invisible IntersectionObserver sentinel (no visual line) */}
        {hasMore && !error && (
          <>
            <div
              ref={sentinelRef}
              className="sentinel"
              aria-hidden="true"
              style={{
                width: "100%",
                height: 1,
                margin: 0,
                padding: 0,
                opacity: 0,
                pointerEvents: "none",
                background: "transparent",
                border: 0,
              }}
            />
            {/* A11y: announce loading without visual noise */}
            {loading && (
              <span className="sr-only" role="status" aria-live="polite">
                Loading more photos…
              </span>
            )}
          </>
        )}
      </section>
    </>
  );
}
