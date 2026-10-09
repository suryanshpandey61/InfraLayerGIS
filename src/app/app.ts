import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MapComponent} from './components/map-component/map-component'; 

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,MapComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'InfraLayerGIS';
}
