import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function useAuthInit() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
}
