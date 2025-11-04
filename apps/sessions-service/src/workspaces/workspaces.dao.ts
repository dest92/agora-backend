import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

/**
 * DAO Pattern: Usando Supabase REST API
 * Evita problemas de conexión directa a PostgreSQL
 * Microservices: Sessions domain separation
 */

interface WorkspaceRow {
  id: string;
  created_by: string;
  name: string;
  created_at: string;
  description?: string;
}

@Injectable()
export class WorkspacesDao {
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
        db: {
          schema: 'boards',
        },
      },
    );
  }

  /**
   * Crear workspace con owner usando Supabase REST API
   * Tabla: workspaces (en schema public por defecto)
   */
  async createWorkspace(ownerId: string, name: string): Promise<WorkspaceRow> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .insert({
        created_by: ownerId,
        name: name,
      })
      .select('id, created_by, name, created_at, description')
      .single();

    if (error) {
      throw new Error(`Failed to create workspace: ${error.message}`);
    }

    return data;
  }

  /**
   * Listar workspaces donde el usuario es owner o member
   * CQRS: Query optimizada para lectura usando Supabase REST API
   */
  async listWorkspaces(userId: string): Promise<WorkspaceRow[]> {
    const { data, error } = await this.supabase
      .from('workspaces')
      .select('id, created_by, name, created_at, description')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list workspaces: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Agregar miembro a workspace
   * Inserta en boards.workspace_memberships si no existe
   */
  async addMember(
    workspaceId: string,
    userId: string,
    addedBy: string,
  ): Promise<void> {
    const { error } = await this.supabase.from('workspace_memberships').insert({
      workspace_id: workspaceId,
      user_id: userId,
      role: 'member',
    });

    if (error) {
      // Ignore duplicate key errors (user already member)
      if (error.code !== '23505') {
        throw new Error(`Failed to add workspace member: ${error.message}`);
      }
    }
  }

  /**
   * Buscar usuario por email
   * Retorna el UUID del usuario desde auth.users
   * Usa la API de Supabase Auth Admin
   */
  async findUserByEmail(email: string): Promise<string | null> {
    try {
      // Usar Supabase Auth Admin API para listar usuarios
      const { data, error } = await this.supabase.auth.admin.listUsers();

      if (error || !data) {
        console.error('Failed to list users:', error);
        return null;
      }

      // Buscar usuario por email
      const user = data.users.find((u) => u.email === email);

      if (!user) {
        return null;
      }

      return user.id;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Buscar usuarios por query (email o metadata name)
   * Retorna lista de usuarios con id, email y name
   */
  async searchUsers(
    query: string,
  ): Promise<Array<{ id: string; email: string; name: string }>> {
    try {
      const { data, error } = await this.supabase.auth.admin.listUsers();

      if (error || !data) {
        console.error('Failed to list users:', error);
        return [];
      }

      const lowerQuery = query.toLowerCase();

      // Filtrar usuarios que coincidan con el query
      const matchingUsers = data.users
        .filter((u) => {
          const email = u.email?.toLowerCase() || '';
          const name = u.user_metadata?.name?.toLowerCase() || '';
          return email.includes(lowerQuery) || name.includes(lowerQuery);
        })
        .map((u) => ({
          id: u.id,
          email: u.email || '',
          name: u.user_metadata?.name || u.email?.split('@')[0] || 'User',
        }))
        .slice(0, 10); // Limitar a 10 resultados

      return matchingUsers;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Listar miembros de un workspace
   * Ahora incluye el email del usuario
   */
  async listMembers(workspaceId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('workspace_memberships')
      .select('user_id, role, joined_at')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list workspace members: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Obtener emails de los usuarios desde Supabase Auth Admin API
    try {
      const membersWithEmails = await Promise.all(
        data.map(async (member) => {
          try {
            const {
              data: { users },
              error: userError,
            } = await this.supabase.auth.admin.listUsers();

            if (userError) {
              console.error(`Error fetching users:`, userError);
              return {
                userId: member.user_id,
                email: null,
                role: member.role,
                joinedAt: member.joined_at,
              };
            }

            const user = users.find((u) => u.id === member.user_id);

            return {
              userId: member.user_id,
              email: user?.email || null,
              name:
                user?.user_metadata?.name ||
                user?.email?.split('@')[0] ||
                'Unknown',
              role: member.role,
              joinedAt: member.joined_at,
            };
          } catch (err) {
            console.error(`Error fetching user ${member.user_id}:`, err);
            return {
              userId: member.user_id,
              email: null,
              name: 'Unknown',
              role: member.role,
              joinedAt: member.joined_at,
            };
          }
        }),
      );

      return membersWithEmails;
    } catch (error) {
      console.error('Error enriching members with emails:', error);
      // Return basic data if enrichment fails
      return data.map((member) => ({
        userId: member.user_id,
        email: null,
        name: 'Unknown',
        role: member.role,
        joinedAt: member.joined_at,
      }));
    }
  }

  /**
   * Listar workspaces donde el usuario es miembro (invitaciones recibidas)
   * Obtiene workspaces de workspace_memberships con JOIN a workspaces
   */
  async listMembershipWorkspaces(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('workspace_memberships')
      .select('workspace_id, role, joined_at, workspaces(id, name, created_by)')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list membership workspaces: ${error.message}`);
    }

    return data || [];
  }
}
