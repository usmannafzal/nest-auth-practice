import {IsEmail, IsString, IsStrongPassword} from 'class-validator'

export class SignUpDto{

    @IsString()
    firstName: string;

    @IsString()
    lastName: string

    @IsEmail()
    email: string;

    @IsStrongPassword()
    @IsString()
    password: string;
}