import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';
import MapView from './pages/MapView';
import About from './pages/About';
import Upload from './pages/Upload';
import ColdStartBanner from './components/ColdStartBanner';

export default function App() {
  return (
    <>
      <ColdStartBanner />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="project/:id" element={<ProjectDetail />} />
          <Route path="map" element={<MapView />} />
          <Route path="about" element={<About />} />
          <Route path="upload" element={<Upload />} />
        </Route>
      </Routes>
    </>
  );
}
