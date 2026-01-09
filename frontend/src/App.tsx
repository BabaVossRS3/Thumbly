import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import "./globals.css";
import LenisScroll from "./components/LenisScroll";
import Generate from "./pages/Generate";
import MyGeneration from "./pages/MyGeneration";
import YtPreview from "./pages/YtPreview";
import Login from "./pages/Login";
import YouTubeIntegration from "./pages/YouTubeIntegration";
import PlanSelectionPage from "./pages/PlanSelectionPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailedPage from "./pages/PaymentFailedPage";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function App() {
    const {pathname} = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    
    return (
        <>
            <LenisScroll />
            <Navbar />
            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/generate" element={<Generate />} />
                    <Route path="/generate/:id" element={<Generate />} />
                    <Route path="/my-generation" element={<MyGeneration />} />
                    <Route path="/preview" element={<YtPreview />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/pricing" element={<PlanSelectionPage />} />
                    <Route path="/payment-success" element={<PaymentSuccessPage />} />
                    <Route path="/payment-failed" element={<PaymentFailedPage />} />
                    <Route path="/youtube" element={<YouTubeIntegration />} />
                </Routes>
            </main>
            <Footer />
        </>
    );
}