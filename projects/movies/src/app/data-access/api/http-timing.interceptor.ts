import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';

let index = 0;

export function requestTimingInterceptor(
  requestName?: (_request: HttpRequest<any>) => string,
) {
  return (
    request: HttpRequest<any>,
    next: HttpHandlerFn,
  ): Observable<HttpEvent<any>> => {
    const responseWithTiming = null as any;
    const u = 'request' + index++;
    responseWithTiming?.startTime(
      u,
      requestName ? requestName(request) : request.urlWithParams,
    );
    return next(request).pipe(finalize(() => responseWithTiming?.endTime(u)));
  };
}
