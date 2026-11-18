import { deepEqual, equal, throws } from 'node:assert/strict';
import { test } from 'node:test';
import { releasePlan } from './release-plan.mjs';

const main = { branch: 'refs/heads/main' };

test('independent app versions have different Git tags and stable image names', () => {
  const tags = ['v0.9.0'];
  const registry = releasePlan('registry-ui', '0.9.0', tags, tags, false, main);
  const website = releasePlan('website', '0.9.0', tags, tags, false, main);
  deepEqual([registry.tag, website.tag], ['v0.9.0', 'website-v0.9.0']);
  deepEqual([registry.imageTag, website.imageTag], ['v0.9.0', 'v0.9.0']);
  deepEqual([registry.image, website.image], ['ghcr.io/crateview/registry-ui', 'ghcr.io/crateview/website']);
  deepEqual([registry.build, registry.release, website.build, website.release], [false, false, true, true]);
});

test('baseline and stale versions do not publish; a tag without a release is recoverable', () => {
  equal(releasePlan('website', '0.4.10', [], [], false, main).build, false);
  equal(releasePlan('registry-ui', '0.8.2', [], [], false, main).release, false);
  equal(releasePlan('website', '0.4.11', ['website-v0.4.12'], [], false, main).release, false);
  const recovery = releasePlan('website', '0.4.11', ['website-v0.4.11'], [], false, main);
  deepEqual([recovery.build, recovery.release], [false, true]);
  throws(() => releasePlan('website', '0.4.11-beta.1', [], [], false, main));
});

test('pending changes create a version PR on main but never publish that app in the same run', () => {
  for (const app of ['registry-ui', 'website']) {
    for (const pending of [true, false]) {
      const plan = releasePlan(app, '1.0.0', [], [], pending, { branch: 'refs/heads/demo' });
      deepEqual([plan.versionPr, plan.build, plan.release], [false, false, false]);
    }
    const plan = releasePlan(app, '1.0.0', [], [], true, main);
    deepEqual([plan.versionPr, plan.build, plan.release], [true, false, false]);
  }
});
