import * as z from 'zod';

export const SearchValidation = z.object({
    searchString:z.string().nonempty()
});

