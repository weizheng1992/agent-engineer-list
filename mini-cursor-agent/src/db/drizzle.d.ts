declare module 'drizzle-orm/postgres-js' {
  export function drizzle(client: any, options?: any): any;
}
declare module 'postgres' {
  const postgres: any;
  export default postgres;
}
declare module 'drizzle-orm/pg-core' {
  interface ColumnBuilder {
    notNull(): ColumnBuilder;
    defaultNow(): ColumnBuilder;
    defaultRandom(): ColumnBuilder;
    primaryKey(): ColumnBuilder;
    references(ref: any, options?: any): ColumnBuilder;
    $type<T = any>(): ColumnBuilder;
  }
  export const pgTable: (name: string, columns: Record<string, any>) => any;
  export const text: (name: string, options?: any) => ColumnBuilder;
  export const timestamp: (name: string, options?: any) => ColumnBuilder;
  export const uuid: (name: string, options?: any) => ColumnBuilder;
  export const jsonb: (name: string, options?: any) => ColumnBuilder;
}
