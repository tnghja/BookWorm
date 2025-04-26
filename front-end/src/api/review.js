import { baseQuery, getAxiosAccessToken } from './baseQuery';

export const getReviews = (id, params) =>
  baseQuery({ url: `/reviews/${id}`, method: 'get',params });

export const createReview = (id, data) =>
  baseQuery({ url: `/reviews/${id}`, method: 'post', data , headers : {Authorization : `Bearer ${getAxiosAccessToken()}`}});

