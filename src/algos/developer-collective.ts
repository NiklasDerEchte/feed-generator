import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'

// max 15 chars
export const shortname = 'dev-collective'

export const handler = async (ctx: AppContext, params: QueryParams) => {
  // Begriffe als Arrays
  const includeTerms = [
    'python',
    'github.com',
    'JuliaLang',
    'c++',
    'c#',
    'angular',
    'java',
    'javascript',
    'typescript',
    'linux',
    'devCommunity',
    'coding',
    'technews',
    'techtrends',
  ];
  const excludeTerms = [
    'snake',
    'monty',
    'device test',
    'device tests',
    'anime',
    'monster',
    'monsters',
  ];

  let builder = ctx.db
    .selectFrom('post')
    .selectAll()
    .orderBy('indexedAt', 'desc')
    .orderBy('cid', 'desc')
    .limit(params.limit)

  if (params.cursor) {
    const timeStr = new Date(parseInt(params.cursor, 10)).toISOString();
    builder = builder.where('post.indexedAt', '<', timeStr);
  }

  // LIKE-Klauseln dynamisch mit Arrays
  builder = builder.where((eb) =>
    eb.or(
      includeTerms.map((term) => eb('text', 'like', `%${term}%`))
    )
  );

  builder = builder.where((eb) =>
    eb.and(
      excludeTerms.map((term) => eb('text', 'not like', `%${term}%`))
    )
  );

  const res = await builder.execute();

  const feed = res.map((row) => ({
    post: row.uri,
  }));

  let cursor: string | undefined;
  const last = res.at(-1);
  if (last) {
    cursor = new Date(last.indexedAt).getTime().toString(10);
  }

  return {
    cursor,
    feed,
  };
}