import { QueryParams } from '../lexicon/types/app/bsky/feed/getFeedSkeleton'
import { AppContext } from '../config'
import * as db from '../db'

// max 15 chars
export const shortname = 'devCollective'

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const handler = async (ctx: AppContext, params: QueryParams) => {

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

  try {
    const includeRegex = includeTerms.map(term => new RegExp(escapeRegExp(term), 'i'));
    const excludeRegex = excludeTerms.map(term => new RegExp(escapeRegExp(term), 'i'));

    const filter: any = {
      $and: [
        { $or: includeRegex.map(r => ({ 'record.text': r })) },
        ...excludeRegex.map(r => ({ 'record.text': { $not: r } })),
      ]
    };

    if (params.cursor) {
      const timeStr = new Date(parseInt(params.cursor, 10)).toISOString();
      filter.indexedAt = { $lt: timeStr };
    }

    const res = await db.PostModel.find(filter)
      .sort({ indexedAt: -1 })
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
  } catch (error) {
    console.error('Error in developer-collective handler:', error);
    return {
      cursor: undefined,
      feed: [],
    };
  }
}