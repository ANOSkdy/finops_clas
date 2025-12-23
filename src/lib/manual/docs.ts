export type ManualDoc = { slug: string; title: string; contentMd: string };
export type ManualDocListItem = Pick<ManualDoc, "slug" | "title">;
