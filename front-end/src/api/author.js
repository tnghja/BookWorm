import { baseQuery } from './baseQuery';

export const getAuthors = () =>
  baseQuery({ url: '/authors', method: 'get' });