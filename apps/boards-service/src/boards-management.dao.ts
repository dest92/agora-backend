/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

/**
 * DAO para gestión de Boards (la entidad board, no las cards)
 * Separado de boards.dao.ts que maneja cards
 */

export interface BoardRow {
  id: string;
  workspace_id: string;
  team_id: string;
  title: string;
  created_by: string;
  created_at: string;
}

export interface LaneRow {
  id: string;
  board_id: string;
  name: string;
  position: number;
}

@Injectable()
export class BoardsManagementDao {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
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
      teamId = (existingTeam as { id: string }).id;
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

      teamId = (newTeam as { id: string }).id;
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
    await this.createDefaultLanes((data as BoardRow).id);

    return data as BoardRow;
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

    return (data as BoardRow[]) || [];
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

    if (
      workspace &&
      (workspace as { created_by: string }).created_by === userId
    ) {
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

    return data as BoardRow;
  }

  /**
   * Obtener lanes de un board
   */
  async getLanes(boardId: string): Promise<LaneRow[]> {
    const { data, error } = await this.supabase
      .from('lanes')
      .select('id, board_id, name, position')
      .eq('board_id', boardId)
      .order('position', { ascending: true });

    if (error) {
      throw new Error(`Failed to get lanes: ${error.message}`);
    }

    return (data as LaneRow[]) || [];
  }

  /**
   * Crear una nueva lane en un board
   */
  async createLane(boardId: string, name: string): Promise<LaneRow> {
    // Obtener la última posición
    const { data: existingLanes } = await this.supabase
      .from('lanes')
      .select('position')
      .eq('board_id', boardId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition =
      existingLanes && existingLanes.length > 0
        ? existingLanes[0].position + 1
        : 0;

    const { data, error } = await this.supabase
      .from('lanes')
      .insert({
        board_id: boardId,
        name: name,
        position: nextPosition,
      })
      .select('id, board_id, name, position')
      .single();

    if (error) {
      throw new Error(`Failed to create lane: ${error.message}`);
    }

    return data as LaneRow;
  }

  /**
   * Actualizar posición de una lane
   */
  async updateLanePosition(
    laneId: string,
    position: number,
  ): Promise<{ boardId: string }> {
    // Primero obtener el board_id
    const { data: lane } = await this.supabase
      .from('lanes')
      .select('board_id')
      .eq('id', laneId)
      .single();

    if (!lane) {
      throw new Error('Lane not found');
    }

    const { error } = await this.supabase
      .from('lanes')
      .update({ position })
      .eq('id', laneId);

    if (error) {
      throw new Error(`Failed to update lane position: ${error.message}`);
    }

    return { boardId: lane.board_id };
  }

  /**
   * Borrar una lane
   * También borra todas las cards que pertenecen a esa lane
   */
  async deleteLane(laneId: string): Promise<{ boardId: string }> {
    // Primero obtener la lane para saber su board_id
    const { data: lane } = await this.supabase
      .from('lanes')
      .select('board_id')
      .eq('id', laneId)
      .single();

    if (!lane) {
      throw new Error('Lane not found');
    }

    // Obtener todas las cards de esta lane
    const { data: cards } = await this.supabase
      .from('cards')
      .select('id')
      .eq('lane_id', laneId);

    if (cards && cards.length > 0) {
      const cardIds = cards.map((c) => c.id);

      // Borrar relaciones de las cards
      await this.supabase.from('votes').delete().in('card_id', cardIds);
      await this.supabase
        .from('card_assignees')
        .delete()
        .in('card_id', cardIds);
      await this.supabase.from('card_tags').delete().in('card_id', cardIds);
      await this.supabase.from('comments').delete().in('card_id', cardIds);

      // Borrar las cards
      await this.supabase.from('cards').delete().in('id', cardIds);
    }

    // Finalmente borrar la lane
    const { error } = await this.supabase
      .from('lanes')
      .delete()
      .eq('id', laneId);

    if (error) {
      throw new Error(`Failed to delete lane: ${error.message}`);
    }

    return { boardId: lane.board_id };
  }
}
