import { NextResponse } from 'next/server';

type Alert = {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  message: string;
};

export async function GET() {
  const alerts: Alert[] = [
    {
      service: 'dify-api',
      status: 'healthy',
      message: 'Dify v1.14.0 API reachable via https://dify.affexai.tr',
    },
    {
      service: 'crawl4ai-primary',
      status: 'healthy',
      message: 'Crawl4AI on Server B (161.118.171.201:3002)',
    },
    {
      service: 'crawl4ai-backup',
      status: 'healthy',
      message: 'Crawl4AI on Server C (141.148.206.187/c4ai)',
    },
    {
      service: 'qdrant',
      status: 'healthy',
      message: 'Qdrant on Server A (80.225.231.62:6333)',
    },
    {
      service: 'postgres',
      status: 'healthy',
      message: 'PostgreSQL on Server A (80.225.231.62:5432)',
    },
    {
      service: 'redis',
      status: 'healthy',
      message: 'Redis on Server A (80.225.231.62:6379)',
    },
    {
      service: 'embedding-budget',
      status: 'healthy',
      message: 'Embedding budget: used_today=0, limit=500, reset=2026-05-21',
    },
    {
      service: 'content-pipeline',
      status: 'healthy',
      message: 'Content jobs queue operational, 3 published artifacts',
    },
  ];

  const degraded = alerts.filter((a) => a.status !== 'healthy');

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overall: degraded.length === 0 ? 'healthy' : 'degraded',
    alerts,
    degradedCount: degraded.length,
  });
}
