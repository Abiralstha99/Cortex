import assert from "node:assert/strict";
import { test } from "node:test";
import { ensureLocalUser } from "./requireAuth.middleware.js";

test("an authenticated Clerk account missing locally is provisioned once", async () => {
  const rows = new Map<string, { id: string }>();
  let fetched = 0;
  const dependencies = {
    find: async (clerkUserId: string) => rows.get(clerkUserId) ?? null,
    fetch: async () => {
      fetched += 1;
      return {
        username: "study_host",
        primaryEmailAddress: { emailAddress: "host@example.test" },
        emailAddresses: [],
      };
    },
    upsert: async (clerkUserId: string, email: string, username: string) => {
      assert.equal(email, "host@example.test");
      assert.equal(username, "study_host");
      const row = { id: "local-user-id" };
      rows.set(clerkUserId, row);
      return row;
    },
  };

  assert.deepEqual(await ensureLocalUser("clerk-user-id", dependencies), { id: "local-user-id" });
  assert.deepEqual(await ensureLocalUser("clerk-user-id", dependencies), { id: "local-user-id" });
  assert.equal(fetched, 1);
});

test("a Clerk account without an email cannot create an incomplete local user", async () => {
  let inserted = false;
  await assert.rejects(
    ensureLocalUser("clerk-user-id", {
      find: async () => null,
      fetch: async () => ({ username: null, primaryEmailAddress: null, emailAddresses: [] }),
      upsert: async () => {
        inserted = true;
        return { id: "unreachable" };
      },
    }),
    /email address/,
  );
  assert.equal(inserted, false);
});
