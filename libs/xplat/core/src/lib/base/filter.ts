import { reduceWhile, filter, startsWith } from 'ramda';
import { Topic } from './model';

/**
 * Filter restricted content based on its prefix url.
 * @param {Topic[]} list List of topic contents.
 * @param {string[]} excludeList List of prefixed string of url should be ignored.
 */
export const filterContent = (list: Topic[], excludeList: string[]) => {

  return filter(
    (topic: Topic) =>
      reduceWhile(
        acc => acc === true,
        (acc, prefix) => {
          return acc && !startsWith(prefix, topic.url);
        },
        true,
        excludeList,
      ),
    list,
  );
}
