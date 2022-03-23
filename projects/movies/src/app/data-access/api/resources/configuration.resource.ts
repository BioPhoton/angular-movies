import { Observable } from 'rxjs';
import { TMDBConfigurationModel } from '../model/configuration.model';
import { baseUrlApiV3 } from './internal/base-urls.constant';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

const URL_CONFIGURATION = [baseUrlApiV3, 'configuration'].join('/');

@Injectable({
  providedIn: 'root',
})
export class ConfigurationResource {
  constructor(private http: HttpClient) {}
  getConfig = (): Observable<TMDBConfigurationModel> =>
    this.http.get<TMDBConfigurationModel>(URL_CONFIGURATION);
}
