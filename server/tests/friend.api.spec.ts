import { randomUUID } from 'node:crypto';
import { describe, expect, it, beforeEach } from 'vitest';
import supertest, { type Response } from 'supertest';
import { app } from '../src/app.ts';

let response: Response;
const auth1 = { username: 'user1', password: 'pwd1' };
const auth2 = { username: 'user2', password: 'pwd2' };
const auth3 = { username: 'user3', password: 'pwd3' };

describe('POST /api/friend/request', () => {
  it('should return 400 on ill-formed payload', async () => {
    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 123 } });
    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({ error: 'Poorly-formed request' });
  });

  it('should reject invalid authorization', async () => {
    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: { ...auth1, password: 'wrong' }, payload: { username: 'user2' } });
    expect(response.status).toBe(403);
    expect(response.body).toStrictEqual({ error: 'Invalid credentials' });
  });

  it('should return 404 for nonexistent target user', async () => {
    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'nonexistent' } });
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ error: 'User not found' });
  });

  it('should prevent users from sending friend requests to themselves', async () => {
    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user1' } });
    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({ error: 'Cannot send friend request to yourself' });
  });

  it('should successfully create a friend request', async () => {
    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user2' } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      _id: expect.any(String),
      requester: {
        username: 'user1',
        display: expect.any(String),
        createdAt: expect.anything(),
        bio: '',
        image_url: '',
        preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
        stats: { gamesLost: 0, gamesPlayed: 0, gamesWon: 0, winRate: 0 },
      },
      addressee: {
        username: 'user2',
        display: expect.any(String),
        createdAt: expect.anything(),
        bio: '',
        image_url: '',
        preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
        stats: { gamesLost: 0, gamesPlayed: 0, gamesWon: 0, winRate: 0 },
      },
      status: 'pending',
      createdAt: expect.anything(),
      updatedAt: expect.anything(),
    });
  });

  it('should prevent duplicate friend requests', async () => {
    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user3' } });
    expect(response.status).toBe(200);

    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user3' } });
    expect(response.status).toBe(409);
    expect(response.body).toStrictEqual({ error: 'Friend request already exists' });
  });

  it('should allow a user to re-request if rejected', async () => {
    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user3' } });
    expect(response.status).toBe(200);
    const friendshipId = response.body._id;

    response = await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: auth3, payload: { friendshipId, action: 'reject' } });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('rejected');

    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user3' } });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('pending');
  });

  it('should not allow re-request if friendship is pending', async () => {
    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user2' } });
    expect(response.status).toBe(200);

    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user2' } });
    expect(response.status).toBe(409);
    expect(response.body).toStrictEqual({ error: 'Friend request already exists' });
  });

  it('should not allow re-request if friendship is accepted', async () => {
    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user2' } });
    const friendshipId = response.body._id;

    await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: auth2, payload: { friendshipId, action: 'accept' } });

    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user2' } });
    expect(response.status).toBe(409);
    expect(response.body).toStrictEqual({ error: 'Friend request already exists' });
  });

  it('should update the requester/addressee direction on re-request', async () => {
    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user2' } });
    const originalId = response.body._id;
    expect(response.body.requester.username).toBe('user1');
    expect(response.body.addressee.username).toBe('user2');

    await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: auth2, payload: { friendshipId: originalId, action: 'reject' } });

    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth2, payload: { username: 'user1' } });
    expect(response.status).toBe(200);
    expect(response.body._id).toBe(originalId);
    expect(response.body.requester.username).toBe('user2');
    expect(response.body.addressee.username).toBe('user1');
    expect(response.body.status).toBe('pending');
  });
});

