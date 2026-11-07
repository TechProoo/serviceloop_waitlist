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
import AuthPage, { AccountPage, RequireAccount } from './pages/AuthPage';
import { SavedPage, RequestsPage } from "./pages/WorkspacePages";
import BookingPage from './pages/BookingPage';
import BookingsDashboard from './pages/BookingsDashboard';
import BookingInspectionPage from './pages/BookingInspectionPage';
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
            <Route path="login" element={<AuthPage />} />
            <Route path="account" element={<RequireAccount><AccountPage /></RequireAccount>} />
            <Route path="request-quote" element={<RequireAccount><QuotePage /></RequireAccount>} />
            <Route path="list-equipment" element={<RequireAccount owner><ListEquipmentPage /></RequireAccount>} />
            <Route path="saved" element={<RequireAccount><SavedPage /></RequireAccount>} />
            <Route path="requests" element={<RequireAccount><RequestsPage /></RequireAccount>} />
            <Route path="bookings" element={<RequireAccount><BookingsDashboard /></RequireAccount>} />
            <Route path="bookings/:id" element={<RequireAccount><BookingPage /></RequireAccount>} />
            <Route path="bookings/:id/handover" element={<RequireAccount><BookingInspectionPage stage="handover" /></RequireAccount>} />
            <Route path="bookings/:id/return" element={<RequireAccount><BookingInspectionPage stage="return" /></RequireAccount>} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </MarketplaceProvider>
    </BrowserRouter>
  </StrictMode>,
);
