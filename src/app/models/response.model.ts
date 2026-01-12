export interface ResponseInterface<T> {
  data: T;
  current_page: number;
  last_page: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ResponseInterfaceE<T> {
  data: T;
  meta: PaginationMeta;
}


export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  path: string;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
}
