"use client";

import { IonApp, setupIonicReact } from "@ionic/react";

setupIonicReact({
  mode: "ios",
});

export function IonicProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return <IonApp>{children}</IonApp>;
}
