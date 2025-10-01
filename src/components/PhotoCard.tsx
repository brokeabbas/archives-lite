import { Link } from "react-router-dom";
import type { Photo } from "@/types";
import React from "react";

export default function PhotoCard({
  p,
  fav,
  onToggleFav,
}: {
  p: Photo;
  fav: boolean;
  onToggleFav: (p: Photo) => void;
}) {
  const label = fav ? "Remove from favorites" : "Add to favorites";

  return (
    <article className="card" aria-label={p.title}>
      <Link to={`/photo/${p.id}`} className="media" aria-label={`Open ${p.title}`}>
        {/* High-DPI + responsive with graceful blur-up */}
        <img
          src={p.thumbnailUrl}
          srcSet={`${p.thumbnailUrl} 150w, ${p.url} 600w`}
          sizes="(max-width: 700px) 45vw, 300px"
          width={600}
          height={400}
          loading="lazy"
          decoding="async"
          alt={p.title}
          className="thumb"
        />
      </Link>

      <div className="caption">
        <span className="title" title={p.title}>
          {p.title}
        </span>

        <button
          className={`btn fav ${fav ? "is-active" : ""}`}
          aria-pressed={fav}
          aria-label={label}
          title={fav ? "Unfavorite" : "Favorite"}
          onClick={() => onToggleFav(p)}
        >
          <span aria-hidden="true">{fav ? "★" : "☆"}</span>
          <span className="sr-only">{label}</span>
        </button>
      </div>
    </article>
  );
}
