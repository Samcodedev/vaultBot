export interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  phoneNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  password?: string;
};