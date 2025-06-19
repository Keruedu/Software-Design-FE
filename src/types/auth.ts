export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterRequest {
  username: string;
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}
