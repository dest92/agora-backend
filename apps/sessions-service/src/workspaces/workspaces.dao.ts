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
   * Tabla: workspaces (en schema boards)
   * Ahora también agrega al creador como owner en workspace_memberships
   */
  async createWorkspace(ownerId: string, name: string): Promise<WorkspaceRow> {
    console.log('🏗️ Creating workspace:', { ownerId, name });

    const { data, error } = await this.supabase
      .from('workspaces')
      .insert({
        created_by: ownerId,
        name: name,
      })
      .select('id, created_by, name, created_at, description')
      .single();

    if (error) {
      console.error('❌ Failed to create workspace:', error);
      throw new Error(`Failed to create workspace: ${error.message}`);
    }

    console.log('✅ Workspace created:', data);

    // Agregar al creador como owner en workspace_memberships
    console.log('👤 Adding owner to workspace_memberships:', {
      workspace_id: data.id,
      user_id: ownerId,
      role: 'owner',
    });

    const { error: memberError } = await this.supabase
      .from('workspace_memberships')
      .insert({
        workspace_id: data.id,
        user_id: ownerId,
        role: 'owner',
      });

    if (memberError) {
      console.error(
        '❌ Failed to add owner to workspace_memberships:',
        memberError,
      );
      // No fallar la creación del workspace si esto falla
    } else {
      console.log('✅ Owner added to workspace_memberships');
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
   * Actualizar rol de un miembro del workspace
   * Solo owners pueden cambiar roles
   */
  async updateMemberRole(
    workspaceId: string,
    userId: string,
    newRole: 'owner' | 'admin' | 'member',
  ): Promise<void> {
    const { error } = await this.supabase
      .from('workspace_memberships')
      .update({ role: newRole })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }
  }

  /**
   * Verificar si un usuario es owner de un workspace
   * Verifica tanto en created_by de workspaces como en workspace_memberships
   */
  async isWorkspaceOwner(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    // Primero verificar si es el creador del workspace
    const { data: workspace, error: workspaceError } = await this.supabase
      .from('workspaces')
      .select('created_by')
      .eq('id', workspaceId)
      .single();

    if (!workspaceError && workspace && workspace.created_by === userId) {
      return true;
    }

    // Si no es el creador, verificar en workspace_memberships
    const { data, error } = await this.supabase
      .from('workspace_memberships')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.role === 'owner';
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

  /**
   * Borrar un workspace
   * Solo el owner puede borrar el workspace
   * Borra en cascada: boards → cards → tags/assignees/comments/votes
   */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    console.log('🗑️ Deleting workspace:', workspaceId);

    // 1. Obtener todos los boards del workspace
    const { data: boards, error: boardsError } = await this.supabase
      .from('boards')
      .select('id')
      .eq('workspace_id', workspaceId);

    if (boardsError) {
      console.error('❌ Failed to fetch boards:', boardsError);
      throw new Error(`Failed to fetch boards: ${boardsError.message}`);
    }

    console.log(`📋 Found ${boards?.length || 0} boards to delete`);

    // 2. Para cada board, borrar sus cards y relaciones
    if (boards && boards.length > 0) {
      for (const board of boards) {
        console.log(`🗑️ Deleting board ${board.id}...`);

        // 2.1. Obtener todas las cards del board
        const { data: cards } = await this.supabase
          .from('cards')
          .select('id')
          .eq('board_id', board.id);

        if (cards && cards.length > 0) {
          const cardIds = cards.map((c) => c.id);
          console.log(`📝 Deleting ${cardIds.length} cards...`);

          // 2.2. Borrar relaciones de las cards
          // Borrar votes
          await this.supabase.from('votes').delete().in('card_id', cardIds);

          // Borrar assignees
          await this.supabase
            .from('card_assignees')
            .delete()
            .in('card_id', cardIds);

          // Borrar tags
          await this.supabase.from('card_tags').delete().in('card_id', cardIds);

          // Borrar comments
          await this.supabase.from('comments').delete().in('card_id', cardIds);

          // 2.3. Borrar las cards
          await this.supabase.from('cards').delete().in('id', cardIds);
        }

        // 2.4. Borrar tags del board
        await this.supabase.from('tags').delete().eq('board_id', board.id);

        // 2.5. Borrar el board
        await this.supabase.from('boards').delete().eq('id', board.id);
      }
    }

    // 3. Borrar workspace_memberships
    console.log('👥 Deleting workspace memberships...');
    await this.supabase
      .from('workspace_memberships')
      .delete()
      .eq('workspace_id', workspaceId);

    // 4. Borrar sessions del workspace
    console.log('🎯 Deleting workspace sessions...');
    const { data: sessions } = await this.supabase
      .from('sessions')
      .select('id')
      .eq('workspace_id', workspaceId);

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map((s) => s.id);

      // Borrar session_participants
      await this.supabase
        .from('session_participants')
        .delete()
        .in('session_id', sessionIds);

      // Borrar sessions
      await this.supabase.from('sessions').delete().in('id', sessionIds);
    }

    // 5. Finalmente, borrar el workspace
    console.log('🏢 Deleting workspace...');
    const { error } = await this.supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId);

    if (error) {
      console.error('❌ Failed to delete workspace:', error);
      throw new Error(`Failed to delete workspace: ${error.message}`);
    }

    console.log('✅ Workspace deleted successfully');
  }
}
