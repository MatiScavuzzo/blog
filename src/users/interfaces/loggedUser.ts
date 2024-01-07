export interface LoggedUser {
  username: string;
  role: string;
}

export interface LoginRequest {
  user: {
    username: string;
    role: string;
  };
}
