import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'
import * as db from '../db'

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

  // Baue dynamisch MongoDB-Filter
  const includeRegex = includeTerms.map(term => new RegExp(term, 'i'));
  const excludeRegex = excludeTerms.map(term => new RegExp(term, 'i'));

  const filter: any = {
    $and: [
      { $or: includeRegex.map(r => ({ text: r })) },
      ...excludeRegex.map(r => ({ text: { $not: r } })),
    ]
  };

  if (params.cursor) {
    const timeStr = new Date(parseInt(params.cursor, 10)).toISOString();
    filter.indexedAt = { $lt: timeStr };
  }

  const res = await db.PostModel.find(filter)
    .sort({ indexedAt: -1, cid: -1 })
    .limit(params.limit)
    .exec();

  const feed = res.map((row: any) => ({
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