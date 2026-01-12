export interface User {
  id: number;
  name: string,
  email: string;
  role: string;
  token: string
}

export interface loginResponse{
  cuid: string,
  email: string,
  message: string,
  channel : string,
  reference_masked:string,  
  status:string,
  transaction_id:string
}

export interface VerifyOtpResponse {
  success: boolean;
  user: User;
  error : string;
}
