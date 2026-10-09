
import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-component',
  standalone: true,
  imports: [],
  templateUrl: './map-component.html',
  styleUrl: './map-component.css'
})
export class MapComponent implements AfterViewInit, OnDestroy {

  private map!: L.Map;
  private tollPlazaLayer!: L.TileLayer.WMS;

  tollPlazaEnabled = false;

  ngAfterViewInit(): void {
    this.initializeMap();
    this.initializeTollPlazaLayer();
  }

  
private initializeMap(): void {
  this.map = L.map('map').setView([21.04, 81.43], 5);

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      attribution: '&copy; OpenStreetMap contributors'
    }
  ).addTo(this.map);
}

  
private initializeTollPlazaLayer(): void {
  this.tollPlazaLayer = L.tileLayer.wms(
    'http://localhost:8080/geoserver/gisplotting/wms',
    {
      layers: 'gisplotting:toll_plazas',
      styles: '',
      format: 'image/png',
      transparent: true,
      version: '1.1.0',
      crs: L.CRS.EPSG4326
    }
  );

  this.tollPlazaLayer.on('tileerror', (event) => {
    console.error('GeoServer WMS tile error:', event);
  });
}

  toggleTollPlaza(): void {
    if (!this.map || !this.tollPlazaLayer) {
      return;
    }

    if (this.tollPlazaEnabled) {
      this.map.removeLayer(this.tollPlazaLayer);
      this.tollPlazaEnabled = false;
    } else {
      this.tollPlazaLayer.addTo(this.map);
      this.tollPlazaEnabled = true;
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}