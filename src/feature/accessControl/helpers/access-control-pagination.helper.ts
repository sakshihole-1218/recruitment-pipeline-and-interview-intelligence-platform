import { BadRequestException } from '@nestjs/common';

export class AccessControlPaginationHelper {
  static ensureCursorCompatibleSort(options: {
    cursor?: string;
    sort_by?: string;
  }): void {
    if (!options.cursor) {
      return;
    }

    if (options.sort_by && options.sort_by !== 'created_at') {
      throw new BadRequestException({
        message: 'Cursor pagination is only supported with sort_by=created_at',
        code: 'CURSOR_PAGINATION_UNSUPPORTED_SORT',
      });
    }
  }
}
