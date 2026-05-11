// Agent System — Shared Types & Dispatch

export type AgentId = 'seo' | 'affiliate' | 'sponsorship' | 'retrieval' | 'metadata' | 'recommendation' | 'ecosystem';

export interface AgentRequest {
  agent: AgentId;
  input: Record<string, any>;
  context?: Record<string, any>;
}

export interface AgentResponse {
  agent: AgentId;
  status: 'success' | 'error';
  output: Record<string, any>;
  systemPrompt: string;
  tokensEstimate?: number;
  error?: string;
}

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description: string;
  systemPrompt: string;
  inputSchema: Record<string, { type: string; required: boolean; description: string }>;
  handler: (input: Record<string, any>, context?: Record<string, any>) => Promise<Record<string, any>>;
}

// Registry
const agents = new Map<AgentId, AgentDefinition>();

export function registerAgent(def: AgentDefinition) {
  agents.set(def.id, def);
}

export function getAgent(id: AgentId): AgentDefinition | undefined {
  return agents.get(id);
}

export function listAgents(): Pick<AgentDefinition, 'id' | 'name' | 'description'>[] {
  return Array.from(agents.values()).map(a => ({ id: a.id, name: a.name, description: a.description }));
}

export async function dispatchAgent(req: AgentRequest): Promise<AgentResponse> {
  const agent = agents.get(req.agent);
  if (!agent) {
    return { agent: req.agent, status: 'error', output: {}, systemPrompt: '', error: `Unknown agent: ${req.agent}` };
  }

  try {
    const output = await agent.handler(req.input, req.context);
    return { agent: req.agent, status: 'success', output, systemPrompt: agent.systemPrompt };
  } catch (e: any) {
    return { agent: req.agent, status: 'error', output: {}, systemPrompt: agent.systemPrompt, error: e.message };
  }
}
