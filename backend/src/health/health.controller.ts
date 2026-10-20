import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const startTime = Date.now();
    let dbStatus = 'ok';
    let dbError: string | undefined;

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      dbStatus = 'error';
      dbError = err.message || 'Database ping failed';
    }

    const latencyMs = Date.now() - startTime;
    const isHealthy = dbStatus === 'ok';
    const memoryUsage = process.memoryUsage();

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs,
        ...(dbError ? { error: dbError } : {}),
      },
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
    };
  }
}
