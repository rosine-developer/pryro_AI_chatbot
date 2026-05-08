/**
 * Pagination utility functions
 */

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  totalPages: number;
  currentPage: number;
}

/**
 * Create pagination result
 */
export function createPaginationResult<T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginationResult<T> {
  const limit = options.limit || 50;
  const offset = options.offset || 0;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  const hasMore = offset + data.length < total;

  return {
    data,
    total,
    limit,
    offset,
    hasMore,
    totalPages,
    currentPage,
  };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(options: PaginationOptions): {
  limit: number;
  offset: number;
} {
  let limit = options.limit || 50;
  let offset = options.offset || 0;

  // Ensure limit is within bounds
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  // Ensure offset is non-negative
  if (offset < 0) offset = 0;

  return { limit, offset };
}

/**
 * Calculate page from offset and limit
 */
export function calculatePage(offset: number, limit: number): number {
  return Math.floor(offset / limit) + 1;
}

/**
 * Calculate offset from page and limit
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Paginate array in memory (for testing or small datasets)
 */
export function paginateArray<T>(
  array: T[],
  options: PaginationOptions
): PaginationResult<T> {
  const { limit, offset } = validatePaginationParams(options);
  const data = array.slice(offset, offset + limit);
  return createPaginationResult(data, array.length, { limit, offset });
}
