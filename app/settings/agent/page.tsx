import type { Metadata } from 'next'
import AgentSettings from './agent-settings'

export const metadata: Metadata = {
  title: 'Agent Settings — PredictMate',
  description: 'Generate API keys and connect your AI agents to PredictMate.',
}

export default function AgentSettingsPage() {
  return <AgentSettings />
}
