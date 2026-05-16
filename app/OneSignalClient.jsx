"use client";

import { useEffect } from "react";

export default function OneSignalClient() {
  useEffect(() => {
    const isStandalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

if (!isStandalone) return;

   // if (!isStandalone) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(async function (OneSignal) {
      await OneSignal.init({
  appId: "cbb7fa9d-bdb7-4c90-ad23-8afffe745bbb",
  notifyButton: { enable: false },
  allowLocalhostAsSecureOrigin: true,
});

      // ALWAYS REQUEST PERMISSION PROPERLY
      const permission = await OneSignal.Notifications.permission;

      if (!permission) {
        const accepted =
          await OneSignal.Notifications.requestPermission();

        if (!accepted) return;
      }

      // WAIT FOR SUBSCRIPTION ID PROPERLY
      setTimeout(async () => {
        const subscription =
  OneSignal.User.PushSubscription;

console.log("FULL SUBSCRIPTION:", subscription);

const subscriptionId = subscription.id;

console.log("SUB ID:", subscriptionId);

console.log("OPTED IN:", subscription.optedIn);

if (!subscription.optedIn) {
  console.log("❌ User not subscribed");
  return;
}

        const ua = navigator.userAgent;

        let browser = "Unknown";
        if (ua.includes("Chrome")) browser = "Chrome";
        else if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Safari")) browser = "Safari";

        let device = "Desktop";
        if (/Android/i.test(ua)) device = "Android";
        if (/iPhone|iPad|iPod/i.test(ua)) device = "iPhone";

        await fetch("/api/saveUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Unknown User",
            gender: "",
            role: "staff",
            onesignalId: subscriptionId,
            status: "active",
            device,
            browser,
          }),
        });
      }, 3000);
    });
  }, []);

  return null;
}