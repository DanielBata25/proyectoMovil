import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from 'src/environments/environment';


export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  const isApiRequest = req.url.startsWith(environment.apiUrl);

  if (isApiRequest) {
    const modifiedReq = req.clone({
      withCredentials: true
    });
    return next(modifiedReq);
  }


  return next(req);
};
