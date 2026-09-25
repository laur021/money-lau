"use client";

import { setupIonicReact } from "@ionic/react";

// Register Ionic web components without allowing IonApp to take ownership of
// the existing Next.js document, scrolling, or desktop application shell.
setupIonicReact();

export function IonicProvider() {
  return null;
}
