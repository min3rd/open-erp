import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  effect,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TranslocoModule } from '@jsverse/transloco';
import * as L from 'leaflet';
import 'leaflet-draw';

/**
 * Draw Map Component
 * Interactive map with drawing capabilities using Leaflet Draw
 */
@Component({
  selector: 'core-draw-map',
  imports: [CommonModule, FormsModule, ButtonModule, SelectButtonModule, TranslocoModule],
  templateUrl: './draw-map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawMapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  // Input signals
  readonly geometry = input<GeoJSON.Geometry | null>(null);
  readonly center = input<[number, number]>([15.9749, 108.2515]); // Vietnam center
  readonly zoom = input<number>(6);
  readonly editable = input<boolean>(true);

  // Output signals
  readonly geometryChange = output<GeoJSON.Geometry | null>();

  private map: L.Map | null = null;
  private drawnItems: L.FeatureGroup | null = null;
  private drawControl: L.Control.Draw | null = null;
  
  // Base map layers
  private baseLayers: { [key: string]: L.TileLayer } = {};
  private currentBaseLayer: L.TileLayer | null = null;
  
  // State for base map selection
  protected readonly currentBaseMap = signal<'osm' | 'satellite'>('osm');
  
  // Options for SelectButton
  protected readonly baseMapOptions = [
    { label: 'Map', value: 'osm', icon: 'pi pi-map' },
    { label: 'Satellite', value: 'satellite', icon: 'pi pi-globe' }
  ];

  constructor() {
    // React to geometry changes
    effect(() => {
      const geom = this.geometry();
      if (this.map && this.drawnItems) {
        this.loadGeometry(geom);
      }
    });

    // React to editable changes
    effect(() => {
      const isEditable = this.editable();
      if (this.map && this.drawControl) {
        if (isEditable) {
          this.map.addControl(this.drawControl);
        } else {
          this.map.removeControl(this.drawControl);
        }
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
   * Initialize the Leaflet map with drawing controls
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
      satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
      }),
    };

    // Add default base layer
    this.currentBaseLayer = this.baseLayers['osm'];
    this.currentBaseLayer.addTo(this.map);

    // Create feature group for drawn items
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    // Initialize draw controls
    this.drawControl = new L.Control.Draw({
      position: 'topright',
      draw: {
        polygon: {
          allowIntersection: false,
          shapeOptions: {
            color: '#3b82f6',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3,
          },
        },
        polyline: false,
        circle: false,
        circlemarker: false,
        marker: false,
        rectangle: {
          shapeOptions: {
            color: '#3b82f6',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.3,
          },
        },
      },
      edit: {
        featureGroup: this.drawnItems,
        remove: true,
      },
    });

    // Add control if editable
    if (this.editable()) {
      this.map.addControl(this.drawControl);
    }

    // Handle draw created
    this.map.on(L.Draw.Event.CREATED, (event: any) => {
      const layer = event.layer;
      this.drawnItems!.clearLayers();
      this.drawnItems!.addLayer(layer);
      this.emitGeometry();
    });

    // Handle draw edited
    this.map.on(L.Draw.Event.EDITED, () => {
      this.emitGeometry();
    });

    // Handle draw deleted
    this.map.on(L.Draw.Event.DELETED, () => {
      this.emitGeometry();
    });

    // Load initial geometry if provided
    const initialGeom = this.geometry();
    if (initialGeom) {
      this.loadGeometry(initialGeom);
    }
  }

  /**
   * Load geometry into the map
   */
  private loadGeometry(geometry: GeoJSON.Geometry | null): void {
    if (!this.drawnItems) return;

    // Clear existing layers
    this.drawnItems.clearLayers();

    if (geometry) {
      // Create GeoJSON layer and add to drawnItems
      const geoJsonLayer = L.geoJSON(geometry, {
        style: {
          color: '#3b82f6',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.3,
        },
      });

      geoJsonLayer.eachLayer((layer) => {
        this.drawnItems!.addLayer(layer);
      });

      // Fit map to geometry bounds
      const bounds = this.drawnItems.getBounds();
      if (bounds.isValid()) {
        this.map!.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }

  /**
   * Extract geometry from drawn items and emit
   */
  private emitGeometry(): void {
    if (!this.drawnItems) return;

    const layers = this.drawnItems.getLayers();
    if (layers.length === 0) {
      this.geometryChange.emit(null);
      return;
    }

    // Convert layers to GeoJSON
    const geoJson = this.drawnItems.toGeoJSON() as GeoJSON.FeatureCollection;

    if (geoJson.features.length === 0) {
      this.geometryChange.emit(null);
      return;
    }

    // If single feature, return its geometry
    if (geoJson.features.length === 1) {
      this.geometryChange.emit(geoJson.features[0].geometry);
    } else {
      // Multiple features - create MultiPolygon or GeometryCollection
      const geometries = geoJson.features.map((f) => f.geometry);
      const allPolygons = geometries.every((g) => g.type === 'Polygon');

      if (allPolygons) {
        // Combine into MultiPolygon
        const coordinates = geometries.map((g) => (g as GeoJSON.Polygon).coordinates);
        this.geometryChange.emit({
          type: 'MultiPolygon',
          coordinates: coordinates,
        } as GeoJSON.MultiPolygon);
      } else {
        // Create GeometryCollection
        this.geometryChange.emit({
          type: 'GeometryCollection',
          geometries: geometries,
        } as GeoJSON.GeometryCollection);
      }
    }
  }

  /**
   * Clear all drawn items
   */
  protected clearDrawing(): void {
    if (this.drawnItems) {
      this.drawnItems.clearLayers();
      this.geometryChange.emit(null);
    }
  }

  /**
   * Switch base map layer
   */
  protected switchBaseMap(type: 'osm' | 'satellite'): void {
    if (!this.map || this.currentBaseMap() === type) return;

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
}
