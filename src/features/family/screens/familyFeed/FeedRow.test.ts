import type { FeedItemType } from '../../../../shared/types';
import { TYPE_META } from './FeedRow';

describe('FeedRow metadata', () => {
  it.each(['CHECK_IN', 'MEDICATION_LOG', 'EMERGENCY', 'VISIT', 'CAMERA'] as const)(
    'defines safe render metadata for %s',
    (type: FeedItemType) => {
      expect(TYPE_META[type]).toEqual({
        icon: expect.any(String),
        color: expect.any(String),
      });
    },
  );
});
