import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { AuthGuard } from '@app/lib-auth';
import { createClient } from '@supabase/supabase-js';

/**
 * Users Controller - List registered users
 * Direct Supabase query (no microservice needed for simple user list)
 */

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  /**
   * GET /users
   * List all registered users
   */
  @Get()
  async listUsers() {
    const { data, error } = await this.supabase.auth.admin.listUsers();

    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    return data.users.map((user) => ({
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
    }));
  }

  /**
   * GET /users/:id
   * Get a specific user by ID
   */
  @Get(':id')
  async getUser(@Param('id') userId: string) {
    const { data, error } = await this.supabase.auth.admin.getUserById(userId);

    if (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return {
      id: data.user.id,
      email: data.user.email,
      createdAt: data.user.created_at,
    };
  }
}
