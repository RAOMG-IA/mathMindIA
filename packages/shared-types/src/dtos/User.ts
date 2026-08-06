import type { AcademicLevel } from '@mathmind/shared-domain'

export interface UserDto {
  readonly id: string
  readonly email: string
  readonly academicLevel: AcademicLevel
}
