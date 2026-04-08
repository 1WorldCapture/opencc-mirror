import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../lib/api/instances";

// --- Instances ---

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
  return useMutation({ mutationFn: api.launchInstance });
}

export function useCheckOpenclaude() {
  return useQuery({
    queryKey: ["openclaude-installed"],
    queryFn: api.checkOpenclaudeInstalled,
  });
}

// --- Providers ---

export function useProviderPresets() {
  return useQuery({
    queryKey: ["provider-presets"],
    queryFn: api.listProviderPresets,
  });
}

// --- MCP Servers ---

export function useMcpServers() {
  return useQuery({
    queryKey: ["mcp-servers"],
    queryFn: api.listMcpServers,
  });
}

export function useUpsertMcpServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.upsertMcpServer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mcp-servers"] }),
  });
}

export function useDeleteMcpServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteMcpServer,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mcp-servers"] }),
  });
}

// --- Skills ---

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: api.listSkills,
  });
}

export function useUpsertSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.upsertSkill,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills"] }),
  });
}

export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteSkill,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills"] }),
  });
}
