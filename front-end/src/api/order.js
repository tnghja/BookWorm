import { baseQuery } from './baseQuery';

export const createOrder = (items) =>
  baseQuery({ url: `/orders`, method: 'post', data: { list_item : items } });