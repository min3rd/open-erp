import {
  ChangeDetectionStrategy,
  Component,
  input,
  effect,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectButtonChangeEvent, SelectButtonModule } from 'primeng/selectbutton';
import * as L from 'leaflet';

/**
 * Map styling constants
 */
const MAP_STYLES = {
  // Background layer (e.g., province boundary)
  background: {
    color: '#94a3b8',      // Lighter border color (slate-400)
    weight: 2,
    opacity: 0.6,
    fillColor: '#cbd5e1',  // Light background fill (slate-300)
    fillOpacity: 0.15,     // Very transparent - 15% opacity
  },
  // Primary layer (e.g., selected ward)
  primary: {
    color: '#3b82f6',      // Primary blue color (blue-500)
    weight: 2,
    opacity: 0.8,
    fillOpacity: 0.3,
  },
  // Map bounds padding
  boundsPadding: [50, 50] as [number, number],
};

/**
 * Shared Map Component using Leaflet
 * Displays an OpenStreetMap base layer and optional GeoJSON layers
 * Supports multiple layers with different styles (e.g., province background + ward foreground)
 */
@Component({
  selector: 'core-map',
  imports: [CommonModule, FormsModule, SelectButtonModule],
  templateUrl: './map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  // Input signals
  // Primary geometry (e.g., selected ward) - shown with default style
  readonly geometry = input<GeoJSON.GeoJSON | null>(null);
  // Background geometry (e.g., province boundary) - shown with lighter style
  readonly backgroundGeometry = input<GeoJSON.GeoJSON | null>(null);
  readonly center = input<[number, number]>([15.9749, 108.2515]); // Vietnam center
  readonly zoom = input<number>(6);
  readonly showLabels = input<boolean>(true);

  // Output events
  readonly geometryClick = output<{ lat: number; lng: number; layer: L.Layer }>();
  readonly backgroundClick = output<{ lat: number; lng: number; layer: L.Layer }>();

  private map: L.Map | null = null;
  private geoJsonLayer: L.GeoJSON | null = null;
  private backgroundLayer: L.GeoJSON | null = null;

  // Base map layers
  private baseLayers: { [key: string]: L.TileLayer } = {};
  private currentBaseLayer: L.TileLayer | null = null;

  // State for base map selection
  protected readonly currentBaseMap = signal<'osm' | 'satellite'>('osm');

  // Options for SelectButton
  protected readonly baseMapOptions = [
    { label: 'Map', value: 'osm', icon: 'pi pi-map' },
    { label: 'Satellite', value: 'satellite', icon: 'pi pi-globe' },
  ];

  constructor() {
    // React to primary geometry changes
    effect(() => {
      const geom = this.geometry();
      if (this.map) {
        this.updateGeoJSON(geom);
      }
    });

    // React to background geometry changes
    effect(() => {
      const bgGeom = this.backgroundGeometry();
      if (this.map) {
        this.updateBackgroundGeoJSON(bgGeom);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  /**
   * Initialize the Leaflet map
   */
  private initMap(): void {
    // Create map instance
    this.map = L.map(this.mapContainer.nativeElement).setView(this.center(), this.zoom());

    // Define base map layers
    this.baseLayers = {
      osm: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }),
      satellite: L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
        }
      ),
    };

    // Add default base layer
    this.currentBaseLayer = this.baseLayers['osm'];
    this.currentBaseLayer.addTo(this.map);

    // Add initial geometries if provided
    const initialBgGeom = this.backgroundGeometry();
    if (initialBgGeom) {
      this.updateBackgroundGeoJSON(initialBgGeom);
    }

    const initialGeom = this.geometry();
    if (initialGeom) {
      this.updateGeoJSON(initialGeom);
    }
  }

  /**
   * Switch base map layer
   */
  protected switchBaseMap(event: SelectButtonChangeEvent): void {
    const type = event.value as 'osm' | 'satellite';
    if (!this.map) return;

    // Remove current base layer
    if (this.currentBaseLayer) {
      this.map.removeLayer(this.currentBaseLayer);
    }

    // Add new base layer
    this.currentBaseLayer = this.baseLayers[type];
    this.currentBaseLayer.addTo(this.map);

    // Update state
    this.currentBaseMap.set(type);
  }

  /**
   * Update the background GeoJSON layer on the map (e.g., province boundary)
   */
  private updateBackgroundGeoJSON(geometry: GeoJSON.GeoJSON | null): void {
    if (!this.map) return;

    // Remove existing background layer
    if (this.backgroundLayer) {
      this.map.removeLayer(this.backgroundLayer);
      this.backgroundLayer = null;
    }

    // Add new background layer if geometry exists
    if (geometry) {
      this.backgroundLayer = L.geoJSON(geometry, {
        style: MAP_STYLES.background,
        interactive: true,
      }).addTo(this.map);

      // Add click handler for background layer
      this.backgroundLayer.on('click', (e: L.LeafletMouseEvent) => {
        this.backgroundClick.emit({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          layer: e.target,
        });
      });

      // Fit map to background geometry bounds if no primary geometry
      if (!this.geometry()) {
        const bounds = this.backgroundLayer.getBounds();
        if (bounds.isValid()) {
          this.map.fitBounds(bounds, { padding: MAP_STYLES.boundsPadding });
        }
      }
    }
  }

  /**
   * Update the primary GeoJSON layer on the map (e.g., selected ward)
   */
  private updateGeoJSON(geometry: GeoJSON.GeoJSON | null): void {
    if (!this.map) return;

    // Remove existing layer
    if (this.geoJsonLayer) {
      this.map.removeLayer(this.geoJsonLayer);
      this.geoJsonLayer = null;
    }

    // Add new layer if geometry exists
    if (geometry) {
      this.geoJsonLayer = L.geoJSON(geometry, {
        style: MAP_STYLES.primary,
        interactive: true,
      }).addTo(this.map);

      // Add click handler
      this.geoJsonLayer.on('click', (e: L.LeafletMouseEvent) => {
        this.geometryClick.emit({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
          layer: e.target,
        });
      });

      // Fit map to geometry bounds
      const bounds = this.geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: MAP_STYLES.boundsPadding });
      }
    } else if (this.backgroundLayer) {
      // If no primary geometry but have background, fit to background
      const bounds = this.backgroundLayer.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: MAP_STYLES.boundsPadding });
      }
    }
  }

  /**
   * Public method to update map center
   */
  public setCenter(center: [number, number], zoom?: number): void {
    if (this.map) {
      this.map.setView(center, zoom || this.map.getZoom());
    }
  }

  /**
   * Public method to fit bounds
   */
  public fitBounds(bounds: L.LatLngBoundsExpression): void {
    if (this.map) {
      this.map.fitBounds(bounds, { padding: MAP_STYLES.boundsPadding });
    }
  }
}
