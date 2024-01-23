import { IsLowercase, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  surname: string;

  @IsOptional()
  @IsString()
  @IsLowercase()
  role: string; // El rol puede ser "admin" o "user" o puede no estar definido. El valor por defecto es "user".
}
