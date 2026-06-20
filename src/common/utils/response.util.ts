import { ApiSuccessResponseInterface } from '../interfaces/api-success-response.dto';

export class ResponseUtil {
  static success<T>(message: string, data: T): ApiSuccessResponseInterface<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  static paginated<T>(
    message: string,
    data: T[],
    page: number,
    limit: number,
    totalRecords: number,
  ) {
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total_records: totalRecords,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_previous_page: page > 1,
      },
    };
  }
}
