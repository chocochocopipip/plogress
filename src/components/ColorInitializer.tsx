"use client";

import { useEffect } from "react";
import { loadColors, applyColors } from "@/lib/colors";

export default function ColorInitializer() {
  useEffect(() => {
    const { primary, secondary } = loadColors();
    applyColors(primary, secondary);
  }, []);
  return null;
}
