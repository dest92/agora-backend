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
   * Listar miembros de un workspace
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

    return data || [];
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
