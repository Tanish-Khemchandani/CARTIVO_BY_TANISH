import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollToTopButton from "./ScrollToTopButton";
import PageTransition from "./PageTransition";
import DemoNoticeGate, { DEMO_NOTICE_KEY } from "./DemoNoticeGate";
import SplashScreen from "./SplashScreen";
import { ThemeProvider, useTheme } from "../../context/ThemeContext";

// Tracks that this tab already played the loading splash, so only hard loads
// (and the moment the gate is accepted) show it.
const SPLASH_SESSION_KEY = "cartivo:splash-shown";

export default function StorefrontLayout() {
  return (
    <ThemeProvider>
      <StorefrontShell />
    </ThemeProvider>
  );
}

function StorefrontShell() {
  const { theme } = useTheme();

  // First-time visitors get the gate first; the splash plays when they accept.
  // Returning visitors get the splash once per tab as the loading screen.
  const [splash, setSplash] = useState(() => {
    try {
      if (window.localStorage.getItem(DEMO_NOTICE_KEY) !== "accepted") return null;
      if (window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "1") return null;
      return "loading";
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!splash) return;
    try {
      window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
    } catch {
      // session storage can be blocked; the splash still plays this time
    }
  }, [splash]);

  return (
    <div className="storefront-theme flex min-h-screen w-full flex-col" data-theme={theme}>
      <Navbar />
      <DemoNoticeGate onAccepted={() => setSplash("intro")} />
      <main className="w-full flex-1">
        <PageTransition />
      </main>
      <Footer />
      <ScrollToTopButton />
      {splash ? <SplashScreen mode={splash} onDone={() => setSplash(null)} /> : null}
    </div>
  );
}
