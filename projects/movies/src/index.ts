import { bootstrapApplication } from '@angular/platform-browser';
import appConfig from './app/app.config';
import { AppComponent } from './app/app.component';

const bootstrap = () => bootstrapApplication(AppComponent, appConfig).catch((err) => console.log(err));

export default bootstrap;

export { tmdbContentTypeInterceptor } from './app/data-access/api/tmdbContentTypeInterceptor';
export { tmdbReadAccessInterceptor } from './app/auth/tmdb-http-interceptor.feature';
export { provideTmdbImageLoader } from './app/data-access/images/image-loader';
