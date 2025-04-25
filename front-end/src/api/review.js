import { baseQuery } from './baseQuery';

export const getReviews = (id, params) =>
  baseQuery({ url: `/reviews/${id}`, method: 'get',params });
