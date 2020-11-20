import { expect } from 'chai';
import { Sleeper } from '../../src/utils';

describe('sleeper', function () {
  it('should be able to sleep 0.1 second', async function() {
    const preSleepMs: number = Date.now();
    await Sleeper.timeout(100);
    const postSleepMs: number = Date.now();
    expect(preSleepMs).lessThan(postSleepMs);
    expect(postSleepMs - preSleepMs <= 150).is.true;
  });
});