describe('POST /api/friend/respond', () => {
  let friendshipId: string;

  beforeEach(async () => {
    const uniqueUser = randomUUID().toString();
    await supertest(app).post('/api/user/signup').send({ username: uniqueUser, password: 'pwd' });

    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth2, payload: { username: uniqueUser } });
    friendshipId = response.body._id;
  });

  it('should return 400 on ill-formed payload', async () => {
    response = await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: auth1, payload: { friendshipId, action: 123 } });
    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({ error: 'Poorly-formed request' });
  });

  it('should reject invalid authorization', async () => {
    response = await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: { ...auth1, password: 'wrong' }, payload: { friendshipId, action: 'accept' } });
    expect(response.status).toBe(403);
    expect(response.body).toStrictEqual({ error: 'Invalid credentials' });
  });

  it('should return 404 for nonexistent friendship', async () => {
    response = await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: auth1, payload: { friendshipId: randomUUID().toString(), action: 'accept' } });
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ error: 'Friend request not found or invalid' });
  });

  it('should prevent non-addressee from responding', async () => {
    response = await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: auth1, payload: { friendshipId, action: 'accept' } });
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ error: 'Friend request not found or invalid' });
  });

  it('should successfully accept a friend request', async () => {
    const addresseeAuth = { username: response.body.addressee.username, password: 'pwd' };

    response = await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: addresseeAuth, payload: { friendshipId, action: 'accept' } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      _id: friendshipId,
      requester: {
        username: 'user2',
        display: expect.any(String),
        createdAt: expect.anything(),
        bio: '',
        image_url: '',
        preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
        stats: { gamesLost: 0, gamesPlayed: 0, gamesWon: 0, winRate: 0 },
      },
      addressee: {
        username: expect.any(String),
        display: expect.any(String),
        createdAt: expect.anything(),
        bio: '',
        image_url: '',
        preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
        stats: { gamesLost: 0, gamesPlayed: 0, gamesWon: 0, winRate: 0 },
      },
      status: 'accepted',
      createdAt: expect.anything(),
      updatedAt: expect.anything(),
    });
  });

  it('should successfully reject a friend request', async () => {
    const addresseeAuth = { username: response.body.addressee.username, password: 'pwd' };

    response = await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: addresseeAuth, payload: { friendshipId, action: 'reject' } });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('rejected');
  });

  it('should return 400 for invalid action', async () => {
    const addresseeAuth = { username: response.body.addressee.username, password: 'pwd' };

    response = await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: addresseeAuth, payload: { friendshipId, action: 'invalid' } });
    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({ error: 'Poorly-formed request' });
  });

  it('should not allow responding twice to the same request', async () => {
    const addresseeAuth = { username: response.body.addressee.username, password: 'pwd' };

    await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: addresseeAuth, payload: { friendshipId, action: 'accept' } });

    const secondAttempt = await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: addresseeAuth, payload: { friendshipId, action: 'reject' } });

    expect(secondAttempt.status).toBe(404);
    expect(secondAttempt.body).toStrictEqual({ error: 'Friend request not found or invalid' });
  });
});

describe('POST /api/friend/remove', () => {
  let acceptedFriendshipId: string;
  let rejectedFriendshipId: string;
  let pendingFriendshipId: string;

  beforeEach(async () => {
    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user2' } });
    acceptedFriendshipId = response.body._id;

    await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: auth2, payload: { friendshipId: acceptedFriendshipId, action: 'accept' } });

    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user3' } });
    rejectedFriendshipId = response.body._id;

    await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: auth3, payload: { friendshipId: rejectedFriendshipId, action: 'reject' } });

    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth3, payload: { username: 'user2' } });
    pendingFriendshipId = response.body._id;
  });

  it('should return 400 on ill-formed payload', async () => {
    response = await supertest(app)
      .post('/api/friend/remove')
      .send({ auth: auth1, payload: { friendshipId: 123 } });
    expect(response.status).toBe(400);
    expect(response.body).toStrictEqual({ error: 'Poorly-formed request' });
  });

  it('should reject invalid authorization', async () => {
    response = await supertest(app)
      .post('/api/friend/remove')
      .send({
        auth: { ...auth1, password: 'wrong' },
        payload: { friendshipId: acceptedFriendshipId },
      });
    expect(response.status).toBe(403);
    expect(response.body).toStrictEqual({ error: 'Invalid credentials' });
  });

  it('should return 404 for nonexistent friendship', async () => {
    response = await supertest(app)
      .post('/api/friend/remove')
      .send({ auth: auth1, payload: { friendshipId: randomUUID().toString() } });
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ error: 'Friendship not found or cannot be removed.' });
  });

  it('should successfully remove an accepted friendship (as requester)', async () => {
    response = await supertest(app)
      .post('/api/friend/remove')
      .send({ auth: auth1, payload: { friendshipId: acceptedFriendshipId } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      _id: acceptedFriendshipId,
      requester: {
        username: 'user1',
        display: expect.any(String),
        createdAt: expect.anything(),
        bio: '',
        image_url: '',
        preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
        stats: { gamesLost: 0, gamesPlayed: 0, gamesWon: 0, winRate: 0 },
      },
      addressee: {
        username: 'user2',
        display: expect.any(String),
        createdAt: expect.anything(),
        bio: '',
        image_url: '',
        preferences: { colorblind: 'none', theme: 'light', fontSize: 'M', fontFamily: 'default' },
        stats: { gamesLost: 0, gamesPlayed: 0, gamesWon: 0, winRate: 0 },
      },
      status: 'accepted',
      createdAt: expect.anything(),
      updatedAt: expect.anything(),
    });
  });

  it('should successfully remove an accepted friendship (as addressee)', async () => {
    response = await supertest(app)
      .post('/api/friend/remove')
      .send({ auth: auth2, payload: { friendshipId: acceptedFriendshipId } });
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('accepted');
  });

  it('should not allow removing rejected friendships', async () => {
    response = await supertest(app)
      .post('/api/friend/remove')
      .send({ auth: auth1, payload: { friendshipId: rejectedFriendshipId } });
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ error: 'Friendship not found or cannot be removed.' });
  });

  it('should not allow removing pending friendships', async () => {
    response = await supertest(app)
      .post('/api/friend/remove')
      .send({ auth: auth2, payload: { friendshipId: pendingFriendshipId } });
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ error: 'Friendship not found or cannot be removed.' });
  });

  it('should not allow removing friendships user is not part of', async () => {
    response = await supertest(app)
      .post('/api/friend/remove')
      .send({ auth: auth1, payload: { friendshipId: pendingFriendshipId } });
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ error: 'Friendship not found or cannot be removed.' });
  });

  it('should not allow removing same friendship twice', async () => {
    await supertest(app)
      .post('/api/friend/remove')
      .send({ auth: auth1, payload: { friendshipId: acceptedFriendshipId } });

    response = await supertest(app)
      .post('/api/friend/remove')
      .send({ auth: auth1, payload: { friendshipId: acceptedFriendshipId } });
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ error: 'Friendship not found or cannot be removed.' });
  });
});

