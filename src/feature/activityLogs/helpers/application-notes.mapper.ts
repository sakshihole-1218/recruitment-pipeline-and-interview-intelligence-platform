import { ApplicationNoteResponseDto } from '../dto/application-note.response.dto';
import { ApplicationNoteEntity } from '../entities/application-note.entity';

export class ApplicationNotesMapper {
  static toResponse(entity: ApplicationNoteEntity): ApplicationNoteResponseDto {
    return {
      id: entity.id,
      application_id: entity.application_id,
      user_id: entity.user_id,
      note_type: entity.note_type,
      note_text: entity.note_text,
      is_private: entity.is_private,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
