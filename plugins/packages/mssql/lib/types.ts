export type SourceOptions = {
  database: string;
  host: string;
  instanceName: string;
  port: string;
  username: string;
  password: string;
  connection_options: string[][];
  azure: boolean;
};
export type QueryOptions = {
  operation: string;
  query: string;
  mode: string;
  table: string;
  primary_key_column: string;
  records: Record<string, unknown>[];
  query_params: string[][];
};
