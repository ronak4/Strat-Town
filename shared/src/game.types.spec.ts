import { expect, describe, it } from 'vitest';
import { zGuessMove, zNimMove, zSkribblMove } from './game.types.ts';

describe('zNimMove', () => {
  it('accepts valid inputs', () => {
    expect(zNimMove.safeParse(1)).toStrictEqual({ success: true, data: 1 });
    expect(zNimMove.safeParse(2)).toStrictEqual({ success: true, data: 2 });
    expect(zNimMove.safeParse(3)).toStrictEqual({ success: true, data: 3 });
  });

  it('rejects invalid inputs', () => {
    expect(zNimMove.safeParse(0)).toMatchObject({ success: false });
    expect(zNimMove.safeParse(4)).toMatchObject({ success: false });
    expect(zNimMove.safeParse(null)).toMatchObject({ success: false });
  });
});

describe('zGuessMove', () => {
  it('accepts valid inputs', () => {
    expect(zGuessMove.safeParse(1)).toStrictEqual({ success: true, data: 1 });
    expect(zGuessMove.safeParse(2)).toStrictEqual({ success: true, data: 2 });
    expect(zGuessMove.safeParse(17)).toStrictEqual({ success: true, data: 17 });
    expect(zGuessMove.safeParse(100)).toStrictEqual({ success: true, data: 100 });
  });

  it('rejects invalid inputs', () => {
    expect(zGuessMove.safeParse(0)).toMatchObject({ success: false });
    expect(zGuessMove.safeParse(101)).toMatchObject({ success: false });
    expect(zGuessMove.safeParse(-4)).toMatchObject({ success: false });
    expect(zGuessMove.safeParse(undefined)).toMatchObject({ success: false });
    expect(zGuessMove.safeParse('55')).toMatchObject({ success: false });
  });
});

describe('zSkribblMove', () => {
  it('accepts valid inputs', () => {
    expect(zSkribblMove.safeParse('hello')).toMatchObject({ success: true, data: 'hello' });
    expect(zSkribblMove.safeParse('world')).toMatchObject({ success: true, data: 'world' });
    expect(zSkribblMove.safeParse('foo')).toMatchObject({ success: true, data: 'foo' });
  });
  it('rejects invalid inputs', () => {
    expect(zSkribblMove.safeParse('hello1')).toMatchObject({ success: false });
    expect(zSkribblMove.safeParse('hello world')).toMatchObject({ success: false });
    expect(zSkribblMove.safeParse('hello!')).toMatchObject({ success: false });
    expect(zSkribblMove.safeParse('@ekgjb ')).toMatchObject({ success: false });
    expect(zSkribblMove.safeParse(undefined)).toMatchObject({ success: false });
    expect(zSkribblMove.safeParse(0)).toMatchObject({ success: false });
  });
});
