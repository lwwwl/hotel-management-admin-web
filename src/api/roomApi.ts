import api from './axiosConfig';
import type { ApiResponse, HotelRoom, RoomCreateRequest, RoomDeleteRequest, RoomDetailRequest, RoomListRequest, RoomUpdateRequest } from './types';

export const roomApi = {
  create: async (request: RoomCreateRequest): Promise<ApiResponse<number>> => {
    const res = await api.post('/room/create', request);
    return res.data;
  },
  update: async (request: RoomUpdateRequest): Promise<ApiResponse<boolean>> => {
    const res = await api.post('/room/update', request);
    return res.data;
  },
  delete: async (request: RoomDeleteRequest): Promise<ApiResponse<boolean>> => {
    const res = await api.post('/room/delete', request);
    return res.data;
  },
  detail: async (request: RoomDetailRequest): Promise<ApiResponse<HotelRoom>> => {
    const res = await api.post('/room/detail', request);
    return res.data;
  },
  list: async (request?: RoomListRequest): Promise<ApiResponse<HotelRoom[]>> => {
    const res = await api.post('/room/list', request || {});
    return res.data;
  }
};


