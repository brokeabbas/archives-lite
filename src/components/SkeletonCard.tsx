import React from "react";

export default function SkeletonCard() {
  return (
    <div className="card skeleton" aria-hidden="true">
      <div className="skeleton-media" />
      <div className="skeleton-row" />
    </div>
  );
}
