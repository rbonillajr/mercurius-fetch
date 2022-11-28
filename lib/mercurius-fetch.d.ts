import { GraphQLSchema } from "graphql";

export function registerFetchHandler(
  schema: GraphQLSchema | any
): Promise<void>;
