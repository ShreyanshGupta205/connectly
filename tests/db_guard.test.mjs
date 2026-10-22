import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeDatabaseUrl } from '../server/services/dbGuard.mjs';

describe('Database Safety Guard (HARD RULE 2)', () => {
  test('aborts with error if database URL points to a Supabase host', () => {
    assert.throws(
      () => assertSafeDatabaseUrl('postgresql://postgres.xyz:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres', 'AGENT_DATABASE_URL'),
      (err) => {
        assert.match(err.message, /\[HARD SAFETY VIOLATION\]/);
        assert.match(err.message, /supabase/i);
        return true;
      }
    );
  });

  test('aborts if raw string contains supabase anywhere', () => {
    assert.throws(
      () => assertSafeDatabaseUrl('postgresql://user:pass@supabase-direct.local:5432/db', 'METRICS_DATABASE_URL'),
      (err) => {
        assert.match(err.message, /\[HARD SAFETY VIOLATION\]/);
        return true;
      }
    );
  });

  test('allows safe local database URLs', () => {
    assert.doesNotThrow(() => {
      assertSafeDatabaseUrl('postgresql://postgres:postgres@localhost:5432/connectly_agent_test', 'LOCAL_DB');
      assertSafeDatabaseUrl('postgresql://agent:agent@127.0.0.1:5432/test_db', 'LOCAL_IP');
      assertSafeDatabaseUrl('sqlite://local.db', 'SQLITE');
    });
  });

  test('safely handles empty or unset connection strings', () => {
    assert.doesNotThrow(() => {
      assertSafeDatabaseUrl('', 'EMPTY');
      assertSafeDatabaseUrl(null, 'NULL');
      assertSafeDatabaseUrl(undefined, 'UNDEFINED');
    });
  });
});
