import { Injectable } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  private registry: Registry;
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private gauges: Map<string, Gauge> = new Map();

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({ register: this.registry });

    // Initialize default metrics
    this.createCounter('order_create_attempts_total', 'Total number of order creation attempts');
    this.createCounter('order_create_success_total', 'Total number of successful order creations');
    this.createCounter('order_get_requests_total', 'Total number of get order requests');
    this.createCounter('order_list_requests_total', 'Total number of list orders requests');
    
    this.createHistogram('order_request_duration_seconds', 'Duration of order requests in seconds');
    this.createGauge('order_pending_count', 'Number of pending orders');
  }

  private createCounter(name: string, help: string): Counter {
    const counter = new Counter({
      name,
      help,
      registers: [this.registry],
    });
    this.counters.set(name, counter);
    return counter;
  }

  private createHistogram(name: string, help: string): Histogram {
    const histogram = new Histogram({
      name,
      help,
      registers: [this.registry],
    });
    this.histograms.set(name, histogram);
    return histogram;
  }

  private createGauge(name: string, help: string): Gauge {
    const gauge = new Gauge({
      name,
      help,
      registers: [this.registry],
    });
    this.gauges.set(name, gauge);
    return gauge;
  }

  incrementCounter(name: string, value: number = 1) {
    const counter = this.counters.get(name);
    if (counter) {
      counter.inc(value);
    }
  }

  observeHistogram(name: string, value: number) {
    const histogram = this.histograms.get(name);
    if (histogram) {
      histogram.observe(value);
    }
  }

  setGauge(name: string, value: number) {
    const gauge = this.gauges.get(name);
    if (gauge) {
      gauge.set(value);
    }
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
