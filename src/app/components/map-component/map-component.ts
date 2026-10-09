
import { AfterViewInit, Component } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-component',
  standalone: true,
  templateUrl: './map-component.html',
  styleUrls: ['./map-component.css']
})
export class MapComponent implements AfterViewInit {
  private map!: L.Map;

  tollPlazaEnabled = false;
  loadingTollPlazas = false;

  private tollPlazaMarkers = L.featureGroup();
  private tollPlazaLoaded = false;

  // Keep only the base URL here. Parameters are added below.
  private readonly wfsUrl = '/geoserver/gisplotting/ows';

  ngAfterViewInit(): void {
    this.map = L.map('map').setView([22.5, 80], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    // Do not load WFS data here.
    // Load only when the user clicks Show Toll Plazas.
  }

  async loadTollPlazas(): Promise<void> {
    if (this.tollPlazaLoaded || this.loadingTollPlazas) {
      return;
    }

    this.loadingTollPlazas = true;

    try {
      const params = new URLSearchParams({
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: 'gisplotting:toll_plazas',
        outputFormat: 'application/json',
        srsName: 'EPSG:4326'
      });

      const response = await fetch(`${this.wfsUrl}?${params.toString()}`);
      const body = await response.text();

      console.log('GeoServer HTTP status:', response.status);
      console.log('GeoServer response preview:', body.substring(0, 1000));

      if (!response.ok) {
        throw new Error(`WFS request failed: HTTP ${response.status}`);
      }

      // GeoServer may return an XML exception instead of GeoJSON.
      if (!body.trim().startsWith('{')) {
        throw new Error(
          `Expected GeoJSON but received another response: ${body.substring(0, 300)}`
        );
      }

      const geojson = JSON.parse(body);

      const layer = L.geoJSON(geojson, {
        pointToLayer: (_feature, latlng) => {
          return L.marker(latlng, {
            icon: L.divIcon({
              className: 'toll-plaza-icon-wrapper',
              html: '<span class="toll-plaza-icon">🛣️</span>',
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            })
          });
        },

        onEachFeature: (feature, marker) => {
          const p = feature.properties ?? {};

          const name = p.name ?? p.tollplaza_name ?? 'Toll Plaza';
          const highway = p.nh_no ?? p.nh_number ?? 'Not available';

          marker.bindTooltip(
            `<strong>${this.escapeHtml(name)}</strong><br>
             Highway: ${this.escapeHtml(highway)}`,
            { direction: 'top', sticky: true }
          );

          marker.bindPopup(`
            <div class="toll-popup">
              <h3>${this.escapeHtml(name)}</h3>
              <p><b>Highway:</b> ${this.escapeHtml(highway)}</p>
              <p><b>Toll Plaza ID:</b>
                ${this.escapeHtml(p.tollplaza_id ?? p.id ?? 'N/A')}
              </p>
              <p><b>Code:</b>
                ${this.escapeHtml(p.code ?? 'N/A')}
              </p>
              <p><b>Tollable Length:</b>
                ${this.escapeHtml(p.tollable_length ?? 'N/A')}
              </p>
            </div>
          `);
        }
      });

      this.tollPlazaMarkers.addLayer(layer);
      this.tollPlazaLoaded = true;

      if (this.tollPlazaEnabled) {
        this.tollPlazaMarkers.addTo(this.map);
      }

      console.log('Toll plaza features loaded:', geojson.features?.length ?? 0);

    } catch (error) {
      console.error('Unable to load toll plazas:', error);
      this.tollPlazaEnabled = false;

      alert(
        'Could not load toll plazas. Check the browser console for the GeoServer response.'
      );
    } finally {
      this.loadingTollPlazas = false;
    }
  }

  async toggleTollPlazas(): Promise<void> {
    if (this.tollPlazaEnabled) {
      this.tollPlazaEnabled = false;
      this.map.removeLayer(this.tollPlazaMarkers);
      return;
    }

    this.tollPlazaEnabled = true;
    await this.loadTollPlazas();

    if (this.tollPlazaEnabled && this.tollPlazaLoaded) {
      this.tollPlazaMarkers.addTo(this.map);
    }
  }

  private escapeHtml(value: unknown): string {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return String(value ?? 'N/A').replace(
      /[&<>"']/g,
      (char: string) => entities[char]
    );
  }
}