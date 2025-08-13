import {
  OutputSchema as RepoEvent,
  isCommit,
} from './lexicon/types/com/atproto/sync/subscribeRepos'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'
import * as db from './db';

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return;

    const ops = await getOpsByType(evt);

    const postsToDelete = ops.posts.deletes.map((del) => del.uri);
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        if (Array.isArray(create.record.langs) && create.record.langs.includes('en')) {
          if (create.record.reply == undefined) {
            //console.log(`📝 ${create.record.text}`);
            return true;
          }
        }
        return false;
      })
      .map((create) => {
        return {
          ...create,
          indexedAt: new Date().toISOString(),
        }
      });

    const PostModel = db.PostModel;

    if (postsToDelete.length > 0) {
      await PostModel.deleteMany({ uri: { $in: postsToDelete } });
    }
    if (postsToCreate.length > 0) {
      for (const post of postsToCreate) {
        try {
          await PostModel.updateOne(
            { uri: post.uri },
            { $setOnInsert: post },
            { upsert: true }
          );
        } catch (e) {
          // Duplicate key error ignorieren
        }
      }
    }
  }
}