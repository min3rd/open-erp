import { Observable } from 'rxjs';
import { LoginRequest, LoginResponse, UserProfile } from '../models/auth.model';
export declare class AuthService {
    private http;
    private router;
    private configService;
    currentUser: import("@angular/core").WritableSignal<UserProfile | null>;
    accessToken: import("@angular/core").WritableSignal<string | null>;
    isAuthenticated: import("@angular/core").Signal<boolean>;
    private getStoredUser;
    get authUrl(): string;
    login(request: LoginRequest): Observable<LoginResponse>;
    saveAuthData(res: LoginResponse): void;
    logout(redirectUrl?: string): void;
    hasPermission(permissionCode: string): boolean;
    hasRole(roleCode: string): boolean;
}
