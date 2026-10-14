import { expect, it } from 'vitest';
import { assertLocalTarget } from './seed.js';
it('refuses nonlocal, non-demo and production seed targets with valid local controls', () => {
  expect(() =>
    assertLocalTarget('postgresql://u:p@localhost/seatwise_demo', 'local'),
  ).not.toThrow();
  expect(() =>
    assertLocalTarget(
      'postgresql://u:p@localhost/seatwise_test_abc',
      'test',
      true,
    ),
  ).not.toThrow();
  for (const [url, env] of [
    ['postgresql://u:p@db.example.com/seatwise_demo', 'local'],
    ['postgresql://u:p@localhost/customer_data', 'local'],
    ['postgresql://u:p@localhost/seatwise_demo', 'production'],
    ['postgresql://u:p@localhost/seatwise_demo', undefined],
  ])
    expect(() => assertLocalTarget(url!, env)).toThrow();
});
