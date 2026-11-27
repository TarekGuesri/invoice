import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/** Routes are private by default; this opts a controller or route out. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
