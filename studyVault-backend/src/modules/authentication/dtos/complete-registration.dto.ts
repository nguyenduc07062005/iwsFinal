import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CompleteRegistrationDto {
  @IsString({ message: 'Registration token must be a string' })
  @IsNotEmpty({ message: 'Registration token is required' })
  token: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}
