import { expect, describe, it } from 'vitest';
import { zFriendRequestPayload, zFriendResponsePayload } from './friend.types.ts';

describe('zFriendRequestPayload', () => {
  it('accepts valid inputs', () => {
    expect(zFriendRequestPayload.safeParse({ username: 'john' })).toStrictEqual({
      success: true,
      data: { username: 'john' },
    });
    expect(zFriendRequestPayload.safeParse({ username: 'jake123' })).toStrictEqual({
      success: true,
      data: { username: 'jake123' },
    });
    expect(zFriendRequestPayload.safeParse({ username: 'user_with_underscore' })).toStrictEqual({
      success: true,
      data: { username: 'user_with_underscore' },
    });
  });

  it('rejects invalid inputs', () => {
    expect(zFriendRequestPayload.safeParse(0)).toMatchObject({ success: false });
    expect(zFriendRequestPayload.safeParse('john')).toMatchObject({ success: false });
    expect(zFriendRequestPayload.safeParse(null)).toMatchObject({ success: false });
    expect(zFriendRequestPayload.safeParse({})).toMatchObject({ success: false });
    expect(zFriendRequestPayload.safeParse({ username: null })).toMatchObject({ success: false });
    expect(zFriendRequestPayload.safeParse({ username: 123 })).toMatchObject({ success: false });
    expect(zFriendRequestPayload.safeParse({ user: 'john' })).toMatchObject({ success: false });
  });
});

describe('zFriendResponsePayload', () => {
  it('accepts valid inputs', () => {
    expect(
      zFriendResponsePayload.safeParse({ friendshipId: 'abc123', action: 'accept' }),
    ).toStrictEqual({
      success: true,
      data: { friendshipId: 'abc123', action: 'accept' },
    });
    expect(
      zFriendResponsePayload.safeParse({
        friendshipId: '507f1f77bcf86cd799439011',
        action: 'reject',
      }),
    ).toStrictEqual({
      success: true,
      data: { friendshipId: '507f1f77bcf86cd799439011', action: 'reject' },
    });
    expect(
      zFriendResponsePayload.safeParse({ friendshipId: 'short_id', action: 'accept' }),
    ).toStrictEqual({
      success: true,
      data: { friendshipId: 'short_id', action: 'accept' },
    });
  });

  it('rejects invalid inputs', () => {
    expect(zFriendResponsePayload.safeParse(0)).toMatchObject({ success: false });
    expect(zFriendResponsePayload.safeParse('accept')).toMatchObject({ success: false });
    expect(zFriendResponsePayload.safeParse(null)).toMatchObject({ success: false });
    expect(zFriendResponsePayload.safeParse({})).toMatchObject({ success: false });

    expect(zFriendResponsePayload.safeParse({ friendshipId: 'abc123' })).toMatchObject({
      success: false,
    });
    expect(zFriendResponsePayload.safeParse({ action: 'accept' })).toMatchObject({
      success: false,
    });

    expect(
      zFriendResponsePayload.safeParse({
        friendshipId: 'abc123',
        action: 'decline',
      }),
    ).toMatchObject({ success: false });
    expect(
      zFriendResponsePayload.safeParse({
        friendshipId: 'abc123',
        action: 'approve',
      }),
    ).toMatchObject({ success: false });
    expect(zFriendResponsePayload.safeParse({ friendshipId: 'abc123', action: '' })).toMatchObject({
      success: false,
    });
    expect(
      zFriendResponsePayload.safeParse({
        friendshipId: 'abc123',
        action: null,
      }),
    ).toMatchObject({ success: false });

    expect(
      zFriendResponsePayload.safeParse({
        friendshipId: null,
        action: 'accept',
      }),
    ).toMatchObject({ success: false });
    expect(zFriendResponsePayload.safeParse({ friendshipId: 123, action: 'accept' })).toMatchObject(
      { success: false },
    );
  });
});
