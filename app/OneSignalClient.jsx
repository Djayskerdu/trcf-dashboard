"use client";

import { useEffect } from "react";

// Initialises OneSignal push in the installed (PWA) app.
// Devices are linked to a user account after login (see saveDevice in page.jsx).
export default function OneSignalClient() {
  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (!isStandalone) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.init({
        appId: "cbb7fa9d-bdb7-4c90-ad23-8afffe745bbb",
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: true,
      });

      if (!OneSignal.Notifications.permission) {
        await OneSignal.Notifications.requestPermission();
      }
    });
  }, []);

  return null;
}
