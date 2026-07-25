import assert from "node:assert/strict";
import test from "node:test";
import { isMissingColumnError } from "./missingColumn";

test("recunoaște coloana lipsă din codurile Postgres și PostgREST", () => {
  assert.equal(isMissingColumnError({ code: "42703", message: 'column "neighborhood" does not exist' }), true);
  assert.equal(
    isMissingColumnError({
      code: "PGRST204",
      message: "Could not find the 'neighborhood' column of 'listings' in the schema cache",
    }),
    true
  );
  // Unele versiuni întorc doar mesajul, fără un cod pe care să ne bazăm.
  assert.equal(isMissingColumnError({ message: 'column "rooms" does not exist' }), true);
});

test("nu confundă alte erori cu o coloană lipsă", () => {
  assert.equal(isMissingColumnError(null), false);
  assert.equal(isMissingColumnError(undefined), false);
  assert.equal(isMissingColumnError({ code: "23505", message: "duplicate key value violates unique constraint" }), false);
  assert.equal(isMissingColumnError({ code: "PGRST301", message: "JWT expired" }), false);
});

test("poate cere exact coloana care lipsește", () => {
  const error = { code: "PGRST204", message: "Could not find the 'neighborhood' column of 'listings' in the schema cache" };
  assert.equal(isMissingColumnError(error, "neighborhood"), true);
  // Reîncercarea fără câmpurile parserului n-are rost dacă lipsește altceva.
  assert.equal(isMissingColumnError(error, "deleted_at"), false);
});
