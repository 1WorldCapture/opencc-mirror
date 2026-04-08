import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../lib/api/instances";

export function useInstances() {
  return useQuery({
    queryKey: ["instances"],
    queryFn: api.listInstances,
  });
}

export function useCreateInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instances"] });
    },
  });
}

export function useRemoveInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.removeInstance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instances"] });
    },
  });
}

export function useLaunchInstance() {
  return useMutation({
    mutationFn: api.launchInstance,
  });
}

export function useCheckOpenclaude() {
  return useQuery({
    queryKey: ["openclaude-installed"],
    queryFn: api.checkOpenclaudeInstalled,
  });
}

export function useProviderPresets() {
  return useQuery({
    queryKey: ["provider-presets"],
    queryFn: api.listProviderPresets,
  });
}
