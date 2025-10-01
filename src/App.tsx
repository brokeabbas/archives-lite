import { Outlet, Route, Routes } from "react-router-dom";
import Gallery from "@/pages/Gallery";
import Favorites from "@/pages/Favorites";
import PhotoDetail from "@/pages/PhotoDetail";

function Layout() {
  return (
    <>
      <header className="header">
        <div className="wrapper toolbar">
          <strong>Archives Lite</strong>
          <span style={{color:"var(--muted)"}}>Search • Infinite scroll • Favorites</span>
        </div>
      </header>
      <main id="main" className="wrapper" style={{paddingTop:12}}>
        <Outlet />
      </main>
      <footer className="wrapper" style={{padding:12, fontSize:".9rem"}}>© {new Date().getFullYear()}</footer>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Gallery />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="photo/:id" element={<PhotoDetail />} />
      </Route>
    </Routes>
  );
}
