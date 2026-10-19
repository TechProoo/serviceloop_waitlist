import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MarketplaceProvider } from "./state/Marketplace";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import EquipmentPage from "./pages/EquipmentPage";
import EquipmentDetailPage from "./pages/EquipmentDetailPage";
import { ServicesPage, ServiceDetailPage } from "./pages/ServicesPage";
import QuotePage from "./pages/QuotePage";
import ListEquipmentPage from "./pages/ListEquipmentPage";
import { SavedPage, RequestsPage } from "./pages/WorkspacePages";
import { HowItWorksPage, AboutPage, NotFoundPage } from "./pages/InfoPages";
import "./index.css";
import "./App.css";
import "./pages.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <MarketplaceProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="equipment" element={<EquipmentPage />} />
            <Route path="equipment/:id" element={<EquipmentDetailPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="services/:slug" element={<ServiceDetailPage />} />
            <Route path="request-quote" element={<QuotePage />} />
            <Route path="list-equipment" element={<ListEquipmentPage />} />
            <Route path="saved" element={<SavedPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </MarketplaceProvider>
    </BrowserRouter>
  </StrictMode>,
);
