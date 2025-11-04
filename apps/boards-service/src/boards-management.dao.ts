import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

/**
 * DAO para gestión de Boards (la entidad board, no las cards)
 * Separado de boards.dao.ts que maneja cards
 */

interface BoardRow {
  id: string;
  workspace_id: string;
  team_id: string;
  title: string;
  created_by: string;
  created_at: string;
}

interface TeamRow {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

@Injectable()
export class BoardsManagementDao {
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
   * Crear un board dentro de un workspace
   * Primero busca o crea un team, luego crea el board
   */
  async createBoard(
    workspaceId: string,
    title: string,
    createdBy: string,
  ): Promise<BoardRow> {
    // 1. Buscar si existe un team para este workspace y usuario
    const { data: existingTeam } = await this.supabase
      .from('teams')
      .select('id')
      .eq('created_by', createdBy)
      .limit(1)
      .single();

    let teamId: string;

    if (existingTeam) {
      teamId = existingTeam.id;
    } else {
      // 2. Si no existe team, crear uno por defecto
      const { data: newTeam, error: teamError } = await this.supabase
        .from('teams')
        .insert({
          name: 'Default Team',
          created_by: createdBy,
        })
        .select('id')
        .single();

      if (teamError) {
        throw new Error(`Failed to create team: ${teamError.message}`);
      }

      teamId = newTeam.id;
    }

    // 3. Crear el board
    const { data, error } = await this.supabase
      .from('boards')
      .insert({
        workspace_id: workspaceId,
        team_id: teamId,
        title: title,
        created_by: createdBy,
      })
      .select('id, workspace_id, team_id, title, created_by, created_at')
      .single();

    if (error) {
      throw new Error(`Failed to create board: ${error.message}`);
    }

    // 4. Crear lanes por defecto para el board
    await this.createDefaultLanes(data.id);

    return data;
  }

  /**
   * Crear lanes por defecto para un board nuevo
   */
  private async createDefaultLanes(boardId: string): Promise<void> {
    const defaultLanes = [
      { board_id: boardId, name: 'ideas', position: 1000 },
      { board_id: boardId, name: 'discuss', position: 2000 },
      { board_id: boardId, name: 'decided', position: 3000 },
    ];

    const { error } = await this.supabase.from('lanes').insert(defaultLanes);

    if (error) {
      throw new Error(`Failed to create default lanes: ${error.message}`);
    }
  }

  /**
   * Listar boards de un workspace
   * Verifica que el workspace existe en la tabla de workspaces
   */
  async listBoards(workspaceId: string): Promise<BoardRow[]> {
    const { data, error } = await this.supabase
      .from('boards')
      .select('id, workspace_id, team_id, title, created_by, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list boards: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Verificar si un usuario tiene acceso a un workspace
   * (es owner o es miembro)
   */
  async hasWorkspaceAccess(
    workspaceId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if user is workspace owner
    const { data: workspace } = await this.supabase
      .from('workspaces')
      .select('created_by')
      .eq('id', workspaceId)
      .single();

    if (workspace && workspace.created_by === userId) {
      return true;
    }

    // Check if user is workspace member
    const { data: membership } = await this.supabase
      .from('workspace_memberships')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .single();

    return !!membership;
  }

  /**
   * Obtener un board por ID
   */
  async getBoard(boardId: string): Promise<BoardRow | null> {
    const { data, error } = await this.supabase
      .from('boards')
      .select('id, workspace_id, team_id, title, created_by, created_at')
      .eq('id', boardId)
      .single();

    if (error) {
      throw new Error(`Failed to get board: ${error.message}`);
    }

    return data;
  }

  /**
   * Obtener lanes de un board
   */
  async getLanes(boardId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('lanes')
      .select('id, board_id, name, position')
      .eq('board_id', boardId)
      .order('position', { ascending: true });

    if (error) {
      throw new Error(`Failed to get lanes: ${error.message}`);
    }

    return data || [];
  }
}
