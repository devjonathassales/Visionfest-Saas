// src/hooks/useFaturasSaaS.js (cliente)
import { useQuery } from "@tanstack/react-query";
import api from "../utils/api";

export function useFaturasSaaS() {
  return useQuery({
    queryKey: ["faturas-saas"],
    queryFn: async () => {
      const { data } = await api.get("/api/faturas");
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 15000, // auto-refresh a cada 15s
    refetchOnWindowFocus: true, // ao voltar pro foco da aba
    staleTime: 5000,
  });
}
