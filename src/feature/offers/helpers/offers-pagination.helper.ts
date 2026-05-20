import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class OffersPaginationHelper {
  ensureCursorCompatibleSort(options: { cursor?: string; sort_by?: string }): void {
    if (!options.cursor) {
      return;
    }

    if (options.sort_by && options.sort_by !== 'created_at') {
      throw new BadRequestException({
        message: 'Cursor pagination is only available when sorting by creation date',
        code: 'CURSOR_PAGINATION_UNSUPPORTED_SORT',
      });
    }
  }
}
