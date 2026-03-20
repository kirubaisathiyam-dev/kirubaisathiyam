import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ cacheDir: 'C:/Users/Admin/Documents/Work/Own/kirubaisathiyam/tina/__generated__/.cache/1774033031477', url: 'http://localhost:4001/graphql', token: 'undefined', queries,  });
export default client;
  