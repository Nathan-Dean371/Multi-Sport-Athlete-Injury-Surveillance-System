"use client";

import React from "react";
import { useAuthInit } from "@/lib/useAuthInit";

export default function Providers({ children }: { children: React.ReactNode }) {
  useAuthInit();
  return <>{children}</>;
}
