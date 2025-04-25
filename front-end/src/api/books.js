/**
 * Books API services
 */

/**
 * Get books with optional filtering and sorting
 * 
 * Response structure from backend:
 * {
 *   books: [
 *     {
 *       book: { id, title, price, summary, ... },
 *       final_price: Decimal,
 *       discount_price: Decimal,
 *       discount_amount: Decimal,
 *       avg_rating: float,
 *       review_count: int,
 *       author_name: string,
 *       category_name: string
 *     }
 *   ],
 *   count: int,
 *   page: int,
 *   items_per_page: int,
 *   total_pages: int,
 *   start_item: int,
 *   end_item: int
 * }
 * 
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (1-based)
 * @param {number} params.items_per_page - Items per page (5, 15, 20, 25)
 * @param {string} params.sort_by - Sort by field (on_sale, popularity, price_asc, price_desc, recommend)
 * @param {string} params.category_name - Filter by category name
 * @param {string} params.author_name - Filter by author name
 * @param {number} params.rating - Filter by minimum rating (1-5)
 * @returns {Promise<Object>} - Book list response with pagination info
 */
import { baseQuery } from './baseQuery';

export const getBooks = (params = {}) =>baseQuery({ url: '/books', method: 'get', params });

export const getBook = (id) => baseQuery({ url: `/books/${id}`, method: 'get' });

export const getBooksOnSale = (limit = 10) => getBooks({ page: 1, limit, sort_by: 'on_sale' });

export const getRecommendedBooks = (limit = 10) =>
  baseQuery({ url: `/books/recommend`, method: 'get', params: { limit } });

export const getMostReviewedBooks = (limit = 10) =>
  baseQuery({ url: `/books/most_reviews`, method: 'get', params: { limit } });

export const getBookById = (id) =>
  baseQuery({ url: `/books/${id}`, method: 'get' });
