export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  meta?: ApiMeta;
};

export type ApiMeta = {
  total: number;
  page: number;
  limit: number;
};

export type ErrorResponse = {
  success: false;
  error: string;
  statusCode: number;
  timestamp: string;
  path: string;
};
