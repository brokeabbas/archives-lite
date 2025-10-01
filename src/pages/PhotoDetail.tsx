import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchPhoto } from "@/api";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { Photo } from "@/types";

type FavStore = { [id: number]: Photo };

export default function PhotoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pid = Number(id);

  const [photo, setPhoto] = React.useState<Photo | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [tip, setTip] = React.useState<string | null>(null);

  const [favs, setFavs] = useLocalStorage<FavStore>("ral-favs-v1", {});
  const isFav = !!(photo && favs[photo.id]);

  // Load photo
  React.useEffect(() => {
    if (!Number.isFinite(pid) || pid <= 0) {
      setErr("Invalid photo id");
      return;
    }
    let alive = true;
    setErr(null);
    setLoaded(false);
    setPhoto(null);
    fetchPhoto(pid)
      .then((p) => {
        if (!alive) return;
        setPhoto(p);
      })
      .catch(() => alive && setErr("Photo not found"));
    return () => {
      alive = false;
    };
  }, [pid]);

  // Keyboard shortcuts (Esc/Backspace = back, F = fav, S = share, D = download)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ignore when typing
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;

      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        navigate(-1);
      } else if (photo) {
        if (e.key.toLowerCase() === "f") {
          e.preventDefault();
          toggleFav();
        } else if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          share();
        } else if (e.key.toLowerCase() === "d") {
          e.preventDefault();
          download();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photo]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFav = () => {
    if (!photo) return;
    setFavs((s) => (s[photo.id] ? (delete s[photo.id], { ...s }) : { ...s, [photo.id]: photo }));
    flashTip(isFav ? "Removed from favorites" : "Added to favorites");
  };

  const share = async () => {
    if (!photo) return;
    const url = window.location.href;
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: photo.title, text: photo.title, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        flashTip("Link copied to clipboard");
      } else {
        flashTip("Sharing not supported");
      }
    } catch {
      flashTip("Share canceled");
    }
  };

  const download = () => {
    if (!photo) return;
    // Simple client-side download trigger (may open in new tab depending on CORS/CD)
    const a = document.createElement("a");
    a.href = photo.url;
    a.download = `photo-${photo.id}.jpg`;
    a.rel = "noopener";
    a.target = "_blank";
    a.click();
    flashTip("Opening original image…");
  };

  const flashTip = (msg: string) => {
    setTip(msg);
    window.setTimeout(() => setTip(null), 1800);
  };

  const loading = !err && !photo;

  return (
    <div className="container">
      <header className="toolbar" style={{ marginBottom: 12 }}>
        <nav className="nav" aria-label="Breadcrumb">
          <button className="btn btn-ghost" onClick={() => navigate(-1)} title="Go back (Esc)">
            ← Back
          </button>
          <Link to="/" className="btn btn-ghost">
            <span className="logo-dot" aria-hidden="true" /> Gallery
          </Link>
          <span className="btn btn-ghost" aria-current="page">
            Photo
          </span>
        </nav>

        {photo && (
          <div className="row" role="toolbar" aria-label="Photo actions" style={{ justifyContent: "flex-end" }}>
            <button
              className={`btn ${isFav ? "btn-outline" : ""}`}
              onClick={toggleFav}
              aria-pressed={isFav}
              aria-label={isFav ? "Remove from favorites (F)" : "Add to favorites (F)"}
              title={isFav ? "Unfavorite (F)" : "Favorite (F)"}
            >
              {isFav ? "★ Favorited" : "☆ Favorite"}
            </button>
            <button className="btn btn-outline" onClick={share} title="Share (S)">
              Share
            </button>
            <button className="btn btn-primary" onClick={download} title="Download / open original (D)">
              Download
            </button>
          </div>
        )}

        <p className="muted" aria-live="polite">
          {tip ?? (photo ? `Photo #${photo.id} · Album ${photo.albumId}` : loading ? "Loading photo…" : "")}
        </p>
      </header>

      {err && (
        <section className="error" role="alert" aria-labelledby="pd-error-h">
          <h2 id="pd-error-h" style={{ margin: 0 }}>We couldn’t load that photo</h2>
          <p style={{ margin: 0 }}>{err}</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-primary" onClick={() => navigate(0)}>Retry</button>
            <Link className="btn" to="/">Back to Gallery</Link>
          </div>
        </section>
      )}

      {loading && (
        <article className="card skeleton" aria-hidden="true" style={{ maxWidth: 980, margin: "0 auto" }}>
          <div className="skeleton-media" />
          <div className="skeleton-row" />
        </article>
      )}

      {photo && (
        <article className="card" style={{ maxWidth: 980, margin: "0 auto" }}>
          {/* Hero image with graceful fade-in */}
          <div
            style={{
              position: "relative",
              background: `center / cover no-repeat url(${photo.thumbnailUrl})`,
              aspectRatio: "3 / 2",
              overflow: "hidden",
            }}
          >
            <img
              src={photo.url}
              alt={photo.title}
              width={1200}
              height={800}
              loading="eager"
              onLoad={() => setLoaded(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                opacity: loaded ? 1 : 0,
                transition: "opacity .4s ease",
                willChange: "opacity",
              }}
            />
          </div>

          <div className="caption" style={{ alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: "6px 0 2px" }}>{photo.title}</h3>
              <p className="muted" style={{ margin: 0 }}>
                Photo #{photo.id} · Album {photo.albumId}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className={`btn ${isFav ? "btn-outline" : ""}`}
                onClick={toggleFav}
                aria-pressed={isFav}
                aria-label={isFav ? "Remove from favorites (F)" : "Add to favorites (F)"}
                title={isFav ? "Unfavorite (F)" : "Favorite (F)"}
              >
                {isFav ? "★" : "☆"}
              </button>
              <button className="btn btn-outline" onClick={share} title="Share (S)" aria-label="Share">
                Share
              </button>
              <a
                className="btn btn-primary"
                href={photo.url}
                download={`photo-${photo.id}.jpg`}
                target="_blank"
                rel="noopener"
                title="Download / open original (D)"
                aria-label="Download original"
              >
                Download
              </a>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
