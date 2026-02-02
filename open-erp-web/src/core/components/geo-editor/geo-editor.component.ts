import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  computed,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { TabsModule } from 'primeng/tabs';
import { DrawMapComponent } from '../draw-map/draw-map.component';

/**
 * GeoEditor Component
 * Allows users to paste GeoJSON geometry or draw interactively on map
 */
@Component({
  selector: 'core-geo-editor',
  imports: [FormsModule, TranslocoModule, ButtonModule, TextareaModule, TabsModule, DrawMapComponent],
  templateUrl: './geo-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoEditorComponent {
  // Inputs (accept any GeoJSON - Geometry, Feature or FeatureCollection)
  readonly geometry = input<GeoJSON.GeoJSON | null>(null);

  // Outputs emit a Geometry (province model expects Geometry)
  readonly geometryChange = output<GeoJSON.Geometry | null>();

  // State
  protected readonly geoJsonText = signal<string>('');
  protected readonly parseError = signal<string>('');
  protected readonly activeTab = signal<number>(0);

  // Extract Geometry from any GeoJSON for DrawMap
  protected readonly extractedGeometry = computed(() => {
    const geom = this.geometry();
    if (!geom) return null;
    return this.extractGeometry(geom);
  });

  constructor() {
    // Sync geometry input to text
    effect(() => {
      const geom = this.geometry();
      if (geom) {
        this.geoJsonText.set(JSON.stringify(geom, null, 2));
      } else {
        this.geoJsonText.set('');
      }
    });
  }

  /**
   * Helper to extract Geometry from various GeoJSON wrappers
   */
  private extractGeometry(obj: GeoJSON.GeoJSON): GeoJSON.Geometry | null {
    // Geometry object
    if ((obj as any).type && (obj as any).coordinates) {
      return obj as GeoJSON.Geometry;
    }

    // Feature
    if ((obj as any).type === 'Feature' && (obj as any).geometry) {
      return (obj as any).geometry as GeoJSON.Geometry;
    }

    // FeatureCollection: take first feature with geometry
    if ((obj as any).type === 'FeatureCollection' && Array.isArray((obj as any).features)) {
      const featureWithGeom = (obj as any).features.find((f: any) => f && f.geometry);
      return featureWithGeom ? (featureWithGeom.geometry as GeoJSON.Geometry) : null;
    }

    return null;
  }

  /**
   * Handle text change
   */
  protected onTextChange(value: string): void {
    this.geoJsonText.set(value);
    this.parseError.set('');
  }

  /**
   * Validate and emit GeoJSON (accept Geometry, Feature, FeatureCollection)
   */
  protected onApply(): void {
    const text = this.geoJsonText().trim();

    if (!text) {
      this.geometryChange.emit(null);
      this.parseError.set('');
      return;
    }

    try {
      const parsed = JSON.parse(text) as GeoJSON.GeoJSON;

      const geom = this.extractGeometry(parsed);
      if (!geom) {
        this.parseError.set('Invalid GeoJSON: expected Geometry, Feature or FeatureCollection with at least one Feature');
        return;
      }

      this.geometryChange.emit(geom);
      this.parseError.set('');
    } catch (error) {
      this.parseError.set('Invalid JSON: ' + (error as Error).message);
    }
  }

  /**
   * Clear geometry
   */
  protected onClear(): void {
    this.geoJsonText.set('');
    this.parseError.set('');
    this.geometryChange.emit(null);
  }

  /**
   * Handle geometry change from draw map
   */
  protected onDrawMapGeometryChange(geometry: GeoJSON.Geometry | null): void {
    this.geometryChange.emit(geometry);
    // Update text representation
    if (geometry) {
      this.geoJsonText.set(JSON.stringify(geometry, null, 2));
    } else {
      this.geoJsonText.set('');
    }
  }
}
