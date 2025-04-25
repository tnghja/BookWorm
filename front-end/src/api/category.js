import { baseQuery } from './baseQuery';

export const getCategories = () =>
  baseQuery({ url: '/categories', method: 'get' });