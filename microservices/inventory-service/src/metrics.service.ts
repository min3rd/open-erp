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
    this.createCounter('inventory_get_requests_total', 'Total number of get inventory requests');
    this.createCounter('inventory_list_requests_total', 'Total number of list inventory requests');
    this.createCounter('inventory_order_events_received_total', 'Total number of order events received');
    this.createCounter('inventory_order_events_processed_total', 'Total number of order events processed successfully');
    this.createCounter('inventory_order_events_failed_total', 'Total number of order events that failed processing');
    
    this.createHistogram('inventory_order_processing_duration_seconds', 'Duration of order event processing in seconds');
    this.createGauge('inventory_low_stock_items', 'Number of items with low stock');
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
