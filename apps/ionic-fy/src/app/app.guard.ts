import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppGuard implements CanActivate, CanDeactivate<any>{
	canActivate(
		next: ActivatedRouteSnapshot,
		state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
		if (state.url !== '/welcome') {
			console.log('activate gaurd', { next, state });
			return true;
		}
		return false;

	}
	canDeactivate(component: any, currentRoute: ActivatedRouteSnapshot, currentState: RouterStateSnapshot, nextState?: RouterStateSnapshot) {
		console.log('deactivate gaurd', { component, currentRoute, currentState, nextState });
		if (currentState.url === '/welcome') {
			console.log('deactivate gaurd', { component, currentRoute, currentState, nextState });
			return true;
		}
		return false;
	}
}