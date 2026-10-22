import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

describe('North Star Metric: Profile Activation & Attribution', () => {
  // Activation logic under test
  function isProfileActivated(profile) {
    const linksCount = profile.links?.length || 0;
    const sharesCount = profile.stats?.shares || 0;
    return linksCount >= 3 && sharesCount >= 1;
  }

  function createActivationTracker() {
    const firedEvents = [];
    const storage = new Map();

    function checkAndTriggerActivation(profile, onActivated) {
      if (!isProfileActivated(profile)) {
        return false;
      }

      const cleanUsername = (profile.username || '').trim().toLowerCase();
      const storageKey = `connectly_activated_${cleanUsername}`;

      if (profile.isActivated) {
        return false;
      }

      if (storage.get(storageKey) === 'true') {
        return false;
      }

      storage.set(storageKey, 'true');

      firedEvents.push({
        event: 'activated',
        username: profile.username,
        links_count: profile.links?.length || 0,
        shares_count: profile.stats?.shares || 0,
      });

      if (onActivated) {
        onActivated({
          ...profile,
          isActivated: true,
          activatedAt: new Date().toISOString(),
        });
      }

      return true;
    }

    return { firedEvents, checkAndTriggerActivation, storage };
  }

  test('isProfileActivated requires BOTH 3+ links AND at least 1 share', () => {
    // 0 links, 0 shares
    assert.equal(isProfileActivated({ links: [], stats: { shares: 0 } }), false);

    // 2 links, 0 shares
    assert.equal(isProfileActivated({ links: [{}, {}], stats: { shares: 0 } }), false);

    // 3 links, 0 shares (missing share requirement)
    assert.equal(isProfileActivated({ links: [{}, {}, {}], stats: { shares: 0 } }), false);

    // 0 links, 1 share (missing links requirement)
    assert.equal(isProfileActivated({ links: [], stats: { shares: 1 } }), false);

    // 2 links, 1 share (insufficient links)
    assert.equal(isProfileActivated({ links: [{}, {}], stats: { shares: 1 } }), false);

    // 3 links, 1 share (EXACT activation threshold)
    assert.equal(isProfileActivated({ links: [{}, {}, {}], stats: { shares: 1 } }), true);

    // 5 links, 4 shares (exceeds threshold)
    assert.equal(isProfileActivated({ links: [{}, {}, {}, {}, {}], stats: { shares: 4 } }), true);
  });

  test('fires "activated" event exactly once when profile first meets definition', () => {
    const { firedEvents, checkAndTriggerActivation } = createActivationTracker();

    let profile = {
      username: 'shreyansh',
      links: [{}, {}],
      stats: { shares: 0 },
      isActivated: false,
    };

    // Step 1: User has 2 links and 0 shares
    let didFire = checkAndTriggerActivation(profile, updated => { profile = updated; });
    assert.equal(didFire, false);
    assert.equal(firedEvents.length, 0);

    // Step 2: User adds 3rd link (links: 3, shares: 0)
    profile.links.push({});
    didFire = checkAndTriggerActivation(profile, updated => { profile = updated; });
    assert.equal(didFire, false);
    assert.equal(firedEvents.length, 0);

    // Step 3: User shares profile for the first time (links: 3, shares: 1) -> BECOMES ACTIVATED!
    profile.stats.shares = 1;
    didFire = checkAndTriggerActivation(profile, updated => { profile = updated; });
    assert.equal(didFire, true);
    assert.equal(firedEvents.length, 1);
    assert.equal(firedEvents[0].event, 'activated');
    assert.equal(firedEvents[0].username, 'shreyansh');
    assert.equal(firedEvents[0].links_count, 3);
    assert.equal(firedEvents[0].shares_count, 1);
    assert.equal(profile.isActivated, true);

    // Step 4: User shares again (links: 3, shares: 2) -> MUST NOT FIRE AGAIN
    profile.stats.shares = 2;
    didFire = checkAndTriggerActivation(profile, updated => { profile = updated; });
    assert.equal(didFire, false);
    assert.equal(firedEvents.length, 1, 'Event must not fire a second time');

    // Step 5: User adds a 4th link -> MUST NOT FIRE AGAIN
    profile.links.push({});
    didFire = checkAndTriggerActivation(profile, updated => { profile = updated; });
    assert.equal(didFire, false);
    assert.equal(firedEvents.length, 1, 'Event must not fire a second time');
  });

  test('prevents re-firing across sessions via persistent storage check', () => {
    const { firedEvents, checkAndTriggerActivation, storage } = createActivationTracker();

    // Simulate returning user whose profile state was reset in memory but storage has the record
    storage.set('connectly_activated_alex', 'true');

    const profile = {
      username: 'alex',
      links: [{}, {}, {}],
      stats: { shares: 3 },
      isActivated: false, // in-memory flag lost/unset
    };

    const didFire = checkAndTriggerActivation(profile);
    assert.equal(didFire, false, 'Storage record must prevent re-firing');
    assert.equal(firedEvents.length, 0);
  });

  test('tracks multiple independent user profiles correctly', () => {
    const { firedEvents, checkAndTriggerActivation } = createActivationTracker();

    let userA = { username: 'alice', links: [{}, {}, {}], stats: { shares: 1 }, isActivated: false };
    let userB = { username: 'bob', links: [{}, {}], stats: { shares: 5 }, isActivated: false };

    assert.equal(checkAndTriggerActivation(userA, u => { userA = u; }), true);
    assert.equal(checkAndTriggerActivation(userB, u => { userB = u; }), false);

    assert.equal(firedEvents.length, 1);
    assert.equal(firedEvents[0].username, 'alice');

    // Bob now adds 3rd link
    userB.links.push({});
    assert.equal(checkAndTriggerActivation(userB, u => { userB = u; }), true);
    assert.equal(firedEvents.length, 2);
    assert.equal(firedEvents[1].username, 'bob');
  });
});
