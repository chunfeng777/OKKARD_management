export interface DashboardMetric {
  key: string
  value: string
  delta: string
  tone: 'neutral' | 'success' | 'warning' | 'danger'
  route: { name: string; query?: Record<string, string> }
}

export interface DashboardTodo {
  key: string
  count: number
  level: 'info' | 'warning' | 'danger'
  route: { name: string; query?: Record<string, string> }
}

export interface TrendPoint {
  label: string
  draws: number
  recharge: number
  paidUsers: number
  coinNet: number
}

export interface DashboardSnapshot {
  metrics: DashboardMetric[]
  todos: DashboardTodo[]
  trend: TrendPoint[]
  generatedAt: string
}
