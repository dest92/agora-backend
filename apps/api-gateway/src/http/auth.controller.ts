import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { Public } from '@app/lib-auth';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LogoutDto } from './dto/logout.dto';

/**
 * API Gateway Pattern: HTTP proxy a servicios externos
 * Cliente-Servidor: Gateway → Supabase Auth REST
 * Microservicios: Auth proxy separado de services de dominio
 * Singleton: ConfigService y HttpModule globales
 */

interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  user: {
    id: string | null;
    email: string | null;
  };
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_URL')!;
    this.supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY')!;
  }

  /**
   * POST /auth/register
   * Proxy: Gateway → Supabase Auth signup
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.supabaseUrl}/auth/v1/signup`,
          {
            email: registerDto.email,
            password: registerDto.password,
          },
          {
            headers: {
              apikey: this.supabaseAnonKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return this.mapSupabaseResponse(response.data);
    } catch (error: any) {
      this.logger.error('Register failed', error.response?.data);
      throw this.handleSupabaseError(error);
    }
  }

  /**
   * POST /auth/login
   * Proxy: Gateway → Supabase Auth token (password grant)
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.supabaseUrl}/auth/v1/token?grant_type=password`,
          {
            email: loginDto.email,
            password: loginDto.password,
          },
          {
            headers: {
              apikey: this.supabaseAnonKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return this.mapSupabaseResponse(response.data);
    } catch (error: any) {
      this.logger.error('Login failed', error.response?.data);
      throw this.handleSupabaseError(error);
    }
  }

  /**
   * POST /auth/refresh
   * Proxy: Gateway → Supabase Auth token (refresh_token grant)
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshDto: RefreshDto): Promise<AuthResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
          {
            refresh_token: refreshDto.refreshToken,
          },
          {
            headers: {
              apikey: this.supabaseAnonKey,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return this.mapSupabaseResponse(response.data);
    } catch (error: any) {
      this.logger.error('Refresh failed', error.response?.data);
      throw this.handleSupabaseError(error);
    }
  }

  /**
   * POST /auth/logout
   * Proxy: Gateway → Supabase Auth logout
   */
  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  async logout(@Body() logoutDto: LogoutDto): Promise<AuthResponse> {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.supabaseUrl}/auth/v1/logout`,
          {},
          {
            headers: {
              apikey: this.supabaseAnonKey,
              'Content-Type': 'application/json',
              Authorization: `Bearer ${logoutDto.accessToken}`,
            },
          },
        ),
      );

      // Logout exitoso: retornar tokens null
      return {
        accessToken: null,
        refreshToken: null,
        user: {
          id: null,
          email: null,
        },
      };
    } catch (error: any) {
      this.logger.error('Logout failed', error.response?.data);
      throw this.handleSupabaseError(error);
    }
  }

  /**
   * Mapear respuesta de Supabase al shape estable
   * Normaliza diferentes formatos de respuesta de Supabase
   */
  private mapSupabaseResponse(data: any): AuthResponse {
    return {
      accessToken: data.access_token || null,
      refreshToken: data.refresh_token || null,
      user: {
        id: data.user?.id || null,
        email: data.user?.email || null,
      },
    };
  }

  /**
   * Manejar errores de Supabase devolviendo 4xx/5xx coherentes
   * Sin loguear passwords ni tokens sensibles
   */
  private handleSupabaseError(error: any): HttpException {
    const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message = error.response?.data?.error_description || 
                   error.response?.data?.msg || 
                   'Authentication failed';

    return new HttpException(message, status);
  }
}
