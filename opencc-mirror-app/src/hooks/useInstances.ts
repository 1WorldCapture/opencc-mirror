import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "../lib/api/instances";

// --- Instances ---
export function useInstances() {
  return useQuery({ queryKey: ["instances"], queryFn: api.listInstances });
}
export function useCreateInstance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createInstance, onSuccess: () => qc.invalidateQueries({ queryKey: ["instances"] }) });
}
export function useRemoveInstance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.removeInstance, onSuccess: () => qc.invalidateQueries({ queryKey: ["instances"] }) });
}
export function useLaunchInstance() {
  return useMutation({ mutationFn: api.launchInstance });
}
export function useCheckOpenclaude() {
  return useQuery({ queryKey: ["openclaude-installed"], queryFn: api.checkOpenclaudeInstalled });
}

// --- Providers ---
export function useProviders() {
  return useQuery({ queryKey: ["providers"], queryFn: api.listProviders });
}
export function useAddProvider() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.addProvider, onSuccess: () => qc.invalidateQueries({ queryKey: ["providers"] }) });
}
export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: string; input: any }) => api.updateProvider(id, input), onSuccess: () => qc.invalidateQueries({ queryKey: ["providers"] }) });
}
export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteProvider, onSuccess: () => qc.invalidateQueries({ queryKey: ["providers"] }) });
}

// --- MCP ---
export function useMcpServers() {
  return useQuery({ queryKey: ["mcp-servers"], queryFn: api.listMcpServers });
}
export function useUpsertMcpServer() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.upsertMcpServer, onSuccess: () => qc.invalidateQueries({ queryKey: ["mcp-servers"] }) });
}
export function useDeleteMcpServer() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteMcpServer, onSuccess: () => qc.invalidateQueries({ queryKey: ["mcp-servers"] }) });
}

// --- Skills ---
export function useSkills() {
  return useQuery({ queryKey: ["skills"], queryFn: api.listSkills });
}
export function useUpsertSkill() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.upsertSkill, onSuccess: () => qc.invalidateQueries({ queryKey: ["skills"] }) });
}
export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteSkill, onSuccess: () => qc.invalidateQueries({ queryKey: ["skills"] }) });
}