describe('GET /api/friend/list/:username', () => {
  beforeEach(async () => {
    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user2' } });
    const friendship1Id = response.body._id;
    await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: auth2, payload: { friendshipId: friendship1Id, action: 'accept' } });

    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: 'user3' } });
    const friendship2Id = response.body._id;
    await supertest(app)
      .post('/api/friend/respond')
      .send({ auth: auth3, payload: { friendshipId: friendship2Id, action: 'reject' } });

    await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth3, payload: { username: 'user2' } });
  });

  it('should return 404 for nonexistent user', async () => {
    response = await supertest(app).get('/api/friend/list/nonexistent');
    expect(response.status).toBe(404);
    expect(response.body).toStrictEqual({ error: 'User not found' });
  });

  it('should return empty lists for user with no friendships', async () => {
    const newUser = randomUUID().toString();
    await supertest(app).post('/api/user/signup').send({ username: newUser, password: 'pwd' });

    response = await supertest(app).get(`/api/friend/list/${newUser}`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      accepted: [],
      pending: [],
      rejected: [],
    });
  });

  it('should return all friendship types for user1', async () => {
    response = await supertest(app).get('/api/friend/list/user1');
    expect(response.status).toBe(200);

    expect(response.body.accepted).toHaveLength(1);
    expect(response.body.rejected).toHaveLength(1);
    expect(response.body.pending).toHaveLength(0);

    expect(response.body.accepted[0]).toMatchObject({
      requester: { username: 'user1' },
      addressee: { username: 'user2' },
      status: 'accepted',
    });

    expect(response.body.rejected[0]).toMatchObject({
      requester: { username: 'user1' },
      addressee: { username: 'user3' },
      status: 'rejected',
    });
  });

  it('should return all friendship types for user2', async () => {
    response = await supertest(app).get('/api/friend/list/user2');
    expect(response.status).toBe(200);

    expect(response.body.accepted).toHaveLength(1);
    expect(response.body.rejected).toHaveLength(0);
    expect(response.body.pending).toHaveLength(1);

    expect(response.body.accepted[0]).toMatchObject({
      requester: { username: 'user1' },
      addressee: { username: 'user2' },
      status: 'accepted',
    });

    expect(response.body.pending[0]).toMatchObject({
      requester: { username: 'user3' },
      addressee: { username: 'user2' },
      status: 'pending',
    });
  });

  it('should return bidirectional relationships correctly', async () => {
    const user1Response = await supertest(app).get('/api/friend/list/user1');
    const user1Accepted = user1Response.body.accepted[0];

    const user2Response = await supertest(app).get('/api/friend/list/user2');
    const user2Accepted = user2Response.body.accepted[0];

    expect(user1Accepted._id).toBe(user2Accepted._id);
    expect(user1Accepted.requester.username).toBe('user1');
    expect(user1Accepted.addressee.username).toBe('user2');
    expect(user2Accepted.requester.username).toBe('user1');
    expect(user2Accepted.addressee.username).toBe('user2');
  });

  it('should sort friendships by most recent first', async () => {
    const newUser = randomUUID().toString();
    await supertest(app).post('/api/user/signup').send({ username: newUser, password: 'pwd' });

    await new Promise(resolve => setTimeout(resolve, 10));

    response = await supertest(app)
      .post('/api/friend/request')
      .send({ auth: auth1, payload: { username: newUser } });
    const friendshipId = response.body._id;

    await supertest(app)
      .post('/api/friend/respond')
      .send({
        auth: { username: newUser, password: 'pwd' },
        payload: { friendshipId, action: 'accept' },
      });

    response = await supertest(app).get('/api/friend/list/user1');
    expect(response.status).toBe(200);
    expect(response.body.accepted).toHaveLength(2);

    expect(response.body.accepted[0].addressee.username).toBe(newUser);
    expect(response.body.accepted[1].addressee.username).toBe('user2');
  });
});
